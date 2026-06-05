/* ==========================================================================
   FIÓRE — Express server (static site + VNPay Sandbox API)
   Chạy: npm run dev  →  http://localhost:3000
   ========================================================================== */
require('dotenv').config();
const path = require('path');
const express = require('express');
const cors = require('cors');
const { createPaymentUrl, verifyVnpayCallback, sanitizeOrderInfo } = require('./vnpay');

const PORT = Number(process.env.PORT) || 3000;
const APP_URL = (process.env.APP_URL || `http://localhost:${PORT}`).replace(/\/$/, '');

const VNPAY_TMN_CODE = process.env.VNPAY_TMN_CODE || '';
const VNPAY_HASH_SECRET = process.env.VNPAY_HASH_SECRET || '';
const VNPAY_URL =
    process.env.VNPAY_URL || 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html';

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '..')));

function getClientIp(req) {
    const forwarded = req.headers['x-forwarded-for'];
    if (forwarded) return forwarded.split(',')[0].trim();
    return req.socket?.remoteAddress?.replace('::ffff:', '') || '127.0.0.1';
}

function getBaseUrl(req) {
    if (process.env.APP_URL) {
        return process.env.APP_URL.replace(/\/$/, '');
    }
    const protocol = req.headers['x-forwarded-proto'] || 'http';
    const host = req.headers.host || `localhost:${PORT}`;
    return `${protocol}://${host}`;
}

function vnpayConfigured() {
    return Boolean(VNPAY_TMN_CODE && VNPAY_HASH_SECRET);
}

/** Tạo URL thanh toán VNPay Sandbox */
app.post('/api/vnpay/create-payment', (req, res) => {
    if (!vnpayConfigured()) {
        return res.status(503).json({
            success: false,
            message:
                'Chưa cấu hình VNPay. Sao chép .env.example thành .env và điền VNPAY_TMN_CODE, VNPAY_HASH_SECRET từ https://sandbox.vnpayment.vn'
        });
    }

    const { amount, txnRef, orderInfo } = req.body || {};
    const amountNum = Number(amount);

    if (!amountNum || amountNum < 1000) {
        return res.status(400).json({
            success: false,
            message: 'Số tiền thanh toán không hợp lệ (tối thiểu 1.000đ).'
        });
    }

    const ref =
        (txnRef && String(txnRef).slice(0, 50)) ||
        `FIORE${Date.now()}`.slice(0, 50);

    const info = sanitizeOrderInfo(
        orderInfo || `Thanh toan don hang ${ref}`
    );

    try {
        const paymentUrl = createPaymentUrl({
            tmnCode: VNPAY_TMN_CODE,
            hashSecret: VNPAY_HASH_SECRET,
            vnpUrl: VNPAY_URL,
            amountVnd: amountNum,
            txnRef: ref,
            orderInfo: info,
            returnUrl: `${getBaseUrl(req)}/vnpay-return.html`,
            ipAddr: getClientIp(req)
        });

        return res.json({
            success: true,
            paymentUrl,
            txnRef: ref
        });
    } catch (err) {
        console.error('[VNPay] create-payment:', err);
        return res.status(500).json({
            success: false,
            message: 'Không tạo được liên kết thanh toán VNPay.'
        });
    }
});

/** Xác minh chữ ký khi VNPay redirect về (Return URL) */
app.get('/api/vnpay/verify', (req, res) => {
    if (!vnpayConfigured()) {
        return res.status(503).json({
            success: false,
            message: 'VNPay chưa được cấu hình trên server.'
        });
    }

    const result = verifyVnpayCallback(req.query, VNPAY_HASH_SECRET);

    return res.json({
        success: result.isValid && result.isSuccess,
        isValid: result.isValid,
        isSuccess: result.isSuccess,
        responseCode: result.responseCode,
        txnRef: result.txnRef,
        amount: result.amount,
        transactionNo: result.transactionNo,
        bankCode: result.bankCode,
        message: result.message
    });
});

/** IPN — VNPay gọi khi có kết quả (cần URL public khi deploy) */
app.get('/api/vnpay/ipn', (req, res) => {
    if (!vnpayConfigured()) {
        return res.status(503).json({ RspCode: '99', Message: 'Not configured' });
    }

    const result = verifyVnpayCallback(req.query, VNPAY_HASH_SECRET);

    if (!result.isValid) {
        return res.status(200).json({ RspCode: '97', Message: 'Invalid signature' });
    }

    if (result.isSuccess) {
        console.log('[VNPay IPN] Thanh toán OK:', result.txnRef, result.amount);
        return res.status(200).json({ RspCode: '00', Message: 'Confirm Success' });
    }

    return res.status(200).json({ RspCode: '00', Message: 'Confirm Success' });
});

app.get('/api/vnpay/status', (req, res) => {
    res.json({
        configured: vnpayConfigured(),
        sandbox: true,
        returnUrl: `${getBaseUrl(req)}/vnpay-return.html`
    });
});

if (require.main === module) {
    app.listen(PORT, () => {
        console.log(`\n🌸 Fióre server: ${APP_URL}`);
        if (!vnpayConfigured()) {
            console.warn(
                '⚠️  VNPay: chưa có .env — xem .env.example và đăng ký Sandbox tại https://sandbox.vnpayment.vn\n'
            );
        } else {
            console.log('✓  VNPay Sandbox đã cấu hình (TMN:', VNPAY_TMN_CODE, ')\n');
        }
    });
}

module.exports = app;
