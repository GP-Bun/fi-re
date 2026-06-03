/* ==========================================================================
   VNPay Return URL — xác minh, hoàn tất đơn hàng & gửi email
   ========================================================================== */
(function () {
    const ORDERS_KEY = 'fiore_orders';
    const CART_KEY = 'fiore_cart';
    const PENDING_KEY = 'fiore_vnpay_pending';

    const card = document.getElementById('vnpayResultCard');
    const loading = document.getElementById('vnpayLoading');
    const statusText = document.getElementById('vnpayStatusText');

    function formatCurrency(val) {
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' })
            .format(val)
            .replace('₫', 'đ');
    }

    function readOrders() {
        try {
            const raw = localStorage.getItem(ORDERS_KEY);
            const parsed = raw ? JSON.parse(raw) : [];
            return Array.isArray(parsed) ? parsed : [];
        } catch {
            return [];
        }
    }

    function writeOrders(orders) {
        localStorage.setItem(ORDERS_KEY, JSON.stringify(orders));
    }

    function renderResult({ success, title, message, txnRef, amount, emailMessage, emailOk }) {
        loading?.remove();
        if (!card) return;

        const iconClass = success ? 'success' : 'fail';
        const icon = success ? '✓' : '✕';

        let emailBlock = '';
        if (emailMessage) {
            const emailColor = emailOk ? '#2d6a4f' : '#c0392b';
            const emailIcon = emailOk ? '✅' : '❌';
            emailBlock = `
                <p class="vnpay-result-detail vnpay-email-status" style="color:${emailColor}; margin-top:12px;">
                    ${emailIcon} ${emailMessage}
                </p>
            `;
        }

        card.innerHTML = `
            <div class="vnpay-result-icon ${iconClass}">${icon}</div>
            <h1>${title}</h1>
            <p class="vnpay-result-detail">${message}</p>
            ${txnRef ? `<p class="vnpay-result-detail"><strong>Mã giao dịch:</strong> ${txnRef}</p>` : ''}
            ${amount ? `<p class="vnpay-result-detail"><strong>Số tiền:</strong> ${formatCurrency(amount)}</p>` : ''}
            ${emailBlock}
            <div class="vnpay-result-actions">
                <a href="index.html" class="btn btn-primary">Về trang chủ</a>
                <a href="shop.html" class="btn btn-secondary">Tiếp tục mua sắm</a>
            </div>
        `;
    }

    function showSendingEmail() {
        if (!card) return;
        loading?.remove();
        card.innerHTML = `
            <div class="vnpay-spinner"></div>
            <p class="vnpay-result-detail">Thanh toán thành công. Đang gửi email xác nhận...</p>
        `;
    }

    function finalizeOrder(pending, verifyData) {
        const orders = readOrders();
        const orderId = pending.orderId || `FIORE-${Math.floor(100000 + Math.random() * 900000)}`;

        orders.unshift({
            id: orderId,
            createdAt: new Date().toISOString(),
            status: 'new',
            paymentMethod: 'vnpay',
            vnpayTxnRef: verifyData.txnRef,
            vnpayTransactionNo: verifyData.transactionNo,
            sender: pending.sender,
            recipient: pending.recipient,
            delivery: pending.delivery,
            cardMessage: pending.cardMessage,
            totalText: pending.totalText,
            discountCode: pending.discountCode || null,
            discountAmount: pending.discountAmount || 0,
            items: pending.items || []
        });

        writeOrders(orders);
        localStorage.setItem(CART_KEY, '[]');
        sessionStorage.removeItem(PENDING_KEY);

        return orderId;
    }

    async function sendConfirmationEmails(pending) {
        if (!window.FioreOrderEmails) {
            return {
                ok: false,
                message: 'Không tải được module gửi email. Đơn đã lưu — vui lòng liên hệ cửa hàng.'
            };
        }
        return window.FioreOrderEmails.send(
            window.FioreOrderEmails.fromVnpayPending(pending)
        );
    }

    async function run() {
        const params = new URLSearchParams(window.location.search);

        if (!params.has('vnp_TxnRef')) {
            renderResult({
                success: false,
                title: 'Không có dữ liệu thanh toán',
                message: 'Liên kết không hợp lệ hoặc bạn đã hủy thanh toán.'
            });
            return;
        }

        try {
            const verifyRes = await fetch(
                `/api/vnpay/verify?${params.toString()}`
            );
            const verify = await verifyRes.json();

            if (!verify.isValid) {
                renderResult({
                    success: false,
                    title: 'Xác minh thất bại',
                    message:
                        'Chữ ký giao dịch không hợp lệ. Vui lòng liên hệ cửa hàng nếu đã bị trừ tiền.',
                    txnRef: verify.txnRef
                });
                return;
            }

            if (!verify.isSuccess) {
                renderResult({
                    success: false,
                    title: 'Thanh toán chưa thành công',
                    message:
                        verify.message +
                        (verify.responseCode ? ` (Mã: ${verify.responseCode})` : '') +
                        '. Bạn có thể thử lại từ giỏ hàng.',
                    txnRef: verify.txnRef
                });
                return;
            }

            let pending = null;
            try {
                const raw = sessionStorage.getItem(PENDING_KEY);
                pending = raw ? JSON.parse(raw) : null;
            } catch {
                pending = null;
            }

            if (pending && pending.txnRef === verify.txnRef) {
                finalizeOrder(pending, verify);
                showSendingEmail();

                const emailResult = await sendConfirmationEmails(pending);

                renderResult({
                    success: true,
                    title: 'Thanh toán VNPay thành công!',
                    message:
                        'Đơn hàng của bạn đã được ghi nhận. Fióre sẽ liên hệ xác nhận trong thời gian sớm nhất.',
                    txnRef: verify.txnRef,
                    amount: verify.amount,
                    emailMessage: emailResult.message,
                    emailOk: emailResult.ok
                });
            } else {
                renderResult({
                    success: true,
                    title: 'Thanh toán thành công',
                    message:
                        'Giao dịch VNPay đã được xác nhận. Nếu giỏ hàng vẫn còn sản phẩm, vui lòng liên hệ hotline để đối chiếu đơn.',
                    txnRef: verify.txnRef,
                    amount: verify.amount
                });
            }
        } catch (err) {
            console.error(err);
            renderResult({
                success: false,
                title: 'Lỗi kết nối',
                message:
                    'Không thể xác minh với server. Hãy chạy npm run dev và thử lại.'
            });
        }
    }

    run();
})();
