/* ==========================================================================
   FIÓRE — ADMIN PAGE CONTROLLER
   - Stores orders in localStorage under key "fiore_orders"
   - Expects orders created by app.js completeCheckout()
   ========================================================================== */

(() => {
    const STORAGE_KEY = 'fiore_orders';
    const ADMIN_AUTH_SESSION_KEY = 'fiore_admin_authed';

    try {
        if (sessionStorage.getItem(ADMIN_AUTH_SESSION_KEY) !== 'true') {
            window.location.href = 'index.html';
            return;
        }
    } catch {
        window.location.href = 'index.html';
        return;
    }

    const el = {
        search: document.getElementById('adminSearch'),
        status: document.getElementById('adminStatus'),
        sort: document.getElementById('adminSort'),
        exportCsv: document.getElementById('adminExportCsv'),
        exportJson: document.getElementById('adminExportJson'),
        clearAll: document.getElementById('adminClearAll'),
        seed: document.getElementById('adminSeed'),
        count: document.getElementById('adminCount'),
        tbody: document.getElementById('adminTbody'),
        empty: document.getElementById('adminEmpty'),
        modalOverlay: document.getElementById('adminModalOverlay'),
        modalClose: document.getElementById('adminModalClose'),
        modalTitle: document.getElementById('adminModalTitle'),
        modalBody: document.getElementById('adminModalBody')
    };

    function readOrders() {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            const parsed = raw ? JSON.parse(raw) : [];
            return Array.isArray(parsed) ? parsed : [];
        } catch {
            return [];
        }
    }

    function writeOrders(orders) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(orders));
    }

    function formatDateTime(iso) {
        if (!iso) return '';
        const d = new Date(iso);
        if (Number.isNaN(d.getTime())) return iso;
        return new Intl.DateTimeFormat('vi-VN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        }).format(d);
    }

    function moneyTextFromOrder(order) {
        return order?.totalText || '';
    }

    function statusLabel(status) {
        const map = {
            new: 'Mới',
            processing: 'Đang xử lý',
            completed: 'Hoàn tất',
            cancelled: 'Đã hủy'
        };
        return map[status] || status || '';
    }

    function statusClass(status) {
        const map = {
            new: 'status-new',
            processing: 'status-processing',
            completed: 'status-completed',
            cancelled: 'status-cancelled'
        };
        return map[status] || '';
    }

    function safeText(v) {
        return (v ?? '').toString();
    }

    function matchesQuery(order, q) {
        if (!q) return true;
        const hay = [
            order.id,
            order.sender?.name,
            order.sender?.phone,
            order.sender?.email,
            order.recipient?.name,
            order.recipient?.phone,
            order.recipient?.address,
            order.delivery?.date,
            order.delivery?.timeSlot,
            order.cardMessage,
            ...(order.items || []).map(i => i.title)
        ].join(' ').toLowerCase();
        return hay.includes(q.toLowerCase());
    }

    function getFilteredAndSorted() {
        const orders = readOrders();
        const q = el.search?.value?.trim() || '';
        const status = el.status?.value || 'all';
        const sort = el.sort?.value || 'newest';

        let list = orders.filter(o => matchesQuery(o, q));
        if (status !== 'all') {
            list = list.filter(o => (o.status || 'new') === status);
        }

        if (sort === 'oldest') {
            list = [...list].sort((a, b) => (a.createdAt || '').localeCompare(b.createdAt || ''));
        } else {
            list = [...list].sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
        }
        return list;
    }

    function updateCount(n) {
        if (el.count) el.count.textContent = `${n} đơn hàng`;
    }

    function openModal(order) {
        if (!el.modalOverlay) return;
        el.modalTitle.textContent = `${order.id} • ${statusLabel(order.status)}`;

        const itemsRows = (order.items || []).map(it => {
            const total = (it.singlePrice || 0) * (it.quantity || 0);
            return `
                <tr>
                    <td>${safeText(it.title)}</td>
                    <td>${safeText(it.size || '').toUpperCase()}</td>
                    <td>${safeText(it.quantity)}</td>
                    <td>${safeText(it.singlePrice)}</td>
                    <td>${safeText(total)}</td>
                </tr>
            `;
        }).join('');

        el.modalBody.innerHTML = `
            <div class="detail-card">
                <h4>Khách đặt</h4>
                <div class="kv">
                    <div class="k">Tên</div><div class="v">${safeText(order.sender?.name)}</div>
                    <div class="k">SĐT</div><div class="v">${safeText(order.sender?.phone)}</div>
                    <div class="k">Email</div><div class="v">${safeText(order.sender?.email)}</div>
                </div>
            </div>
            <div class="detail-card">
                <h4>Giao hàng</h4>
                <div class="kv">
                    <div class="k">Người nhận</div><div class="v">${safeText(order.recipient?.name)}</div>
                    <div class="k">SĐT</div><div class="v">${safeText(order.recipient?.phone)}</div>
                    <div class="k">Địa chỉ</div><div class="v">${safeText(order.recipient?.address)}</div>
                    <div class="k">Ngày</div><div class="v">${safeText(order.delivery?.date)}</div>
                    <div class="k">Khung giờ</div><div class="v">${safeText(order.delivery?.timeSlot)}</div>
                </div>
            </div>
            <div class="detail-card items-list">
                <h4>Sản phẩm</h4>
                <table class="items-table">
                    <thead>
                        <tr>
                            <th>Tên</th>
                            <th>Size</th>
                            <th>SL</th>
                            <th>Đơn giá</th>
                            <th>Tổng</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${itemsRows || '<tr><td colspan="5">Không có sản phẩm</td></tr>'}
                    </tbody>
                </table>
            </div>
            <div class="detail-card" style="grid-column: 1 / -1;">
                <h4>Ghi chú</h4>
                <div class="kv">
                    <div class="k">Lời chúc</div><div class="v">${safeText(order.cardMessage)}</div>
                    <div class="k">Thanh toán</div><div class="v">${safeText(order.paymentMethod)}</div>
                    <div class="k">Tổng đơn</div><div class="v">${safeText(moneyTextFromOrder(order))}</div>
                    <div class="k">Tạo lúc</div><div class="v">${safeText(formatDateTime(order.createdAt))}</div>
                </div>
            </div>
        `;

        el.modalOverlay.classList.add('open');
    }

    function closeModal() {
        el.modalOverlay?.classList.remove('open');
    }

    function setStatus(id, status) {
        const orders = readOrders();
        const idx = orders.findIndex(o => o.id === id);
        if (idx === -1) return;
        orders[idx].status = status;
        writeOrders(orders);
        render();
    }

    function removeOrder(id) {
        const orders = readOrders().filter(o => o.id !== id);
        writeOrders(orders);
        render();
    }

    function downloadText(filename, content, mime = 'text/plain') {
        const blob = new Blob([content], { type: mime });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
    }

    function toCsv(orders) {
        const header = [
            'order_id',
            'status',
            'created_at',
            'payment_method',
            'sender_name',
            'sender_phone',
            'sender_email',
            'recipient_name',
            'recipient_phone',
            'recipient_address',
            'delivery_date',
            'delivery_time',
            'total_text',
            'items'
        ];

        const esc = (v) => {
            const s = safeText(v).replace(/\r?\n/g, ' ');
            const needs = /[",]/.test(s);
            const quoted = s.replace(/"/g, '""');
            return needs ? `"${quoted}"` : quoted;
        };

        const rows = orders.map(o => ([
            o.id,
            o.status,
            o.createdAt,
            o.paymentMethod,
            o.sender?.name,
            o.sender?.phone,
            o.sender?.email,
            o.recipient?.name,
            o.recipient?.phone,
            o.recipient?.address,
            o.delivery?.date,
            o.delivery?.timeSlot,
            o.totalText,
            (o.items || []).map(i => `${i.title}(${(i.size || '').toUpperCase()})x${i.quantity}`).join(' | ')
        ]).map(esc).join(','));

        return [header.join(','), ...rows].join('\n');
    }

    function seedDemo() {
        const now = Date.now();
        const demo = [
            {
                id: `FIORE-${Math.floor(100000 + Math.random() * 900000)}`,
                createdAt: new Date(now - 1000 * 60 * 30).toISOString(),
                status: 'new',
                paymentMethod: 'qr',
                sender: { name: 'Nguyễn Văn A', phone: '0901234567', email: 'a@example.com' },
                recipient: { name: 'Lê Thị B', phone: '0988888888', address: 'Quận 1, TP.HCM' },
                delivery: { dateRaw: '', date: '27/05/2026', timeSlot: '10:00 - 12:00' },
                cardMessage: 'Chúc mừng sinh nhật!',
                totalText: '1.250.000đ',
                items: [
                    { id: 'bouquet_1', title: 'Thơ Ngây Rose Bouquet', size: 'standard', singlePrice: 750000, quantity: 1, image: '', cardMessage: '' },
                    { id: 'bouquet_2', title: 'Ánh Dương Tulip Bowl', size: 'deluxe', singlePrice: 1200000, quantity: 1, image: '', cardMessage: '' }
                ]
            }
        ];
        const current = readOrders();
        writeOrders([...demo, ...current]);
        render();
    }

    function render() {
        const list = getFilteredAndSorted();
        updateCount(list.length);

        if (!el.tbody) return;
        el.tbody.innerHTML = '';

        if (list.length === 0) {
            el.empty.style.display = 'block';
            el.tbody.parentElement.style.display = 'none';
            return;
        }

        el.empty.style.display = 'none';
        el.tbody.parentElement.style.display = '';

        list.forEach(order => {
            const tr = document.createElement('tr');
            const created = formatDateTime(order.createdAt);
            const sender = safeText(order.sender?.name);
            const phone = safeText(order.sender?.phone);
            const recipient = safeText(order.recipient?.name);
            const delivery = `${safeText(order.delivery?.date)} • ${safeText(order.delivery?.timeSlot)}`;
            const total = safeText(moneyTextFromOrder(order));

            tr.innerHTML = `
                <td>
                    <div class="order-id">${safeText(order.id)}</div>
                    <div class="order-sub">${created}</div>
                </td>
                <td>
                    <div><strong>${sender}</strong></div>
                    <div class="order-sub">${phone}</div>
                </td>
                <td>
                    <div><strong>${recipient}</strong></div>
                    <div class="order-sub">${delivery}</div>
                </td>
                <td>${total}</td>
                <td>
                    <span class="status-pill ${statusClass(order.status)}">${statusLabel(order.status)}</span>
                </td>
                <td>
                    <div class="row-actions">
                        <button class="btn-mini" data-action="view" data-id="${safeText(order.id)}">Xem</button>
                        <button class="btn-mini primary" data-action="next" data-id="${safeText(order.id)}">Chuyển trạng thái</button>
                        <button class="btn-mini danger" data-action="delete" data-id="${safeText(order.id)}">Xóa</button>
                    </div>
                </td>
            `;
            el.tbody.appendChild(tr);
        });
    }

    function nextStatus(current) {
        const flow = ['new', 'processing', 'completed', 'cancelled'];
        const idx = Math.max(0, flow.indexOf(current || 'new'));
        return flow[(idx + 1) % flow.length];
    }

    function bindEvents() {
        const rerender = () => render();

        el.search?.addEventListener('input', rerender);
        el.status?.addEventListener('change', rerender);
        el.sort?.addEventListener('change', rerender);

        el.exportCsv?.addEventListener('click', () => {
            const orders = getFilteredAndSorted();
            const csv = toCsv(orders);
            downloadText(`fiore-orders-${Date.now()}.csv`, csv, 'text/csv;charset=utf-8');
        });

        el.exportJson?.addEventListener('click', () => {
            const orders = getFilteredAndSorted();
            downloadText(`fiore-orders-${Date.now()}.json`, JSON.stringify(orders, null, 2), 'application/json');
        });

        el.clearAll?.addEventListener('click', () => {
            const ok = confirm('Xóa toàn bộ đơn hàng đã lưu? Hành động này không thể hoàn tác.');
            if (!ok) return;
            writeOrders([]);
            render();
        });

        el.seed?.addEventListener('click', () => {
            seedDemo();
        });

        el.tbody?.addEventListener('click', (e) => {
            const btn = e.target.closest('button');
            if (!btn) return;
            const id = btn.getAttribute('data-id');
            const action = btn.getAttribute('data-action');
            const orders = readOrders();
            const order = orders.find(o => o.id === id);
            if (!order) return;

            if (action === 'view') {
                openModal(order);
            } else if (action === 'next') {
                setStatus(id, nextStatus(order.status));
            } else if (action === 'delete') {
                const ok = confirm(`Xóa đơn ${id}?`);
                if (!ok) return;
                removeOrder(id);
            }
        });

        el.modalClose?.addEventListener('click', closeModal);
        el.modalOverlay?.addEventListener('click', (e) => {
            if (e.target === el.modalOverlay) closeModal();
        });

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') closeModal();
        });
    }

    bindEvents();
    render();
})();

