/* ==========================================================================
   FIÓRE — PREMIUM ADMIN PAGE CONTROLLER
   ========================================================================== */

(() => {
    // Authenticate check
    const ADMIN_AUTH_SESSION_KEY = 'fiore_admin_authed';
    
    let isAuthed = false;
    try {
        isAuthed = sessionStorage.getItem(ADMIN_AUTH_SESSION_KEY) === 'true';
    } catch {}

    if (!isAuthed) {
        // Show login screen, hide main content
        const loginContent = document.getElementById('adminLoginContent');
        const mainContent = document.getElementById('adminMainContent');
        // Login screen is already visible by default (no admin-hidden class)
        // Just ensure main content is hidden
        if (mainContent) mainContent.classList.add('admin-hidden');
        if (loginContent) loginContent.classList.remove('admin-hidden');

        // Bind login form
        const loginForm = document.getElementById('adminLoginForm');
        const usernameInput = document.getElementById('adminUser');
        const passwordInput = document.getElementById('adminPass');
        const errorMsg = document.getElementById('adminLoginError');

        if (loginForm) {
            loginForm.addEventListener('submit', (e) => {
                e.preventDefault();
                const user = usernameInput ? usernameInput.value.trim() : '';
                const pass = passwordInput ? passwordInput.value : '';

                if (user === 'admin' && pass === 'admin123') {
                    try {
                        sessionStorage.setItem(ADMIN_AUTH_SESSION_KEY, 'true');
                        window.location.reload();
                    } catch (err) {
                        alert('Không thể lưu phiên đăng nhập. Vui lòng kiểm tra cài đặt trình duyệt.');
                    }
                } else {
                    if (errorMsg) {
                        errorMsg.textContent = 'Tên đăng nhập hoặc mật khẩu không chính xác.';
                        errorMsg.style.display = 'block';
                    }
                }
            });
        }
        return;
    }

    // If authenticated, show main content, hide login screen
    const loginContent = document.getElementById('adminLoginContent');
    const mainContent = document.getElementById('adminMainContent');
    if (loginContent) loginContent.classList.add('admin-hidden');
    if (mainContent) mainContent.classList.remove('admin-hidden');


    // Storage Keys
    const ORDERS_KEY = 'fiore_orders';
    const PRODUCTS_KEY = 'fiore_products';
    const COUPONS_KEY = 'fiore_coupons';

    // Global state
    let activeTab = 'dashboard';

    // DOM Elements Cache
    const el = {
        // Sidebar tabs
        menuItems: document.querySelectorAll('.sidebar-menu-item'),
        sections: document.querySelectorAll('.admin-section'),

        // Stats
        statRevenue: document.getElementById('statRevenue'),
        statOrders: document.getElementById('statOrders'),
        statOrdersSub: document.getElementById('statOrdersSub'),
        statCustomers: document.getElementById('statCustomers'),
        statDiscounts: document.getElementById('statDiscounts'),
        statDiscountsSub: document.getElementById('statDiscountsSub'),

        // Dashboard Elements
        barNew: document.getElementById('barNew'),
        barNewPct: document.getElementById('barNewPct'),
        barProcessing: document.getElementById('barProcessing'),
        barProcessingPct: document.getElementById('barProcessingPct'),
        barCompleted: document.getElementById('barCompleted'),
        barCompletedPct: document.getElementById('barCompletedPct'),
        barCancelled: document.getElementById('barCancelled'),
        barCancelledPct: document.getElementById('barCancelledPct'),
        dashTopProductsTbody: document.getElementById('dashTopProductsTbody'),
        dashRecentOrdersTbody: document.getElementById('dashRecentOrdersTbody'),

        // Orders Tab
        orderSearch: document.getElementById('adminSearch'),
        orderStatus: document.getElementById('adminStatus'),
        orderSort: document.getElementById('adminSort'),
        orderExportCsv: document.getElementById('adminExportCsv'),
        orderExportJson: document.getElementById('adminExportJson'),
        orderClearAll: document.getElementById('adminClearAll'),
        orderSeed: document.getElementById('adminSeed'),
        orderCount: document.getElementById('adminCount'),
        orderTbody: document.getElementById('adminTbody'),
        orderEmpty: document.getElementById('adminEmpty'),

        // Products Tab
        prodSearch: document.getElementById('productSearch'),
        prodCategoryFilter: document.getElementById('productCategoryFilter'),
        prodCount: document.getElementById('productCount'),
        prodTbody: document.getElementById('productTbody'),
        btnOpenAddProductModal: document.getElementById('btnOpenAddProductModal'),
        btnResetDefaultProducts: document.getElementById('btnResetDefaultProducts'),

        // Customers Tab
        custSearch: document.getElementById('customerSearch'),
        custCount: document.getElementById('customerCount'),
        custTbody: document.getElementById('customerTbody'),

        // Discounts Tab
        couponSearch: document.getElementById('couponSearch'),
        couponCount: document.getElementById('couponCount'),
        couponTbody: document.getElementById('couponTbody'),
        btnOpenAddCouponModal: document.getElementById('btnOpenAddCouponModal'),

        // Modals overlay
        orderModalOverlay: document.getElementById('adminModalOverlay'),
        orderModalClose: document.getElementById('adminModalClose'),
        orderModalTitle: document.getElementById('adminModalTitle'),
        orderModalBody: document.getElementById('adminModalBody'),

        prodModalOverlay: document.getElementById('productModalOverlay'),
        prodModalTitle: document.getElementById('productModalTitle'),
        prodForm: document.getElementById('productForm'),
        prodFormId: document.getElementById('prodFormId'),
        prodTitle: document.getElementById('prodTitle'),
        prodCategory: document.getElementById('prodCategory'),
        prodPrice: document.getElementById('prodPrice'),
        prodImage: document.getElementById('prodImage'),
        prodTag: document.getElementById('prodTag'),
        prodDescription: document.getElementById('prodDescription'),
        prodFeatured: document.getElementById('prodFeatured'),
        btnProdModalClose: document.getElementById('btnProductModalClose'),
        btnProdFormCancel: document.getElementById('btnProductFormCancel'),

        couponModalOverlay: document.getElementById('couponModalOverlay'),
        couponModalTitle: document.getElementById('couponModalTitle'),
        couponForm: document.getElementById('couponForm'),
        couponFormOldCode: document.getElementById('couponFormOldCode'),
        couponCode: document.getElementById('couponCode'),
        couponType: document.getElementById('couponType'),
        couponValue: document.getElementById('couponValue'),
        couponMinOrder: document.getElementById('couponMinOrder'),
        couponActive: document.getElementById('couponActive'),
        btnCouponModalClose: document.getElementById('btnCouponModalClose'),
        btnCouponFormCancel: document.getElementById('btnCouponFormCancel'),

        custHistModalOverlay: document.getElementById('customerHistoryModalOverlay'),
        custHistTitle: document.getElementById('customerHistoryTitle'),
        custHistName: document.getElementById('custHistName'),
        custHistPhone: document.getElementById('custHistPhone'),
        custHistEmail: document.getElementById('custHistEmail'),
        custHistTbody: document.getElementById('customerHistoryTbody'),
        btnCustHistClose: document.getElementById('btnCustomerHistoryClose')
    };

    // --- DATA ACCESS LAYER ---
    function readOrders() {
        try {
            const raw = localStorage.getItem(ORDERS_KEY);
            const parsed = raw ? JSON.parse(raw) : [];
            return Array.isArray(parsed) ? parsed : [];
        } catch { return []; }
    }

    function writeOrders(orders) {
        localStorage.setItem(ORDERS_KEY, JSON.stringify(orders));
    }

    function readProducts() {
        try {
            const raw = localStorage.getItem(PRODUCTS_KEY);
            const parsed = raw ? JSON.parse(raw) : [];
            if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        } catch {}
        
        // Seed default products if empty
        const defaults = window.FIORE_PRODUCTS || [];
        localStorage.setItem(PRODUCTS_KEY, JSON.stringify(defaults));
        return defaults;
    }

    function writeProducts(products) {
        localStorage.setItem(PRODUCTS_KEY, JSON.stringify(products));
    }

    function readCoupons() {
        try {
            const raw = localStorage.getItem(COUPONS_KEY);
            const parsed = raw ? JSON.parse(raw) : [];
            if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        } catch {}

        // Seed default coupons if empty
        const defaults = [
            { code: 'WELCOME10', type: 'percentage', value: 10, minOrder: 0, active: true },
            { code: 'FIOREGOLD', type: 'percentage', value: 15, minOrder: 1500000, active: true },
            { code: 'FREESHIP', type: 'fixed', value: 50000, minOrder: 0, active: true }
        ];
        localStorage.setItem(COUPONS_KEY, JSON.stringify(defaults));
        return defaults;
    }

    function writeCoupons(coupons) {
        localStorage.setItem(COUPONS_KEY, JSON.stringify(coupons));
    }

    // --- UTILS ---
    function formatCurrency(val) {
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val).replace('₫', 'đ');
    }

    function parseMoneyText(txt) {
        if (!txt) return 0;
        const clean = txt.toString().replace(/\D/g, '');
        return clean ? parseInt(clean, 10) : 0;
    }

    function formatDateTime(iso) {
        if (!iso) return '';
        const d = new Date(iso);
        if (Number.isNaN(d.getTime())) return iso;
        return new Intl.DateTimeFormat('vi-VN', {
            year: 'numeric', month: '2-digit', day: '2-digit',
            hour: '2-digit', minute: '2-digit'
        }).format(d);
    }

    function safeText(v) { return (v ?? '').toString(); }

    function getCategoryLabel(cat) {
        const map = {
            romance: 'Tình Yêu & Lãng Mạn',
            birthday: 'Sinh Nhật & Chúc Mừng',
            grand: 'Khai Trương & Sự Kiện',
            sympathy: 'Chia Buồn & Trang Trọng'
        };
        return map[cat] || cat;
    }

    // --- 1. TAB NAVIGATION ---
    function initTabs() {
        el.menuItems.forEach(btn => {
            btn.addEventListener('click', () => {
                const target = btn.getAttribute('data-tab');
                el.menuItems.forEach(i => i.classList.remove('active'));
                btn.classList.add('active');

                el.sections.forEach(s => {
                    if (s.id === `section-${target}`) {
                        s.classList.add('active');
                    } else {
                        s.classList.remove('active');
                    }
                });

                activeTab = target;
                renderActiveTab();
            });
        });
    }

    function renderActiveTab() {
        switch (activeTab) {
            case 'dashboard':
                renderDashboard();
                break;
            case 'products':
                renderProductsList();
                break;
            case 'orders':
                renderOrdersList();
                break;
            case 'customers':
                renderCustomersList();
                break;
            case 'discounts':
                renderCouponsList();
                break;
        }
    }

    // --- 2. RENDER: DASHBOARD ---
    function renderDashboard() {
        const orders = readOrders();
        const products = readProducts();
        const coupons = readCoupons();

        // Calculate Revenue
        let completedRevenue = 0;
        let countNew = 0;
        let countProcessing = 0;
        let countCompleted = 0;
        let countCancelled = 0;

        orders.forEach(o => {
            const status = o.status || 'new';
            if (status === 'new') countNew++;
            else if (status === 'processing') countProcessing++;
            else if (status === 'completed') {
                countCompleted++;
                completedRevenue += parseMoneyText(o.totalText);
            } else if (status === 'cancelled') countCancelled++;
        });

        // Set Stats
        if (el.statRevenue) el.statRevenue.textContent = formatCurrency(completedRevenue);
        if (el.statOrders) el.statOrders.textContent = `${orders.length} đơn`;
        if (el.statOrdersSub) el.statOrdersSub.textContent = `Đã thanh toán: ${countNew} | Đang xử lý: ${countProcessing}`;

        // Get Customers Count
        const uniquePhones = new Set();
        orders.forEach(o => {
            if (o.sender?.phone) uniquePhones.add(o.sender.phone);
        });
        if (el.statCustomers) el.statCustomers.textContent = `${uniquePhones.size} khách`;

        // Active Coupons
        const activeCoupons = coupons.filter(c => c.active).length;
        if (el.statDiscounts) el.statDiscounts.textContent = `${coupons.length} mã`;
        if (el.statDiscountsSub) el.statDiscountsSub.textContent = `${activeCoupons} mã đang chạy`;

        // Status percentage breakdown
        const totalOrds = orders.length || 1;
        const pctNew = Math.round((countNew / totalOrds) * 100);
        const pctProcessing = Math.round((countProcessing / totalOrds) * 100);
        const pctCompleted = Math.round((countCompleted / totalOrds) * 100);
        const pctCancelled = Math.round((countCancelled / totalOrds) * 100);

        if (el.barNew) el.barNew.style.width = `${pctNew}%`;
        if (el.barNewPct) el.barNewPct.textContent = `${pctNew}%`;
        if (el.barProcessing) el.barProcessing.style.width = `${pctProcessing}%`;
        if (el.barProcessingPct) el.barProcessingPct.textContent = `${pctProcessing}%`;
        if (el.barCompleted) el.barCompleted.style.width = `${pctCompleted}%`;
        if (el.barCompletedPct) el.barCompletedPct.textContent = `${pctCompleted}%`;
        if (el.barCancelled) el.barCancelled.style.width = `${pctCancelled}%`;
        if (el.barCancelledPct) el.barCancelledPct.textContent = `${pctCancelled}%`;

        // Recent Orders list (max 5)
        const recentOrders = [...orders]
            .sort((a,b) => (b.createdAt || '').localeCompare(a.createdAt || ''))
            .slice(0, 5);

        if (el.dashRecentOrdersTbody) {
            el.dashRecentOrdersTbody.innerHTML = '';
            if (recentOrders.length === 0) {
                el.dashRecentOrdersTbody.innerHTML = '<tr><td colspan="6" class="text-center" style="padding:15px;">Chưa có đơn hàng nào.</td></tr>';
            } else {
                recentOrders.forEach(o => {
                    const tr = document.createElement('tr');
                    const label = statusLabel(o.status);
                    const clazz = statusClass(o.status);
                    tr.innerHTML = `
                        <td><strong class="order-id">${safeText(o.id)}</strong></td>
                        <td>${safeText(o.sender?.name)}</td>
                        <td>${safeText(o.recipient?.name)}</td>
                        <td>${safeText(o.delivery?.date)}</td>
                        <td>${safeText(o.totalText)}</td>
                        <td><span class="status-pill ${clazz}">${label}</span></td>
                    `;
                    el.dashRecentOrdersTbody.appendChild(tr);
                });
            }
        }

        // Top products sold calculation
        const productStats = {};
        orders.forEach(o => {
            // Only count completed orders for sold calculation
            if (o.status !== 'completed') return;
            (o.items || []).forEach(it => {
                const id = it.id;
                if (!productStats[id]) {
                    productStats[id] = {
                        title: it.title,
                        category: it.category || '',
                        quantity: 0,
                        revenue: 0
                    };
                }
                productStats[id].quantity += it.quantity || 0;
                productStats[id].revenue += (it.singlePrice || 0) * (it.quantity || 0);
            });
        });

        const sortedProducts = Object.keys(productStats).map(id => ({
            id, ...productStats[id]
        })).sort((a, b) => b.quantity - a.quantity).slice(0, 5);

        if (el.dashTopProductsTbody) {
            el.dashTopProductsTbody.innerHTML = '';
            if (sortedProducts.length === 0) {
                el.dashTopProductsTbody.innerHTML = '<tr><td colspan="4" class="text-center" style="padding:15px;">Chưa bán được sản phẩm nào.</td></tr>';
            } else {
                sortedProducts.forEach(p => {
                    const tr = document.createElement('tr');
                    tr.innerHTML = `
                        <td><strong>${safeText(p.title)}</strong></td>
                        <td>${safeText(getCategoryLabel(p.category) || 'Hoa Bó')}</td>
                        <td>${p.quantity} bó</td>
                        <td>${formatCurrency(p.revenue)}</td>
                    `;
                    el.dashTopProductsTbody.appendChild(tr);
                });
            }
        }
    }

    // --- 3. RENDER: PRODUCTS MANAGEMENT ---
    function renderProductsList() {
        const products = readProducts();
        const q = el.prodSearch?.value?.trim() || '';
        const cat = el.prodCategoryFilter?.value || 'all';

        let list = products;
        if (q) {
            list = list.filter(p => p.title.toLowerCase().includes(q.toLowerCase()) || (p.tag || '').toLowerCase().includes(q.toLowerCase()));
        }
        if (cat !== 'all') {
            list = list.filter(p => p.category === cat);
        }

        if (el.prodCount) el.prodCount.textContent = `${list.length} sản phẩm`;
        if (!el.prodTbody) return;

        el.prodTbody.innerHTML = '';
        if (list.length === 0) {
            el.prodTbody.innerHTML = `<tr><td colspan="7" class="text-center" style="padding: 30px;">Không tìm thấy sản phẩm nào.</td></tr>`;
            return;
        }

        list.forEach(p => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><img class="prod-img-td" src="${p.image}" alt="${p.title}" onerror="this.src='images/hero_bg.png'"></td>
                <td><strong>${safeText(p.title)}</strong></td>
                <td>${getCategoryLabel(p.category)}</td>
                <td>${formatCurrency(p.price)}</td>
                <td>${p.tag ? `<span class="status-pill status-processing">${p.tag}</span>` : '—'}</td>
                <td>${p.featured ? '<span class="prod-featured-badge">NỔI BẬT</span>' : '—'}</td>
                <td>
                    <div class="row-actions">
                        <button class="btn-mini primary" data-action="edit-prod" data-id="${p.id}">Sửa</button>
                        <button class="btn-mini danger" data-action="delete-prod" data-id="${p.id}">Xóa</button>
                    </div>
                </td>
            `;
            el.prodTbody.appendChild(tr);
        });
    }

    // --- 4. RENDER: ORDER MANAGEMENT ---
    function statusLabel(status) {
        const map = { new: 'Đã thanh toán', processing: 'Đang xử lý', completed: 'Hoàn tất', cancelled: 'Đã hủy' };
        return map[status] || status || '';
    }

    function statusClass(status) {
        const map = { new: 'status-new', processing: 'status-processing', completed: 'status-completed', cancelled: 'status-cancelled' };
        return map[status] || '';
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

    function getFilteredAndSortedOrders() {
        const orders = readOrders();
        const q = el.orderSearch?.value?.trim() || '';
        const status = el.orderStatus?.value || 'all';
        const sort = el.orderSort?.value || 'newest';

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

    function renderOrdersList() {
        const list = getFilteredAndSortedOrders();
        if (el.orderCount) el.orderCount.textContent = `${list.length} đơn hàng`;

        if (!el.orderTbody) return;
        el.orderTbody.innerHTML = '';

        if (list.length === 0) {
            el.orderEmpty.style.display = 'block';
            el.orderTbody.parentElement.style.display = 'none';
            return;
        }

        el.orderEmpty.style.display = 'none';
        el.orderTbody.parentElement.style.display = '';

        list.forEach(order => {
            const tr = document.createElement('tr');
            const created = formatDateTime(order.createdAt);
            const sender = safeText(order.sender?.name);
            const phone = safeText(order.sender?.phone);
            const recipient = safeText(order.recipient?.name);
            const delivery = `${safeText(order.delivery?.date)} • ${safeText(order.delivery?.timeSlot)}`;
            const total = safeText(order.totalText);

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
                        <button class="btn-mini" data-action="view-order" data-id="${safeText(order.id)}">Xem</button>
                        <button class="btn-mini primary" data-action="next-order" data-id="${safeText(order.id)}">Chuyển trạng thái</button>
                        <button class="btn-mini danger" data-action="delete-order" data-id="${safeText(order.id)}">Xóa</button>
                    </div>
                </td>
            `;
            el.orderTbody.appendChild(tr);
        });
    }

    function openOrderModal(order) {
        if (!el.orderModalOverlay) return;
        el.orderModalTitle.textContent = `${order.id} • ${statusLabel(order.status)}`;

        const itemsRows = (order.items || []).map(it => {
            const total = (it.singlePrice || 0) * (it.quantity || 0);
            return `
                <tr>
                    <td>${safeText(it.title)}</td>
                    <td>${safeText(it.size || '').toUpperCase()}</td>
                    <td>${safeText(it.quantity)}</td>
                    <td>${formatCurrency(it.singlePrice)}</td>
                    <td>${formatCurrency(total)}</td>
                </tr>
            `;
        }).join('');

        el.orderModalBody.innerHTML = `
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
                <h4>Ghi chú & Khuyến mãi</h4>
                <div class="kv">
                    <div class="k">Lời chúc</div><div class="v">${safeText(order.cardMessage)}</div>
                    <div class="k">Mã giảm giá</div><div class="v" style="color:var(--color-brand-rose);">${order.discountCode ? order.discountCode + ' (-' + formatCurrency(order.discountAmount || 0) + ')' : 'Không sử dụng'}</div>
                    <div class="k">Thanh toán</div><div class="v">${safeText(order.paymentMethod === 'card' ? 'Thẻ Visa/Master' : 'Chuyển khoản QR')}</div>
                    <div class="k">Tổng đơn</div><div class="v" style="font-weight: 750; color: var(--color-brand-green);">${safeText(order.totalText)}</div>
                    <div class="k">Tạo lúc</div><div class="v">${safeText(formatDateTime(order.createdAt))}</div>
                </div>
            </div>
        `;

        el.orderModalOverlay.classList.add('open');
    }

    function closeOrderModal() { el.orderModalOverlay?.classList.remove('open'); }

    function setOrderStatus(id, status) {
        const orders = readOrders();
        const idx = orders.findIndex(o => o.id === id);
        if (idx === -1) return;
        orders[idx].status = status;
        writeOrders(orders);
        renderOrdersList();
    }

    function nextStatus(current) {
        const flow = ['new', 'processing', 'completed', 'cancelled'];
        const idx = Math.max(0, flow.indexOf(current || 'new'));
        return flow[(idx + 1) % flow.length];
    }

    function removeOrder(id) {
        const orders = readOrders().filter(o => o.id !== id);
        writeOrders(orders);
        renderOrdersList();
    }

    // Seed orders demo
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
                totalText: '750.000đ',
                items: [
                    { id: 'bouquet_1', title: 'Bó Hồng Thơ Ngây', size: 'standard', singlePrice: 750000, quantity: 1, image: 'images/bouquet_1.png', cardMessage: '' }
                ]
            },
            {
                id: `FIORE-${Math.floor(100000 + Math.random() * 900000)}`,
                createdAt: new Date(now - 1000 * 60 * 180).toISOString(),
                status: 'completed',
                paymentMethod: 'card',
                sender: { name: 'Trần Thị Hạnh', phone: '0912345678', email: 'hanh@gmail.com' },
                recipient: { name: 'Trần Thị Hạnh', phone: '0912345678', address: 'Quận 3, TP.HCM' },
                delivery: { dateRaw: '', date: '26/05/2026', timeSlot: '15:30 - 17:30' },
                cardMessage: 'Kỷ niệm ngày cưới hạnh phúc!',
                totalText: '950.000đ',
                items: [
                    { id: 'bouquet_2', title: 'Bình Tulip Ánh Dương', size: 'standard', singlePrice: 950000, quantity: 1, image: 'images/bouquet_2.png', cardMessage: '' }
                ]
            }
        ];
        const current = readOrders();
        writeOrders([...demo, ...current]);
        renderOrdersList();
    }

    // CSV & JSON Exports
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
            'order_id', 'status', 'created_at', 'payment_method',
            'sender_name', 'sender_phone', 'sender_email',
            'recipient_name', 'recipient_phone', 'recipient_address',
            'delivery_date', 'delivery_time', 'total_text', 'discount_code', 'discount_amount', 'items'
        ];

        const esc = (v) => {
            const s = safeText(v).replace(/\r?\n/g, ' ');
            const needs = /[",]/.test(s);
            const quoted = s.replace(/"/g, '""');
            return needs ? `"${quoted}"` : quoted;
        };

        const rows = orders.map(o => ([
            o.id, o.status, o.createdAt, o.paymentMethod,
            o.sender?.name, o.sender?.phone, o.sender?.email,
            o.recipient?.name, o.recipient?.phone, o.recipient?.address,
            o.delivery?.date, o.delivery?.timeSlot, o.totalText, o.discountCode, o.discountAmount,
            (o.items || []).map(i => `${i.title}(${(i.size || '').toUpperCase()})x${i.quantity}`).join(' | ')
        ]).map(esc).join(','));

        return [header.join(','), ...rows].join('\n');
    }

    // --- 5. RENDER: CUSTOMERS ---
    function renderCustomersList() {
        const orders = readOrders();
        const q = el.custSearch?.value?.trim() || '';

        // Group by Phone
        const customersMap = {};
        orders.forEach(o => {
            const phone = o.sender?.phone;
            if (!phone) return;
            
            if (!customersMap[phone]) {
                customersMap[phone] = {
                    name: o.sender.name || 'Khách Vô Danh',
                    phone: phone,
                    email: o.sender.email || '—',
                    totalSpend: 0,
                    ordersCount: 0,
                    orders: []
                };
            }
            
            customersMap[phone].ordersCount++;
            customersMap[phone].orders.push(o);
            if (o.status === 'completed') {
                customersMap[phone].totalSpend += parseMoneyText(o.totalText);
            }
        });

        let list = Object.keys(customersMap).map(k => customersMap[k]);
        
        if (q) {
            list = list.filter(c => c.name.toLowerCase().includes(q.toLowerCase()) || c.phone.includes(q) || c.email.toLowerCase().includes(q.toLowerCase()));
        }

        if (el.custCount) el.custCount.textContent = `${list.length} khách hàng`;
        if (!el.custTbody) return;

        el.custTbody.innerHTML = '';
        if (list.length === 0) {
            el.custTbody.innerHTML = `<tr><td colspan="7" class="text-center" style="padding:30px;">Không tìm thấy khách hàng nào.</td></tr>`;
            return;
        }

        list.forEach(c => {
            const tr = document.createElement('tr');
            // Customer classification
            let badge = '<span class="status-pill">Thành viên</span>';
            if (c.ordersCount >= 3) {
                badge = '<span class="status-pill status-processing" style="font-weight:700;">Thân thiết</span>';
            }
            if (c.totalSpend >= 2000000) {
                badge = '<span class="status-pill status-completed" style="font-weight:700;">VIP Gold</span>';
            }

            tr.innerHTML = `
                <td><strong>${safeText(c.name)}</strong></td>
                <td>${safeText(c.phone)}</td>
                <td>${safeText(c.email)}</td>
                <td style="font-weight:650; color:var(--color-brand-green);">${formatCurrency(c.totalSpend)}</td>
                <td>${c.ordersCount} đơn</td>
                <td>${badge}</td>
                <td>
                    <button type="button" class="btn-mini primary" data-action="view-cust-hist" data-phone="${c.phone}">Lịch sử mua</button>
                </td>
            `;
            el.custTbody.appendChild(tr);
        });
    }

    function openCustomerHistory(phone) {
        const orders = readOrders();
        const customerOrders = orders.filter(o => o.sender?.phone === phone);
        if (customerOrders.length === 0) return;

        const info = customerOrders[0].sender;
        if (el.custHistName) el.custHistName.textContent = info.name;
        if (el.custHistPhone) el.custHistPhone.textContent = info.phone;
        if (el.custHistEmail) el.custHistEmail.textContent = info.email || '—';

        if (el.custHistTbody) {
            el.custHistTbody.innerHTML = '';
            customerOrders.forEach(o => {
                const tr = document.createElement('tr');
                const label = statusLabel(o.status);
                const clazz = statusClass(o.status);
                tr.innerHTML = `
                    <td><strong>${o.id}</strong></td>
                    <td>${o.recipient?.name}</td>
                    <td>${o.totalText}</td>
                    <td>${o.delivery?.date}</td>
                    <td><span class="status-pill ${clazz}">${label}</span></td>
                `;
                el.custHistTbody.appendChild(tr);
            });
        }

        el.custHistModalOverlay?.classList.add('open');
    }

    function closeCustomerHistory() {
        el.custHistModalOverlay?.classList.remove('open');
    }

    // --- 6. RENDER: DISCOUNTS MANAGEMENT ---
    function renderCouponsList() {
        const coupons = readCoupons();
        const q = el.couponSearch?.value?.trim() || '';

        let list = coupons;
        if (q) {
            list = list.filter(c => c.code.toLowerCase().includes(q.toLowerCase()));
        }

        if (el.couponCount) el.couponCount.textContent = `${list.length} mã`;
        if (!el.couponTbody) return;

        el.couponTbody.innerHTML = '';
        if (list.length === 0) {
            el.couponTbody.innerHTML = `<tr><td colspan="6" class="text-center" style="padding:30px;">Không tìm thấy mã giảm giá nào.</td></tr>`;
            return;
        }

        list.forEach(c => {
            const tr = document.createElement('tr');
            const typeText = c.type === 'percentage' ? 'Giảm theo phần trăm (%)' : 'Giảm tiền mặt (VNĐ)';
            const valText = c.type === 'percentage' ? `${c.value}%` : formatCurrency(c.value);
            const statusBadge = c.active 
                ? '<span class="status-pill status-completed">Active</span>' 
                : '<span class="status-pill status-cancelled">Inactive</span>';

            tr.innerHTML = `
                <td><strong class="order-id" style="font-size:15px;">${safeText(c.code)}</strong></td>
                <td>${typeText}</td>
                <td style="font-weight:650; color:var(--color-brand-green);">${valText}</td>
                <td>${c.minOrder ? formatCurrency(c.minOrder) : 'Mọi đơn hàng'}</td>
                <td>${statusBadge}</td>
                <td>
                    <div class="row-actions">
                        <button class="btn-mini primary" data-action="edit-coupon" data-code="${c.code}">Sửa</button>
                        <button class="btn-mini danger" data-action="delete-coupon" data-code="${c.code}">Xóa</button>
                    </div>
                </td>
            `;
            el.couponTbody.appendChild(tr);
        });
    }

    // --- 7. EDIT/ADD FORMS EVENT HANDLERS ---

    // Product Modal handlers
    function openProdModal(p = null) {
        if (!el.prodModalOverlay) return;
        
        if (p) {
            el.prodModalTitle.textContent = 'Chỉnh Sửa Sản Phẩm';
            el.prodFormId.value = p.id;
            el.prodTitle.value = p.title;
            el.prodCategory.value = p.category;
            el.prodPrice.value = p.price;
            el.prodImage.value = p.image;
            el.prodTag.value = p.tag || '';
            el.prodDescription.value = p.description || '';
            el.prodFeatured.checked = !!p.featured;
        } else {
            el.prodModalTitle.textContent = 'Thêm Sản Phẩm Mới';
            el.prodForm.reset();
            el.prodFormId.value = '';
            el.prodFeatured.checked = true;
        }

        el.prodModalOverlay.classList.add('open');
    }

    function closeProdModal() {
        el.prodModalOverlay?.classList.remove('open');
    }

    // Coupon Modal handlers
    function openCouponModal(c = null) {
        if (!el.couponModalOverlay) return;

        if (c) {
            el.couponModalTitle.textContent = 'Chỉnh Sửa Mã Giảm Giá';
            el.couponFormOldCode.value = c.code;
            el.couponCode.value = c.code;
            el.couponCode.readOnly = true; // Code cannot be edited once created
            el.couponType.value = c.type;
            el.couponValue.value = c.value;
            el.couponMinOrder.value = c.minOrder || 0;
            el.couponActive.checked = !!c.active;
        } else {
            el.couponModalTitle.textContent = 'Tạo Mã Giảm Giá Mới';
            el.couponForm.reset();
            el.couponFormOldCode.value = '';
            el.couponCode.readOnly = false;
            el.couponActive.checked = true;
        }

        el.couponModalOverlay.classList.add('open');
    }

    function closeCouponModal() {
        el.couponModalOverlay?.classList.remove('open');
    }

    // --- 8. EVENT BINDING ---
    function bindEvents() {
        const rerender = () => renderActiveTab();

        // Global key escape for closing modals
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                closeOrderModal();
                closeProdModal();
                closeCouponModal();
                closeCustomerHistory();
            }
        });

        // Click overlay closes modal
        [el.orderModalOverlay, el.prodModalOverlay, el.couponModalOverlay, el.custHistModalOverlay].forEach(modal => {
            modal?.addEventListener('click', (e) => {
                if (e.target === modal) {
                    closeOrderModal();
                    closeProdModal();
                    closeCouponModal();
                    closeCustomerHistory();
                }
            });
        });

        // 8a. Order Tab events
        el.orderSearch?.addEventListener('input', rerender);
        el.orderStatus?.addEventListener('change', rerender);
        el.orderSort?.addEventListener('change', rerender);

        el.orderModalClose?.addEventListener('click', closeOrderModal);

        el.orderExportCsv?.addEventListener('click', () => {
            const list = getFilteredAndSortedOrders();
            const csv = toCsv(list);
            downloadText(`fiore-orders-${Date.now()}.csv`, csv, 'text/csv;charset=utf-8');
        });

        el.orderExportJson?.addEventListener('click', () => {
            const list = getFilteredAndSortedOrders();
            downloadText(`fiore-orders-${Date.now()}.json`, JSON.stringify(list, null, 2), 'application/json');
        });

        el.orderClearAll?.addEventListener('click', () => {
            if (confirm('CẢNH BÁO: Bạn có chắc chắn muốn xóa toàn bộ đơn hàng trong hệ thống?')) {
                writeOrders([]);
                renderActiveTab();
            }
        });

        el.orderSeed?.addEventListener('click', seedDemo);

        // Click actions on orders table
        el.orderTbody?.addEventListener('click', (e) => {
            const btn = e.target.closest('button');
            if (!btn) return;
            const action = btn.getAttribute('data-action');
            const id = btn.getAttribute('data-id');
            const orders = readOrders();
            const order = orders.find(o => o.id === id);
            if (!order) return;

            if (action === 'view-order') {
                openOrderModal(order);
            } else if (action === 'next-order') {
                setOrderStatus(id, nextStatus(order.status));
            } else if (action === 'delete-order') {
                if (confirm(`Xóa đơn hàng ${id}?`)) {
                    removeOrder(id);
                }
            }
        });

        // 8b. Product Tab events
        el.prodSearch?.addEventListener('input', renderProductsList);
        el.prodCategoryFilter?.addEventListener('change', renderProductsList);
        el.btnOpenAddProductModal?.addEventListener('click', () => openProdModal());
        el.btnProdModalClose?.addEventListener('click', closeProdModal);
        el.btnProdFormCancel?.addEventListener('click', closeProdModal);

        el.btnResetDefaultProducts?.addEventListener('click', () => {
            if (confirm('Khôi phục danh sách sản phẩm mặc định ban đầu? Các thay đổi thủ công sẽ mất.')) {
                localStorage.removeItem(PRODUCTS_KEY);
                renderProductsList();
            }
        });

        // Form submit product adding/editing
        el.prodForm?.addEventListener('submit', (e) => {
            e.preventDefault();
            const id = el.prodFormId.value;
            const title = el.prodTitle.value.trim();
            const category = el.prodCategory.value;
            const price = parseInt(el.prodPrice.value, 10);
            const image = el.prodImage.value.trim();
            const tag = el.prodTag.value.trim().toUpperCase();
            const description = el.prodDescription.value.trim();
            const featured = el.prodFeatured.checked;

            const products = readProducts();

            if (id) {
                // Edit
                const idx = products.findIndex(p => p.id === id);
                if (idx !== -1) {
                    products[idx] = { ...products[idx], title, category, price, image, tag, description, featured };
                }
            } else {
                // Add
                const newId = `bouquet_${Date.now()}`;
                products.push({ id: newId, title, category, price, image, tag, description, featured });
            }

            writeProducts(products);
            closeProdModal();
            renderProductsList();
        });

        // Click actions on product list
        el.prodTbody?.addEventListener('click', (e) => {
            const btn = e.target.closest('button');
            if (!btn) return;
            const action = btn.getAttribute('data-action');
            const id = btn.getAttribute('data-id');
            const products = readProducts();
            const product = products.find(p => p.id === id);
            if (!product) return;

            if (action === 'edit-prod') {
                openProdModal(product);
            } else if (action === 'delete-prod') {
                if (confirm(`Bạn chắc chắn muốn xóa sản phẩm "${product.title}"?`)) {
                    const filtered = products.filter(p => p.id !== id);
                    writeProducts(filtered);
                    renderProductsList();
                }
            }
        });

        // 8c. Customer Tab events
        el.custSearch?.addEventListener('input', renderCustomersList);
        el.btnCustHistClose?.addEventListener('click', closeCustomerHistory);

        el.custTbody?.addEventListener('click', (e) => {
            const btn = e.target.closest('button');
            if (!btn) return;
            const action = btn.getAttribute('data-action');
            const phone = btn.getAttribute('data-phone');
            if (action === 'view-cust-hist') {
                openCustomerHistory(phone);
            }
        });

        // 8d. Coupons Tab events
        el.couponSearch?.addEventListener('input', renderCouponsList);
        el.btnOpenAddCouponModal?.addEventListener('click', () => openCouponModal());
        el.btnCouponModalClose?.addEventListener('click', closeCouponModal);
        el.btnCouponFormCancel?.addEventListener('click', closeCouponModal);

        el.couponForm?.addEventListener('submit', (e) => {
            e.preventDefault();
            const oldCode = el.couponFormOldCode.value;
            const code = el.couponCode.value.trim().toUpperCase();
            const type = el.couponType.value;
            const value = parseInt(el.couponValue.value, 10);
            const minOrder = parseInt(el.couponMinOrder.value, 10) || 0;
            const active = el.couponActive.checked;

            const coupons = readCoupons();

            if (oldCode) {
                // Edit
                const idx = coupons.findIndex(c => c.code === oldCode);
                if (idx !== -1) {
                    coupons[idx] = { code, type, value, minOrder, active };
                }
            } else {
                // Check duplicate
                if (coupons.some(c => c.code === code)) {
                    alert('Mã giảm giá này đã tồn tại trong hệ thống!');
                    return;
                }
                // Add
                coupons.push({ code, type, value, minOrder, active });
            }

            writeCoupons(coupons);
            closeCouponModal();
            renderCouponsList();
        });

        // Click actions on coupons
        el.couponTbody?.addEventListener('click', (e) => {
            const btn = e.target.closest('button');
            if (!btn) return;
            const action = btn.getAttribute('data-action');
            const code = btn.getAttribute('data-code');
            const coupons = readCoupons();
            const coupon = coupons.find(c => c.code === code);
            if (!coupon) return;

            if (action === 'edit-coupon') {
                openCouponModal(coupon);
            } else if (action === 'delete-coupon') {
                if (confirm(`Xóa mã giảm giá "${code}"?`)) {
                    const filtered = coupons.filter(c => c.code !== code);
                    writeCoupons(filtered);
                    renderCouponsList();
                }
            }
        });
    }

    // --- INITIALIZE SYSTEM ---
    initTabs();
    bindEvents();
    renderActiveTab(); // Render dashboard initially
})();
