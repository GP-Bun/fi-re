/* ==========================================================================
   FIÓRE — Gửi email xác nhận đơn hàng (EmailJS, dùng chung QR & VNPay)
   ========================================================================== */
window.FioreOrderEmails = (function () {
    const EMAILJS_CONFIG = {
        publicKey: 'dGSBNHhWHnMI8oIZ-',
        serviceId: 'service_z9ucei6',
        customerTemplateId: 'template_14f3loq',
        storeTemplateId: 'template_a7n2f3l',
        storeEmail: 'thuyvanngo35@gmail.com'
    };

    function formatCurrency(val) {
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' })
            .format(val)
            .replace('₫', 'đ');
    }

    function buildCartItemsText(items) {
        if (!items || !items.length) return '';
        return items
            .map(
                (item) =>
                    `${item.title} (${(item.size || 'standard').toUpperCase()}) x${item.quantity} = ${formatCurrency((item.singlePrice || 0) * (item.quantity || 1))}`
            )
            .join(' | ');
    }

  /**
   * @param {object} data — orderId, sender, senderPhone, senderEmail, recipient,
   *   recipientPhone, address, deliveryDate, deliveryTime, cardMessage,
   *   cartItemsText, orderTotal, paymentMethod (optional)
   */
    async function send(data) {
        if (!data?.senderEmail) {
            return { ok: false, message: 'Thiếu email người đặt.' };
        }

        if (EMAILJS_CONFIG.publicKey === 'YOUR_PUBLIC_KEY') {
            return {
                ok: false,
                message: 'EmailJS chưa được cấu hình trên website.'
            };
        }

        if (typeof emailjs === 'undefined') {
            return {
                ok: false,
                message: 'Thư viện EmailJS chưa được tải.'
            };
        }

        const paymentNote =
            data.paymentMethod === 'vnpay'
                ? 'VNPay'
                : data.paymentMethod === 'qr'
                  ? 'Chuyển khoản QR'
                  : data.paymentMethod || 'Thanh toán online';

        const templateParams = {
            order_id: data.orderId,
            sender_name: data.sender,
            sender_phone: data.senderPhone,
            sender_email: data.senderEmail,
            recipient_name: data.recipient,
            recipient_phone: data.recipientPhone,
            recipient_address: data.address,
            delivery_date: data.deliveryDate,
            delivery_time: data.deliveryTime,
            card_message: data.cardMessage,
            cart_items: data.cartItemsText || '',
            order_total: data.orderTotal,
            payment_method: paymentNote,
            store_email: EMAILJS_CONFIG.storeEmail
        };

        try {
            emailjs.init({ publicKey: EMAILJS_CONFIG.publicKey });

            await emailjs.send(
                EMAILJS_CONFIG.serviceId,
                EMAILJS_CONFIG.customerTemplateId,
                { ...templateParams, to_email: data.senderEmail, to_name: data.sender }
            );

            await emailjs.send(
                EMAILJS_CONFIG.serviceId,
                EMAILJS_CONFIG.storeTemplateId,
                { ...templateParams, to_email: EMAILJS_CONFIG.storeEmail, to_name: 'Fiòre' }
            );

            return {
                ok: true,
                message: `Email xác nhận đã gửi tới ${data.senderEmail}.`
            };
        } catch (error) {
            console.error('EmailJS error:', error);
            return {
                ok: false,
                message:
                    'Không gửi được email. Vui lòng liên hệ hotline 0916044683 để xác nhận đơn hàng.'
            };
        }
    }

    /** Tạo payload email từ đơn pending VNPay (sessionStorage) */
    function fromVnpayPending(pending) {
        return {
            orderId: pending.orderId,
            sender: pending.sender?.name,
            senderPhone: pending.sender?.phone,
            senderEmail: pending.sender?.email,
            recipient: pending.recipient?.name,
            recipientPhone: pending.recipient?.phone,
            address: pending.recipient?.address,
            deliveryDate: pending.delivery?.date,
            deliveryTime: pending.delivery?.timeSlot,
            cardMessage: pending.cardMessage,
            cartItemsText: buildCartItemsText(pending.items),
            orderTotal: pending.totalText,
            paymentMethod: 'vnpay'
        };
    }

    return {
        EMAILJS_CONFIG,
        formatCurrency,
        buildCartItemsText,
        fromVnpayPending,
        send
    };
})();
