/* ==========================================================================
   VNPay Sandbox — ký URL & xác minh (theo tài liệu VNPay chính thức)
   ========================================================================== */
const crypto = require('crypto');

function sortObject(obj) {
    const sorted = {};
    Object.keys(obj)
        .sort()
        .forEach((key) => {
            sorted[key] = obj[key];
        });
    return sorted;
}

/** Chuỗi ký: key=value&... với value đã encodeURIComponent, space → + */
function toVnpSignString(params) {
    return Object.keys(params)
        .sort()
        .map((key) => {
            const value = String(params[key]);
            const encoded = encodeURIComponent(value).replace(/%20/g, '+');
            return `${key}=${encoded}`;
        })
        .join('&');
}

function createSecureHash(signData, secret) {
    return crypto.createHmac('sha512', secret).update(signData, 'utf-8').digest('hex');
}

/** Giờ Việt Nam (GMT+7) cho vnp_CreateDate / vnp_ExpireDate */
function getVietnamNow() {
    const now = new Date();
    const utcMs = now.getTime() + now.getTimezoneOffset() * 60000;
    return new Date(utcMs + 7 * 3600000);
}

function formatVnpDate(date) {
    const pad = (n) => String(n).padStart(2, '0');
    return (
        date.getFullYear() +
        pad(date.getMonth() + 1) +
        pad(date.getDate()) +
        pad(date.getHours()) +
        pad(date.getMinutes()) +
        pad(date.getSeconds())
    );
}

/** OrderInfo: không dấu, không ký tự đặc biệt (theo quy định VNPay) */
function sanitizeOrderInfo(text) {
    return String(text || '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/đ/g, 'd')
        .replace(/Đ/g, 'D')
        .replace(/[^a-zA-Z0-9\s]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
        .slice(0, 255) || 'Thanh toan don hang FIORE';
}

function createPaymentUrl({
    tmnCode,
    hashSecret,
    vnpUrl,
    amountVnd,
    txnRef,
    orderInfo,
    returnUrl,
    ipAddr,
    locale = 'vn',
    orderType = 'other'
}) {
    const now = getVietnamNow();
    const expire = new Date(now.getTime() + 15 * 60 * 1000);

    const vnpParams = sortObject({
        vnp_Version: '2.1.0',
        vnp_Command: 'pay',
        vnp_TmnCode: tmnCode,
        vnp_Amount: String(Math.round(amountVnd) * 100),
        vnp_CurrCode: 'VND',
        vnp_TxnRef: String(txnRef).slice(0, 100),
        vnp_OrderInfo: sanitizeOrderInfo(orderInfo),
        vnp_OrderType: orderType,
        vnp_Locale: locale,
        vnp_ReturnUrl: returnUrl,
        vnp_IpAddr: ipAddr || '127.0.0.1',
        vnp_CreateDate: formatVnpDate(now),
        vnp_ExpireDate: formatVnpDate(expire)
    });

    const signData = toVnpSignString(vnpParams);
    const secureHash = createSecureHash(signData, hashSecret);

    const base = vnpUrl.replace(/\?$/, '');
    return `${base}?${signData}&vnp_SecureHash=${secureHash}`;
}

function verifyVnpayCallback(query, hashSecret) {
    const params = { ...query };
    const receivedHash = params.vnp_SecureHash;
    delete params.vnp_SecureHash;
    delete params.vnp_SecureHashType;

    const sorted = sortObject(params);
    const signData = toVnpSignString(sorted);
    const calculated = createSecureHash(signData, hashSecret);
    const isValid = receivedHash === calculated;
    const isSuccess = params.vnp_ResponseCode === '00';

    return {
        isValid,
        isSuccess,
        responseCode: params.vnp_ResponseCode,
        txnRef: params.vnp_TxnRef,
        amount: params.vnp_Amount ? Number(params.vnp_Amount) / 100 : 0,
        transactionNo: params.vnp_TransactionNo,
        bankCode: params.vnp_BankCode,
        payDate: params.vnp_PayDate,
        orderInfo: params.vnp_OrderInfo,
        message: params.vnp_ResponseCode === '00' ? 'Giao dịch thành công' : 'Giao dịch không thành công'
    };
}

module.exports = {
    createPaymentUrl,
    verifyVnpayCallback,
    formatVnpDate,
    sanitizeOrderInfo,
    toVnpSignString
};
