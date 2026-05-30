/* ==========================================================================
   FIÒRE BOUTIQUE DE FLEURS - JAVASCRIPT CONTROLLER
   ========================================================================== */

/* ============================================================
   EMAILJS CONFIGURATION
   Thay các giá trị bên dưới bằng thông tin từ tài khoản EmailJS của bạn.
   Xem hướng dẫn chi tiết tại: https://www.emailjs.com/docs/
   ============================================================ */
const EMAILJS_CONFIG = {
    publicKey:          'dGSBNHhWHnMI8oIZ-',          // Lấy từ Account > API Keys
    serviceId:          'service_z9ucei6',          // Lấy từ Email Services
    customerTemplateId: 'template_14f3loq', // Template gửi cho khách hàng
    storeTemplateId:    'template_a7n2f3l',    // Template gửi cho cửa hàng
    storeEmail:         'thuyvanngo35@gmail.com'           // Email nhận đơn hàng của cửa hàng
};

document.addEventListener('DOMContentLoaded', () => {
    
    // --- 1. PRODUCT DATABASE (shared via products.js) ---
    let localProducts = null;
    try {
        const raw = localStorage.getItem('fiore_products');
        localProducts = raw ? JSON.parse(raw) : null;
    } catch (e) {}
    
    if (!localProducts || !Array.isArray(localProducts) || localProducts.length === 0) {
        localProducts = window.FIORE_PRODUCTS || [];
        try {
            localStorage.setItem('fiore_products', JSON.stringify(localProducts));
        } catch (e) {}
    }
    const PRODUCTS = localProducts;

    // --- 2. GLOBAL STATE ---
    let cart = JSON.parse(localStorage.getItem('fiore_cart')) || [];
    let currentSelectedProduct = null;
    let checkoutStep = 1;
    let selectedPaymentMethod = 'card'; // 'card' or 'qr'
    let qrSimulateInterval = null;
    let appliedCoupon = null; // State of applied promo/discount code

    // --- 2a. ORDERS STORAGE (ADMIN) ---
    const ORDERS_STORAGE_KEY = 'fiore_orders';
    const SAVED_CARD_STORAGE_KEY = 'fiore_saved_card_number';
    const SAVED_CARD_HOLDER_KEY = 'fiore_saved_card_holder';
    const SAVED_CARD_EXPIRY_KEY = 'fiore_saved_card_expiry';

    function readOrdersFromStorage() {
        try {
            const raw = localStorage.getItem(ORDERS_STORAGE_KEY);
            const parsed = raw ? JSON.parse(raw) : [];
            return Array.isArray(parsed) ? parsed : [];
        } catch {
            return [];
        }
    }

    function writeOrdersToStorage(orders) {
        localStorage.setItem(ORDERS_STORAGE_KEY, JSON.stringify(orders));
    }

    function addOrderToStorage(order) {
        const orders = readOrdersFromStorage();
        orders.unshift(order); // newest first
        writeOrdersToStorage(orders);
    }

    function getSavedCardDigits() {
        try {
            const raw = localStorage.getItem(SAVED_CARD_STORAGE_KEY) || '';
            const digits = raw.replace(/\D/g, '');
            return digits.length === 16 ? digits : '';
        } catch {
            return '';
        }
    }

    function setSavedCardDigits(digits16) {
        const digits = (digits16 || '').replace(/\D/g, '').slice(0, 16);
        if (digits.length !== 16) return;
        localStorage.setItem(SAVED_CARD_STORAGE_KEY, digits);
    }

    function clearSavedCardDigits() {
        localStorage.removeItem(SAVED_CARD_STORAGE_KEY);
    }

    function getSavedCardHolder() {
        try {
            return (localStorage.getItem(SAVED_CARD_HOLDER_KEY) || '').toString();
        } catch {
            return '';
        }
    }

    function setSavedCardHolder(holder) {
        const v = (holder || '').toString().trim();
        if (!v) return;
        localStorage.setItem(SAVED_CARD_HOLDER_KEY, v);
    }

    function clearSavedCardHolder() {
        localStorage.removeItem(SAVED_CARD_HOLDER_KEY);
    }

    function getSavedCardExpiry() {
        try {
            const raw = (localStorage.getItem(SAVED_CARD_EXPIRY_KEY) || '').toString().trim();
            return /^\d{2}\/\d{2}$/.test(raw) ? raw : '';
        } catch {
            return '';
        }
    }

    function setSavedCardExpiry(expiry) {
        const v = (expiry || '').toString().trim();
        if (!/^\d{2}\/\d{2}$/.test(v)) return;
        localStorage.setItem(SAVED_CARD_EXPIRY_KEY, v);
    }

    function clearSavedCardExpiry() {
        localStorage.removeItem(SAVED_CARD_EXPIRY_KEY);
    }

    // --- 3. DOM ELEMENTS ---
    // Header & Navigation
    const mainHeader = document.getElementById('mainHeader');
    const mobileMenuTrigger = document.getElementById('mobileMenuTrigger');
    const mobileNavOverlay = document.getElementById('mobileNavOverlay');
    const closeMobileNav = document.getElementById('closeMobileNav');
    const mobileLinks = document.querySelectorAll('.mobile-link');
    
    // Product Gallery
    const productsGrid = document.getElementById('productsGrid');
    const categoryFilters = document.getElementById('categoryFilters');

    // Cart Sidebar
    const cartTrigger = document.getElementById('cartTrigger');
    const cartSidebarOverlay = document.getElementById('cartSidebarOverlay');
    const cartSidebar = document.getElementById('cartSidebar');
    const closeCartBtn = document.getElementById('closeCartBtn');
    const cartBadgeCount = document.getElementById('cartBadgeCount');
    const cartSidebarCount = document.getElementById('cartSidebarCount');
    const cartItemsContainer = document.getElementById('cartItemsContainer');
    const cartSidebarFooter = document.getElementById('cartSidebarFooter');
    
    // Shipping Notices in Cart
    const cartShippingNotice = document.getElementById('cartShippingNotice');
    const freeShippingRemain = document.getElementById('freeShippingRemain');
    const shippingProgressBar = document.getElementById('shippingProgressBar');
    const cartSubtotal = document.getElementById('cartSubtotal');
    const cartShippingFee = document.getElementById('cartShippingFee');
    const cartGrandTotal = document.getElementById('cartGrandTotal');

    // Product Modal
    const productModalOverlay = document.getElementById('productModalOverlay');
    const productModal = document.getElementById('productModal');
    const closeProductModal = document.getElementById('closeProductModal');
    const modalProductTag = document.getElementById('modalProductTag');
    const modalProductTitle = document.getElementById('modalProductTitle');
    const modalProductPrice = document.getElementById('modalProductPrice');
    const modalProductDescription = document.getElementById('modalProductDescription');
    const modalProductImage = document.getElementById('modalProductImage');
    const sizeRadioInputs = document.querySelectorAll('input[name="flower-size"]');
    const sizeDeluxeDelta = document.getElementById('sizeDeluxeDelta');
    const sizePremiumDelta = document.getElementById('sizePremiumDelta');
    const modalCardMessage = document.getElementById('modalCardMessage');
    const modalQtyMinus = document.getElementById('modalQtyMinus');
    const modalQtyPlus = document.getElementById('modalQtyPlus');
    const modalQtyInput = document.getElementById('modalQtyInput');
    const modalAddToCartBtn = document.getElementById('modalAddToCartBtn');
    const charCounter = document.querySelector('.char-counter');

    // Checkout Modal
    const checkoutModalOverlay = document.getElementById('checkoutModalOverlay');
    const closeCheckoutModal = document.getElementById('closeCheckoutModal');
    const checkoutTriggerBtn = document.getElementById('checkoutTriggerBtn');
    const checkoutStepsIndicator = document.getElementById('checkoutStepsIndicator');
    const checkoutStep1 = document.getElementById('checkoutStep1');
    const checkoutStep2 = document.getElementById('checkoutStep2');
    const checkoutStep3 = document.getElementById('checkoutStep3');
    
    // Step 1 Form
    const shippingForm = document.getElementById('shippingForm');
    const checkoutCardMessage = document.getElementById('checkoutCardMessage');
    
    // Step 2 Tabs & Panels
    const tabBtnCard = document.getElementById('tabBtnCard');
    const tabBtnQr = document.getElementById('tabBtnQr');
    const paymentPanelCard = document.getElementById('paymentPanelCard');
    const paymentPanelQr = document.getElementById('paymentPanelQr');
    
    // Card fields & interactive card
    const creditCardPreview = document.getElementById('creditCardPreview');
    const creditCardForm = document.getElementById('creditCardForm');
    const cardNumberInput = document.getElementById('cardNumber');
    const cardHolderInput = document.getElementById('cardHolder');
    const cardExpiryInput = document.getElementById('cardExpiry');
    const cardCvvInput = document.getElementById('cardCvv');
    
    const cardNumDisplay = document.getElementById('cardNumDisplay');
    const cardHolderDisplay = document.getElementById('cardHolderDisplay');
    const cardExpiryDisplay = document.getElementById('cardExpiryDisplay');
    const cardCvvDisplay = document.getElementById('cardCvvDisplay');
    
    // QR fields & copyable elements
    const qrPaymentAmount = document.getElementById('qrPaymentAmount');
    const qrTransferMessage = document.getElementById('qrTransferMessage');
    const qrAccountNumber = document.getElementById('qrAccountNumber');
    const btnSimulateQrPay = document.getElementById('btnSimulateQrPay');
    const vietqrImg = document.getElementById('vietqrImg');
    const backToStep1Btns = document.querySelectorAll('.back-to-step1-btn');

    // VietQR Config
    const VIETQR_BANK = 'MB';
    const VIETQR_ACCOUNT = '091604468';
    const VIETQR_NAME = 'NGO THUY VAN';

    function updateVietQR(amount, transferMsg) {
        if (!vietqrImg) return;
        const encodedMsg = encodeURIComponent(transferMsg || 'FIORE');
        const encodedName = encodeURIComponent(VIETQR_NAME);
        const url = `https://img.vietqr.io/image/${VIETQR_BANK}-${VIETQR_ACCOUNT}-compact2.png?amount=${Math.round(amount)}&addInfo=${encodedMsg}&accountName=${encodedName}`;
        vietqrImg.src = url;
        vietqrImg.style.display = 'block';
        const fallback = document.getElementById('qrFallback');
        if (fallback) fallback.style.display = 'none';
    }
    
    // Step 3 Order Success Details
    const successOrderId = document.getElementById('successOrderId');
    const successSender = document.getElementById('successSender');
    const successEmail = document.getElementById('successEmail');
    const successRecipient = document.getElementById('successRecipient');
    const successDeliveryTime = document.getElementById('successDeliveryTime');
    const successTotalAmount = document.getElementById('successTotalAmount');
    const successCardMessage = document.getElementById('successCardMessage');
    const btnCloseSuccessAndReset = document.getElementById('btnCloseSuccessAndReset');

    // Email sending status UI
    const emailSendingStatus = document.getElementById('emailSendingStatus');
    const emailSpinner = document.getElementById('emailSpinner');
    const emailStatusText = document.getElementById('emailStatusText');

    // Checkout Summary Elements
    const checkoutSummaryItems = document.getElementById('checkoutSummaryItems');
    const checkoutSummarySubtotal = document.getElementById('checkoutSummarySubtotal');
    const checkoutSummaryShipping = document.getElementById('checkoutSummaryShipping');
    const checkoutSummaryTotal = document.getElementById('checkoutSummaryTotal');

    // Admin Link
    const adminAccessBtn = document.getElementById('adminAccessBtn');


    function getTagClass(tag) {
        const map = {
            'NEW': 'tag-new',
            'LUXURY': 'tag-luxury',
            'POPULAR': 'tag-popular',
            'BESTSELLER': 'tag-bestseller',
            'SALE': 'tag-sale',
            'SIGNATURE': 'tag-signature',
            'LIMITED': 'tag-limited'
        };
        return map[tag] || '';
    }

    function buildProductCard(p, idx) {
        const card = document.createElement('article');
        card.className = 'product-card';
        card.style.animationDelay = `${idx * 0.08}s`;
        card.id = `product-${p.id}`;
        const tagExtra = getTagClass(p.tag);

        card.innerHTML = `
            <div class="product-image-area">
                <span class="product-tag ${tagExtra}">${p.tag}</span>
                <img class="product-image" src="${p.image}" alt="${p.title}" loading="lazy">
                <div class="product-hover-overlay">
                    <button class="quick-view-btn" data-id="${p.id}">Xem Chi Tiết</button>
                </div>
            </div>
            <div class="product-info-area">
                <h3 class="product-title">${p.title}</h3>
                <span class="product-category">${p.categoryLabel}</span>
                <div class="product-card-footer">
                    <span class="product-price">${formatCurrency(p.price)}</span>
                    <button class="card-add-to-cart quick-add-btn" data-id="${p.id}" aria-label="Thêm vào giỏ hàng">
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                    </button>
                </div>
            </div>
        `;
        return card;
    }

    function attachProductCardListeners(container) {
        const root = container || document;
        root.querySelectorAll('.quick-view-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = e.currentTarget.getAttribute('data-id');
                openProductModalFunc(id);
            });
        });
        root.querySelectorAll('.quick-add-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const btnEl = e.currentTarget;
                quickAddToCart(btnEl.getAttribute('data-id'), btnEl);
            });
        });
    }

    function renderProductsToGrid(gridEl, productList) {
        if (!gridEl) return;
        gridEl.innerHTML = '';
        productList.forEach((p, idx) => {
            gridEl.appendChild(buildProductCard(p, idx));
        });
        attachProductCardListeners(gridEl);
    }

    // --- 4. RENDER HOMEPAGE PRODUCTS (featured only) ---
    function renderProducts(filterCategory = 'all') {
        if (!productsGrid) return;
        let list = PRODUCTS.filter(p => p.featured);
        if (filterCategory !== 'all') {
            list = list.filter(p => p.category === filterCategory);
        }
        renderProductsToGrid(productsGrid, list);
    }


    // --- 5. FORMATTING UTILITIES ---
    function formatCurrency(val) {
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val).replace('₫', 'đ');
    }

    // Insert spaces every 4 digits in card numbers
    function formatCardNumber(value) {
        const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
        const matches = v.match(/\d{4,16}/g);
        const match = matches && matches[0] || '';
        const parts = [];

        for (let i = 0, len = match.length; i < len; i += 4) {
            parts.push(match.substring(i, i + 4));
        }

        if (parts.length > 0) {
            return parts.join(' ');
        } else {
            return v;
        }
    }

    // Format Expiry date as MM/YY
    function formatCardExpiry(value) {
        const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
        if (v.length >= 2) {
            return v.substring(0, 2) + '/' + v.substring(2, 4);
        }
        return v;
    }


    // --- 6. CART MANAGEMENT LOGIC ---
    function updateCartUI() {
        // Save to localStorage
        localStorage.setItem('fiore_cart', JSON.stringify(cart));

        // Count totals
        const totalItemsCount = cart.reduce((total, item) => total + item.quantity, 0);
        cartBadgeCount.textContent = totalItemsCount;
        cartSidebarCount.textContent = totalItemsCount;

        // Animate badge
        if (totalItemsCount > 0) {
            cartBadgeCount.style.transform = 'scale(1.2)';
            setTimeout(() => cartBadgeCount.style.transform = 'scale(1)', 200);
        }

        // Render Cart Items
        cartItemsContainer.innerHTML = '';
        
        if (cart.length === 0) {
            cartItemsContainer.innerHTML = `
                <div class="empty-cart-state">
                    <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="10" cy="20" r="1"></circle><circle cx="18" cy="20" r="1"></circle><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path></svg>
                    <p>Giỏ hàng của bạn đang trống.</p>
                </div>
            `;
            cartSidebarFooter.style.display = 'none';
            cartShippingNotice.style.display = 'none';
            return;
        }

        cartSidebarFooter.style.display = 'block';
        cartShippingNotice.style.display = 'block';

        let subtotal = 0;
        
        cart.forEach((item, index) => {
            const itemTotal = item.singlePrice * item.quantity;
            subtotal += itemTotal;

            const cartItemDiv = document.createElement('div');
            cartItemDiv.className = 'cart-item';
            cartItemDiv.innerHTML = `
                <div class="cart-item-image" style="background-image: url('${item.image}');"></div>
                <div class="cart-item-info">
                    <h4 class="cart-item-name">${item.title}</h4>
                    <span class="cart-item-size">Size: ${item.size.toUpperCase()}</span>
                    <span class="cart-item-price">${formatCurrency(item.singlePrice)}</span>
                    ${item.cardMessage ? `<span class="cart-item-card-message">Thiệp: "${item.cardMessage}"</span>` : ''}
                </div>
                <div class="cart-item-actions">
                    <button class="remove-item-btn" data-index="${index}">&times;</button>
                    <div class="item-qty-selector">
                        <button class="qty-btn-sm cart-qty-minus" data-index="${index}">-</button>
                        <input type="number" class="qty-input-sm" value="${item.quantity}" readonly>
                        <button class="qty-btn-sm cart-qty-plus" data-index="${index}">+</button>
                    </div>
                </div>
            `;
            cartItemsContainer.appendChild(cartItemDiv);
        });

        // Calculate shipping and totals
        const freeShippingLimit = 1000000;
        const baseShippingFee = 50000;
        
        let shippingFee = baseShippingFee;
        let progressPercent = (subtotal / freeShippingLimit) * 100;
        
        if (subtotal >= freeShippingLimit) {
            shippingFee = 0;
            progressPercent = 100;
            cartShippingNotice.innerHTML = `
                <span class="notice-text text-brand" style="font-weight: 700; color: #52796F !important;">
                    🎉 Chúc mừng! Đơn hàng của bạn đã đủ điều kiện <strong>Miễn phí vận chuyển hỏa tốc</strong>!
                </span>
                <div class="progress-bar-container">
                    <div class="progress-bar-fill" style="width: 100%; background-color: #52796F;"></div>
                </div>
            `;
        } else {
            const remain = freeShippingLimit - subtotal;
            freeShippingRemain.textContent = formatCurrency(remain);
            shippingProgressBar.style.width = `${progressPercent}%`;
            
            // Restore default message format
            cartShippingNotice.innerHTML = `
                <span class="notice-text">Mua thêm <strong id="freeShippingRemain">${formatCurrency(remain)}</strong> để được miễn phí vận chuyển hỏa tốc!</span>
                <div class="progress-bar-container">
                    <div class="progress-bar-fill" id="shippingProgressBar" style="width: ${progressPercent}%"></div>
                </div>
            `;
        }

        const grandTotal = subtotal + shippingFee;

        cartSubtotal.textContent = formatCurrency(subtotal);
        cartShippingFee.textContent = shippingFee === 0 ? 'Miễn phí' : formatCurrency(shippingFee);
        cartGrandTotal.textContent = formatCurrency(grandTotal);

        // Add Cart Event Listeners
        document.querySelectorAll('.remove-item-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const idx = parseInt(e.target.getAttribute('data-index'));
                cart.splice(idx, 1);
                updateCartUI();
            });
        });

        document.querySelectorAll('.cart-qty-minus').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const idx = parseInt(e.target.getAttribute('data-index'));
                if (cart[idx].quantity > 1) {
                    cart[idx].quantity -= 1;
                    updateCartUI();
                }
            });
        });

        document.querySelectorAll('.cart-qty-plus').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const idx = parseInt(e.target.getAttribute('data-index'));
                cart[idx].quantity += 1;
                updateCartUI();
            });
        });
    }

    // Quick add from Product Card (defaults to Standard size, no message)
    function quickAddToCart(productId, buttonEl) {
        const prod = PRODUCTS.find(p => p.id === productId);
        if (!prod) return;

        // Check if standard already exists
        const existingIdx = cart.findIndex(item => item.id === productId && item.size === 'standard');
        
        if (existingIdx > -1) {
            cart[existingIdx].quantity += 1;
        } else {
            cart.push({
                id: prod.id,
                title: prod.title,
                image: prod.image,
                size: 'standard',
                singlePrice: prod.price,
                quantity: 1,
                cardMessage: ''
            });
        }

        // Anim feedback on quick button
        const originalSvg = buttonEl.innerHTML;
        buttonEl.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="color: #FAF7F2;"><polyline points="20 6 9 17 4 12"></polyline></svg>`;
        buttonEl.style.backgroundColor = 'var(--color-success)';
        buttonEl.style.color = 'var(--color-white)';

        setTimeout(() => {
            buttonEl.innerHTML = originalSvg;
            buttonEl.style.backgroundColor = '';
            buttonEl.style.color = '';
        }, 1200);

        updateCartUI();
    }


    // --- 7. MODALS CONTROLS ---

    // Mobile Navigation Drawer Toggle
    mobileMenuTrigger.addEventListener('click', () => {
        mobileNavOverlay.classList.add('open');
    });

    closeMobileNav.addEventListener('click', () => {
        mobileNavOverlay.classList.remove('open');
    });

    mobileLinks.forEach(link => {
        link.addEventListener('click', () => {
            mobileNavOverlay.classList.remove('open');
        });
    });

    // Cart Sidebar Toggle
    cartTrigger.addEventListener('click', () => {
        cartSidebarOverlay.classList.add('open');
        updateCartUI();
    });

    closeCartBtn.addEventListener('click', () => {
        cartSidebarOverlay.classList.remove('open');
    });

    cartSidebarOverlay.addEventListener('click', (e) => {
        if (e.target === cartSidebarOverlay) {
            cartSidebarOverlay.classList.remove('open');
        }
    });

    // --- 7a. ADMIN ACCESS FROM CART ---
    if (adminAccessBtn) {
        adminAccessBtn.addEventListener('click', () => {
            window.location.href = 'admin.html';
        });
    }

    // Sticky Header Scroll effect
    window.addEventListener('scroll', () => {
        if (window.scrollY > 40) {
            mainHeader.classList.add('scrolled');
        } else {
            mainHeader.classList.remove('scrolled');
        }
    });

    // Filter Buttons logic (homepage)
    if (categoryFilters) {
        categoryFilters.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                categoryFilters.querySelector('.filter-btn.active').classList.remove('active');
                e.target.classList.add('active');
                renderProducts(e.target.getAttribute('data-category'));
            });
        });
    }

    // --- 8. PRODUCT DETAILED MODAL LOGIC ---
    function openProductModalFunc(productId) {
        currentSelectedProduct = PRODUCTS.find(p => p.id === productId);
        if (!currentSelectedProduct) return;

        // Reset fields
        modalQtyInput.value = 1;
        modalCardMessage.value = '';
        charCounter.textContent = '0 / 200 ký tự';
        
        // Select standard radio
        document.querySelector('input[name="flower-size"][value="standard"]').checked = true;

        // Set content
        modalProductTag.textContent = currentSelectedProduct.tag;
        modalProductTitle.textContent = currentSelectedProduct.title;
        modalProductPrice.textContent = formatCurrency(currentSelectedProduct.price);
        modalProductDescription.textContent = currentSelectedProduct.description;
        modalProductImage.style.backgroundImage = `url('${currentSelectedProduct.image}')`;

        // Render deltas
        sizeDeluxeDelta.textContent = `+${formatCurrency(250000)}`;
        sizePremiumDelta.textContent = `+${formatCurrency(600000)}`;

        // Open modal
        productModalOverlay.classList.add('open');
    }

    closeProductModal.addEventListener('click', () => {
        productModalOverlay.classList.remove('open');
        currentSelectedProduct = null;
    });

    productModalOverlay.addEventListener('click', (e) => {
        if (e.target === productModalOverlay) {
            productModalOverlay.classList.remove('open');
            currentSelectedProduct = null;
        }
    });

    // Sizing Options price updates
    sizeRadioInputs.forEach(input => {
        input.addEventListener('change', () => {
            if (!currentSelectedProduct) return;
            let currentPrice = currentSelectedProduct.price;
            if (input.value === 'deluxe') currentPrice += 250000;
            if (input.value === 'premium') currentPrice += 600000;
            modalProductPrice.textContent = formatCurrency(currentPrice);
        });
    });

    // Quantity selectors in Modal
    modalQtyMinus.addEventListener('click', () => {
        let val = parseInt(modalQtyInput.value);
        if (val > 1) {
            modalQtyInput.value = val - 1;
        }
    });

    modalQtyPlus.addEventListener('click', () => {
        let val = parseInt(modalQtyInput.value);
        if (val < 99) {
            modalQtyInput.value = val + 1;
        }
    });

    // Card message text limit counter
    modalCardMessage.addEventListener('input', (e) => {
        const len = e.target.value.length;
        charCounter.textContent = `${len} / 200 ký tự`;
    });

    // Add configured item from Modal to Cart
    modalAddToCartBtn.addEventListener('click', () => {
        if (!currentSelectedProduct) return;

        const size = document.querySelector('input[name="flower-size"]:checked').value;
        const quantity = parseInt(modalQtyInput.value);
        const cardMessage = modalCardMessage.value.trim();

        let singlePrice = currentSelectedProduct.price;
        if (size === 'deluxe') singlePrice += 250000;
        if (size === 'premium') singlePrice += 600000;

        // Check if identical item already in cart (same size & same message)
        const identicalIdx = cart.findIndex(item => 
            item.id === currentSelectedProduct.id && 
            item.size === size && 
            item.cardMessage === cardMessage
        );

        if (identicalIdx > -1) {
            cart[identicalIdx].quantity += quantity;
        } else {
            cart.push({
                id: currentSelectedProduct.id,
                title: currentSelectedProduct.title,
                image: currentSelectedProduct.image,
                size: size,
                singlePrice: singlePrice,
                quantity: quantity,
                cardMessage: cardMessage
            });
        }

        updateCartUI();
        
        // Visual flying cart confirmation
        modalAddToCartBtn.innerHTML = `<span>Đã thêm!</span>`;
        modalAddToCartBtn.style.backgroundColor = 'var(--color-success)';

        setTimeout(() => {
            modalAddToCartBtn.innerHTML = `
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path><line x1="3" y1="6" x2="21" y2="6"></line><path d="M16 10a4 4 0 0 1-8 0"></path></svg>
                <span>Thêm Vào Giỏ Hàng</span>
            `;
            modalAddToCartBtn.style.backgroundColor = '';
            productModalOverlay.classList.remove('open');
            
            // Trigger cart sidebar to slide open
            setTimeout(() => {
                cartSidebarOverlay.classList.add('open');
            }, 300);
        }, 1000);
    });


    // --- 9. STEP-BY-STEP CHECKOUT FLOW ---

    checkoutTriggerBtn.addEventListener('click', () => {
        if (cart.length === 0) return;
        
        // Sync any message already in first cart item to form
        if (cart[0].cardMessage) {
            checkoutCardMessage.value = cart[0].cardMessage;
        }

        // Set default delivery date to tomorrow
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const dayStr = tomorrow.toISOString().split('T')[0];
        document.getElementById('deliveryDate').setAttribute('min', dayStr);
        document.getElementById('deliveryDate').value = dayStr;

        // Close cart sidebar & open checkout modal
        cartSidebarOverlay.classList.remove('open');
        setTimeout(() => {
            openCheckoutModalFunc();
        }, 350);
    });

    function openCheckoutModalFunc() {
        checkoutStep = 1;
        selectedPaymentMethod = 'card';
        
        updateCheckoutStepsIndicator();
        updateCheckoutSummary();
        
        // Show step 1
        checkoutStep1.classList.add('active');
        checkoutStep2.classList.remove('active');
        checkoutStep3.classList.remove('active');

        cardCvvInput.value = '';
        cardCvvDisplay.textContent = '•••';
        creditCardPreview.classList.remove('flipped');

        if (window.FioreAuth) {
            window.FioreAuth.prefillCheckoutForm();
        }
        
        checkoutModalOverlay.classList.add('open');
    }

    closeCheckoutModal.addEventListener('click', () => {
        if (checkoutStep === 3) {
            // Already ordered successfully, closed success pane
            resetOrderComplete();
        } else {
            checkoutModalOverlay.classList.remove('open');
        }
        clearInterval(qrSimulateInterval);
    });

    checkoutModalOverlay.addEventListener('click', (e) => {
        if (e.target === checkoutModalOverlay) {
            if (checkoutStep === 3) {
                resetOrderComplete();
            } else {
                checkoutModalOverlay.classList.remove('open');
            }
            clearInterval(qrSimulateInterval);
        }
    });

    function updateCheckoutStepsIndicator() {
        const indicators = checkoutStepsIndicator.querySelectorAll('.step-indicator-item');
        indicators.forEach(ind => {
            const stepNum = parseInt(ind.getAttribute('data-step'));
            ind.classList.remove('active', 'completed');
            
            if (stepNum === checkoutStep) {
                ind.classList.add('active');
            } else if (stepNum < checkoutStep) {
                ind.classList.add('completed');
            }
        });
    }

    function updateCheckoutSummary() {
        checkoutSummaryItems.innerHTML = '';
        let subtotal = 0;
        
        cart.forEach(item => {
            const itemTotal = item.singlePrice * item.quantity;
            subtotal += itemTotal;
            
            const div = document.createElement('div');
            div.className = 'summary-item';
            div.innerHTML = `
                <div class="summary-item-img" style="background-image: url('${item.image}')"></div>
                <div class="summary-item-info">
                    <h5 class="summary-item-name">${item.title}</h5>
                    <span class="summary-item-meta">Size ${item.size.toUpperCase()} &times; ${item.quantity}</span>
                </div>
                <span class="summary-item-price">${formatCurrency(itemTotal)}</span>
            `;
            checkoutSummaryItems.appendChild(div);
        });

        const shippingLimit = 1000000;
        const shippingFee = subtotal >= shippingLimit ? 0 : 50000;
        
        // Calculate Discount
        let discount = 0;
        const discountTotalRow = document.getElementById('discountTotalRow');
        const appliedPromoLabel = document.getElementById('appliedPromoLabel');
        const checkoutSummaryDiscount = document.getElementById('checkoutSummaryDiscount');
        
        if (appliedCoupon && subtotal >= (appliedCoupon.minOrder || 0)) {
            if (appliedCoupon.type === 'percentage') {
                discount = Math.round((subtotal * (appliedCoupon.value || 0)) / 100);
            } else if (appliedCoupon.type === 'fixed') {
                discount = appliedCoupon.value || 0;
            }
            // Cap discount at subtotal
            discount = Math.min(discount, subtotal);
        } else {
            appliedCoupon = null; // Reset if conditions no longer met
        }
        
        if (discount > 0 && appliedCoupon) {
            if (discountTotalRow) discountTotalRow.style.display = 'flex';
            if (appliedPromoLabel) appliedPromoLabel.textContent = appliedCoupon.code;
            if (checkoutSummaryDiscount) checkoutSummaryDiscount.textContent = `-${formatCurrency(discount)}`;
        } else {
            if (discountTotalRow) discountTotalRow.style.display = 'none';
        }
        
        const total = Math.max(0, subtotal + shippingFee - discount);

        checkoutSummarySubtotal.textContent = formatCurrency(subtotal);
        checkoutSummaryShipping.textContent = shippingFee === 0 ? 'Miễn phí' : formatCurrency(shippingFee);
        checkoutSummaryTotal.textContent = formatCurrency(total);
        
        // Step 2 QR payments updates
        qrPaymentAmount.textContent = formatCurrency(total);
        // Auto-refresh VietQR with new amount (transfer message set later when step 2 opens)
        const currentMsg = qrTransferMessage ? qrTransferMessage.textContent : 'FIORE';
        updateVietQR(total, currentMsg);
    }

    // Step 1: Submit Form to go to Step 2
    shippingForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        // Go to Step 2
        checkoutStep = 2;
        updateCheckoutStepsIndicator();
        
        checkoutStep1.classList.remove('active');
        checkoutStep2.classList.add('active');

        // Set up unique payment transfer description for QR
        const randId = Math.floor(100000 + Math.random() * 900000);
        const transferMsg = `FIORE${randId}`;
        qrTransferMessage.textContent = transferMsg;

        // Update VietQR with real amount & transfer message
        const currentTotal = parseFloat(
            (checkoutSummaryTotal?.textContent || '0').replace(/[^\d]/g, '')
        ) || 0;
        updateVietQR(currentTotal, transferMsg);
        
        setupCardPaymentFields();

        // If QR is selected, begin checking fake interval (in 10 seconds auto checkout)
        if (selectedPaymentMethod === 'qr') {
            startQrSimulation();
        }
    });

    // Back to Step 1 Buttons
    backToStep1Btns.forEach(btn => {
        btn.addEventListener('click', () => {
            checkoutStep = 1;
            updateCheckoutStepsIndicator();
            checkoutStep2.classList.remove('active');
            checkoutStep1.classList.add('active');
            clearInterval(qrSimulateInterval);
        });
    });


    // --- 10. METHOD SELECTION TABS IN STEP 2 ---
    tabBtnCard.addEventListener('click', () => {
        selectedPaymentMethod = 'card';
        tabBtnCard.classList.add('active');
        tabBtnQr.classList.remove('active');
        paymentPanelCard.classList.add('active');
        paymentPanelQr.classList.remove('active');
        clearInterval(qrSimulateInterval);
        setupCardPaymentFields();
    });

    tabBtnQr.addEventListener('click', () => {
        selectedPaymentMethod = 'qr';
        tabBtnQr.classList.add('active');
        tabBtnCard.classList.remove('active');
        paymentPanelQr.classList.add('active');
        paymentPanelCard.classList.remove('active');
        startQrSimulation();
    });


    // --- 11. INTERACTIVE 3D CREDIT CARD EFFECT ---

    const cardBindingNotice = document.getElementById('cardBindingNotice');
    const cardPaymentError = document.getElementById('cardPaymentError');
    const btnChangeCardNumber = document.getElementById('btnChangeCardNumber');

    function showCardPaymentError(msg) {
        if (!cardPaymentError) return;
        if (!msg) {
            cardPaymentError.style.display = 'none';
            cardPaymentError.textContent = '';
            return;
        }
        cardPaymentError.textContent = msg;
        cardPaymentError.style.display = 'block';
    }

    function showCardBindingNotice(msg) {
        if (!cardBindingNotice) return;
        if (!msg) {
            cardBindingNotice.hidden = true;
            cardBindingNotice.textContent = '';
            return;
        }
        cardBindingNotice.textContent = msg;
        cardBindingNotice.hidden = false;
    }

    function resetCardFieldsEditable() {
        cardNumberInput.readOnly = false;
        delete cardNumberInput.dataset.locked;
        cardHolderInput.readOnly = false;
        cardExpiryInput.readOnly = false;
    }

    function setupCardPaymentFields() {
        showCardPaymentError('');
        resetCardFieldsEditable();
        cardCvvInput.value = '';
        cardCvvDisplay.textContent = '•••';
        creditCardPreview.classList.remove('flipped');

        const auth = window.FioreAuth;
        const user = auth?.getCurrentUser?.();

        if (!user) {
            showCardBindingNotice('Vui lòng đăng nhập để thanh toán bằng thẻ Visa.');
            cardNumberInput.value = '';
            cardNumberInput.placeholder = '4111 2222 3333 4444';
            cardNumDisplay.textContent = '•••• •••• •••• ••••';
            cardHolderInput.value = '';
            cardHolderDisplay.textContent = 'NGUYEN VAN A';
            cardExpiryInput.value = '';
            cardExpiryDisplay.textContent = 'MM/YY';
            if (btnChangeCardNumber) btnChangeCardNumber.style.display = 'none';
            return;
        }

        const bound = auth.getBoundCard(user.id);

        if (bound) {
            cardNumberInput.value = '';
            cardNumberInput.placeholder = `Nhập lại số thẻ kết thúc ${bound.digits.slice(-4)}`;
            cardNumDisplay.textContent = '•••• •••• •••• ••••';
            showCardBindingNotice(
                `Mỗi tài khoản chỉ dùng một thẻ (•••• ${bound.digits.slice(-4)}). ` +
                `Bạn phải nhập lại đúng số thẻ đã đăng ký lần đầu. CVV nhập mới mỗi lần thanh toán.`
            );
            if (btnChangeCardNumber) btnChangeCardNumber.style.display = 'none';

            if (bound.holder) {
                cardHolderInput.value = bound.holder;
                cardHolderDisplay.textContent = bound.holder;
                cardHolderInput.readOnly = true;
            } else {
                cardHolderInput.value = '';
                cardHolderInput.readOnly = false;
                cardHolderDisplay.textContent = 'NGUYEN VAN A';
            }

            if (bound.expiry) {
                cardExpiryInput.value = bound.expiry;
                cardExpiryDisplay.textContent = bound.expiry;
                cardExpiryInput.readOnly = true;
            } else {
                cardExpiryInput.value = '';
                cardExpiryInput.readOnly = false;
                cardExpiryDisplay.textContent = 'MM/YY';
            }
        } else {
            showCardBindingNotice(
                'Lần thanh toán đầu tiên: số thẻ sẽ được gắn cố định với tài khoản. ' +
                'Từ lần sau bạn phải nhập lại đúng số thẻ đó mới thanh toán được.'
            );
            cardNumberInput.value = '';
            cardNumberInput.placeholder = '4111 2222 3333 4444';
            cardNumDisplay.textContent = '•••• •••• •••• ••••';
            cardHolderInput.value = '';
            cardHolderInput.readOnly = false;
            cardHolderDisplay.textContent = 'NGUYEN VAN A';
            cardExpiryInput.value = '';
            cardExpiryInput.readOnly = false;
            cardExpiryDisplay.textContent = 'MM/YY';
            if (btnChangeCardNumber) btnChangeCardNumber.style.display = 'none';
        }
    }

    function validateCardPayment() {
        const auth = window.FioreAuth;
        const user = auth?.getCurrentUser?.();

        if (!user) {
            return { ok: false, message: 'Vui lòng đăng nhập để thanh toán bằng thẻ Visa.' };
        }

        const digits = (cardNumberInput.value || '').replace(/\D/g, '').slice(0, 16);
        if (digits.length !== 16) {
            return { ok: false, message: 'Vui lòng nhập đủ 16 số thẻ.' };
        }

        const cvv = (cardCvvInput.value || '').replace(/\D/g, '');
        if (cvv.length < 3) {
            return { ok: false, message: 'Vui lòng nhập mã CVV (3 số).' };
        }

        const holder = (cardHolderInput.value || '').trim().toUpperCase();
        if (!holder) {
            return { ok: false, message: 'Vui lòng nhập tên trên thẻ.' };
        }

        const expiry = (cardExpiryInput.value || '').trim();
        if (!/^\d{2}\/\d{2}$/.test(expiry)) {
            return { ok: false, message: 'Ngày hết hạn không hợp lệ (MM/YY).' };
        }

        const bound = auth.getBoundCard(user.id);
        if (bound && digits !== bound.digits) {
            return {
                ok: false,
                message: `Số thẻ không đúng. Tài khoản chỉ chấp nhận thẻ kết thúc ${bound.digits.slice(-4)}.`
            };
        }

        return { ok: true, digits, holder, expiry, user, isFirstBind: !bound };
    }

    cardNumberInput.addEventListener('input', (e) => {
        const formatted = formatCardNumber(e.target.value);
        e.target.value = formatted;
        cardNumDisplay.textContent = formatted || '•••• •••• •••• ••••';
        showCardPaymentError('');
    });

    cardHolderInput.addEventListener('input', (e) => {
        if (e.target.readOnly) return;
        const formatted = e.target.value.replace(/[^a-zA-Z\s]/g, '').toUpperCase();
        e.target.value = formatted;
        cardHolderDisplay.textContent = formatted || 'NGUYEN VAN A';
    });

    cardExpiryInput.addEventListener('input', (e) => {
        if (e.target.readOnly) return;
        const formatted = formatCardExpiry(e.target.value);
        e.target.value = formatted;
        cardExpiryDisplay.textContent = formatted || 'MM/YY';
    });

    cardCvvInput.addEventListener('input', (e) => {
        const val = e.target.value.replace(/[^0-9]/g, '');
        e.target.value = val;
        cardCvvDisplay.textContent = val.replace(/./g, '•') || '•••';
    });

    // Rotating 3D card preview on CVV focus/blur
    cardCvvInput.addEventListener('focus', () => {
        creditCardPreview.classList.add('flipped');
    });

    cardCvvInput.addEventListener('blur', () => {
        creditCardPreview.classList.remove('flipped');
    });

    // Card Form Checkout submission
    creditCardForm.addEventListener('submit', (e) => {
        e.preventDefault();
        showCardPaymentError('');

        const validation = validateCardPayment();
        if (!validation.ok) {
            showCardPaymentError(validation.message);
            if (!window.FioreAuth?.getCurrentUser?.()) {
                window.FioreAuth?.openAuthModal?.('login');
            }
            return;
        }

        if (validation.isFirstBind) {
            const bindResult = window.FioreAuth.bindCardToUser(validation.user.id, {
                digits: validation.digits,
                holder: validation.holder,
                expiry: validation.expiry
            });
            if (!bindResult.ok) {
                showCardPaymentError(bindResult.message);
                return;
            }
        }
        
        // Show payment spinner/loading screen for elegance
        const originalBtnText = document.getElementById('cardPaymentSubmit').innerHTML;
        document.getElementById('cardPaymentSubmit').innerHTML = `<div class="spinner-circle-small" style="border-top-color: #FAF7F2"></div> <span>Đang xác thực...</span>`;
        document.getElementById('cardPaymentSubmit').disabled = true;

        setTimeout(() => {
            document.getElementById('cardPaymentSubmit').innerHTML = originalBtnText;
            document.getElementById('cardPaymentSubmit').disabled = false;
            
            // Go to step 3
            completeCheckout();
        }, 2000);
    });


    // --- 12. BANK QR CODE COPY ACTIONS & SIMULATOR ---
    
    // Copy Action on Account number
    if (qrAccountNumber) {
        qrAccountNumber.addEventListener('click', () => {
            copyTextToClipboard(qrAccountNumber.textContent.replace(/\s/g, ''), qrAccountNumber);
        });
    }

    // Copy Action on message description
    if (qrTransferMessage) {
        qrTransferMessage.addEventListener('click', () => {
            copyTextToClipboard(qrTransferMessage.textContent, qrTransferMessage);
        });
    }

    function copyTextToClipboard(text, element) {
        navigator.clipboard.writeText(text).then(() => {
            element.classList.add('copied');
            setTimeout(() => {
                element.classList.remove('copied');
            }, 2000);
        });
    }

    // Auto-complete simulate on QR scan
    function startQrSimulation() {
        clearInterval(qrSimulateInterval);
        // Simulate payment receiving after 10 seconds of scanning
        qrSimulateInterval = setInterval(() => {
            clearInterval(qrSimulateInterval);
            completeCheckout();
        }, 12000);
    }

    if (btnSimulateQrPay) {
        btnSimulateQrPay.addEventListener('click', () => {
            clearInterval(qrSimulateInterval);
            completeCheckout();
        });
    }


    // --- 13. COMPLETE ORDER SUCCESS STAGE ---
    function completeCheckout() {
        checkoutStep = 3;
        updateCheckoutStepsIndicator();
        
        checkoutStep2.classList.remove('active');
        checkoutStep3.classList.add('active');

        // Hide side summary
        document.getElementById('checkoutSummaryPanel').style.display = 'none';
        document.querySelector('.checkout-layout').style.gridTemplateColumns = '1fr';

        // Extract values for success card
        const sender      = document.getElementById('senderName').value;
        const senderPhone = document.getElementById('senderPhone').value;
        const senderEmailVal = document.getElementById('senderEmail').value;
        const recipient   = document.getElementById('recipientName').value;
        const recipientPhone = document.getElementById('recipientPhone').value;
        const address     = document.getElementById('recipientAddress').value;
        const deliveryDateVal = document.getElementById('deliveryDate').value;
        const deliveryTimeVal = document.getElementById('deliveryTimeSlot').value;
        const cardMsgVal  = checkoutCardMessage.value.trim() || 'Không kèm lời chúc';
        const orderId     = `FIORE-${Math.floor(100000 + Math.random() * 900000)}`;
        const orderTotal  = checkoutSummaryTotal.textContent;
        
        // Format delivery Date
        const dateObj = new Date(deliveryDateVal);
        const formattedDate = isNaN(dateObj.getTime()) 
            ? deliveryDateVal 
            : `${dateObj.getDate().toString().padStart(2, '0')}/${(dateObj.getMonth() + 1).toString().padStart(2, '0')}/${dateObj.getFullYear()}`;

        // Build cart items HTML string for email
        const cartItemsHtml = cart.map(item => {
            const itemTotal = item.singlePrice * item.quantity;
            return `• ${item.title} (Size: ${item.size.toUpperCase()}) x${item.quantity} — ${formatCurrency(itemTotal)}`;
        }).join('\n');

        // Populate success card UI
        successOrderId.textContent = orderId;
        successSender.textContent  = sender;
        if (successEmail) successEmail.textContent = senderEmailVal;
        successRecipient.textContent  = `${recipient} (${address})`;
        successDeliveryTime.textContent = `${formattedDate} trong khung giờ ${deliveryTimeVal}`;
        successTotalAmount.textContent  = orderTotal;
        successCardMessage.textContent  = `"${cardMsgVal}"`;
        
        // Snapshot cart BEFORE clearing
        const cartSnapshot = [...cart];

        // Persist order for admin page
        addOrderToStorage({
            id: orderId,
            createdAt: new Date().toISOString(),
            status: 'new', // new | processing | completed | cancelled
            paymentMethod: selectedPaymentMethod,
            sender: {
                name: sender,
                phone: senderPhone,
                email: senderEmailVal
            },
            recipient: {
                name: recipient,
                phone: recipientPhone,
                address
            },
            delivery: {
                dateRaw: deliveryDateVal,
                date: formattedDate,
                timeSlot: deliveryTimeVal
            },
            cardMessage: cardMsgVal,
            totalText: orderTotal,
            discountCode: appliedCoupon ? appliedCoupon.code : null,
            discountAmount: appliedCoupon ? (function() {
                let subtotal = cartSnapshot.reduce((sum, item) => sum + item.singlePrice * item.quantity, 0);
                let disc = 0;
                if (appliedCoupon.type === 'percentage') {
                    disc = Math.round((subtotal * appliedCoupon.value) / 100);
                } else {
                    disc = appliedCoupon.value;
                }
                return Math.min(disc, subtotal);
            })() : 0,
            items: cartSnapshot.map(item => ({
                id: item.id,
                title: item.title,
                size: item.size,
                singlePrice: item.singlePrice,
                quantity: item.quantity,
                image: item.image,
                cardMessage: item.cardMessage || ''
            }))
        });

        // Clear cart BEFORE sending email so email shows correct items
        cart = [];
        updateCartUI();

        // Send emails via EmailJS
        sendOrderEmails({
            orderId,
            sender,
            senderPhone,
            senderEmail: senderEmailVal,
            recipient,
            recipientPhone,
            address,
            deliveryDate: formattedDate,
            deliveryTime: deliveryTimeVal,
            cardMessage: cardMsgVal,
            cartItemsText: cartSnapshot.map(item =>
                `${item.title} (${item.size.toUpperCase()}) x${item.quantity} = ${formatCurrency(item.singlePrice * item.quantity)}`
            ).join(' | '),
            orderTotal
        });
    }

    // --- 13a. EMAILJS SEND FUNCTION ---
    async function sendOrderEmails(data) {
        // Show sending status
        emailSendingStatus.style.display = 'flex';
        emailSpinner.style.display = 'block';
        emailStatusText.textContent = 'Đang gửi email xác nhận đơn hàng...';
        emailStatusText.style.color = '';

        // Check if EmailJS is configured
        if (EMAILJS_CONFIG.publicKey === 'YOUR_PUBLIC_KEY') {
            setTimeout(() => {
                emailSpinner.style.display = 'none';
                emailStatusText.innerHTML = `⚠️ EmailJS chưa được cấu hình. <a href="https://www.emailjs.com" target="_blank" style="color:var(--color-brand);text-decoration:underline">Xem hướng dẫn setup</a>`;
                emailStatusText.style.color = '#b45309';
            }, 800);
            return;
        }

        // Initialize EmailJS
        emailjs.init({ publicKey: EMAILJS_CONFIG.publicKey });

        const templateParams = {
            order_id:         data.orderId,
            sender_name:      data.sender,
            sender_phone:     data.senderPhone,
            sender_email:     data.senderEmail,
            recipient_name:   data.recipient,
            recipient_phone:  data.recipientPhone,
            recipient_address:data.address,
            delivery_date:    data.deliveryDate,
            delivery_time:    data.deliveryTime,
            card_message:     data.cardMessage,
            cart_items:       data.cartItemsText,
            order_total:      data.orderTotal,
            store_email:      EMAILJS_CONFIG.storeEmail
        };

        try {
            // Send email to customer
            await emailjs.send(
                EMAILJS_CONFIG.serviceId,
                EMAILJS_CONFIG.customerTemplateId,
                { ...templateParams, to_email: data.senderEmail, to_name: data.sender }
            );

            // Send notification email to store
            await emailjs.send(
                EMAILJS_CONFIG.serviceId,
                EMAILJS_CONFIG.storeTemplateId,
                { ...templateParams, to_email: EMAILJS_CONFIG.storeEmail, to_name: 'Fiòre' }
            );

            // Success!
            emailSpinner.style.display = 'none';
            emailStatusText.innerHTML = `✅ Email xác nhận đã gửi tới <strong>${data.senderEmail}</strong> thành công!`;
            emailStatusText.style.color = '#2d6a4f';

        } catch (error) {
            console.error('EmailJS error:', error);
            emailSpinner.style.display = 'none';
            emailStatusText.innerHTML = `❌ Không gửi được email. Vui lòng liên hệ hotline <strong>1900 6825</strong> để xác nhận đơn hàng.`;
            emailStatusText.style.color = '#c0392b';
        }
    }

    // Reset checkout forms & close modals
    function resetOrderComplete() {
        // Restore checkout sidebar column
        document.getElementById('checkoutSummaryPanel').style.display = '';
        document.querySelector('.checkout-layout').style.gridTemplateColumns = '';
        
        checkoutModalOverlay.classList.remove('open');
        
        // Reset inputs
        shippingForm.reset();
        creditCardForm.reset();
        checkoutCardMessage.value = '';

        // Reset promo codes
        appliedCoupon = null;
        const promoInput = document.getElementById('promoCodeInput');
        if (promoInput) promoInput.value = '';
        const promoFeedback = document.getElementById('promoFeedback');
        if (promoFeedback) {
            promoFeedback.style.display = 'none';
            promoFeedback.textContent = '';
        }
        const discountTotalRow = document.getElementById('discountTotalRow');
        if (discountTotalRow) discountTotalRow.style.display = 'none';

        setupCardPaymentFields();
    }

    // --- 13b. PROMO CODE APPLICATION ---
    const btnApplyPromo = document.getElementById('btnApplyPromo');
    const promoCodeInput = document.getElementById('promoCodeInput');
    const promoFeedback = document.getElementById('promoFeedback');

    if (btnApplyPromo) {
        btnApplyPromo.addEventListener('click', () => {
            if (!promoCodeInput || !promoFeedback) return;
            const code = (promoCodeInput.value || '').trim().toUpperCase();
            promoFeedback.style.display = 'block';
            
            if (!code) {
                promoFeedback.textContent = 'Vui lòng nhập mã giảm giá.';
                promoFeedback.style.color = 'var(--color-error)';
                appliedCoupon = null;
                updateCheckoutSummary();
                return;
            }

            // Get coupons from localStorage
            let coupons = [];
            try {
                const raw = localStorage.getItem('fiore_coupons');
                coupons = raw ? JSON.parse(raw) : [];
            } catch (e) {}

            // Pre-seed some default coupons if empty
            if (!coupons || coupons.length === 0) {
                coupons = [
                    { code: 'WELCOME10', type: 'percentage', value: 10, minOrder: 0, active: true },
                    { code: 'FIOREGOLD', type: 'percentage', value: 15, minOrder: 1500000, active: true },
                    { code: 'FREESHIP', type: 'fixed', value: 50000, minOrder: 0, active: true }
                ];
                try {
                    localStorage.setItem('fiore_coupons', JSON.stringify(coupons));
                } catch (e) {}
            }

            const coupon = coupons.find(c => c.code.toUpperCase() === code);
            
            if (!coupon) {
                promoFeedback.textContent = 'Mã giảm giá không hợp lệ.';
                promoFeedback.style.color = 'var(--color-error)';
                appliedCoupon = null;
                updateCheckoutSummary();
                return;
            }

            if (!coupon.active) {
                promoFeedback.textContent = 'Mã giảm giá này đã hết hiệu lực.';
                promoFeedback.style.color = 'var(--color-error)';
                appliedCoupon = null;
                updateCheckoutSummary();
                return;
            }

            // Calculate current subtotal
            const subtotal = cart.reduce((sum, item) => sum + item.singlePrice * item.quantity, 0);
            if (subtotal < (coupon.minOrder || 0)) {
                promoFeedback.textContent = `Mã này chỉ áp dụng cho đơn hàng tối thiểu ${formatCurrency(coupon.minOrder)}.`;
                promoFeedback.style.color = 'var(--color-error)';
                appliedCoupon = null;
                updateCheckoutSummary();
                return;
            }

            // Apply successfully!
            appliedCoupon = coupon;
            promoFeedback.textContent = `Áp dụng mã ${coupon.code} thành công!`;
            promoFeedback.style.color = 'var(--color-success)';
            
            updateCheckoutSummary();
        });
    }

    btnCloseSuccessAndReset.addEventListener('click', () => {
        resetOrderComplete();
    });

    // --- 14. INITIALIZE APP ---
    window.FioreApp = {
        PRODUCTS,
        formatCurrency,
        renderProductsToGrid,
        openProductModal: openProductModalFunc,
        quickAddToCart,
        getTagClass
    };

    if (productsGrid) {
        renderProducts('all');
    }
    // --- 15. PREMIUM CHATBOT LOGIC ---
    const chatbotFab = document.getElementById('chatbotFab');
    const chatbotWindow = document.getElementById('chatbotWindow');
    const chatbotCloseBtn = document.getElementById('chatbotCloseBtn');
    const chatbotMessages = document.getElementById('chatbotMessages');
    const chatbotInput = document.getElementById('chatbotInput');
    const chatbotSendBtn = document.getElementById('chatbotSendBtn');

    if (chatbotFab && chatbotWindow && chatbotCloseBtn && chatbotMessages) {
        // Toggle Chat Window
        chatbotFab.addEventListener('click', () => {
            chatbotWindow.classList.add('open');
            chatbotFab.style.display = 'none'; // Ẩn FAB khi mở cửa sổ chat
            
            // Send welcome message if empty
            if (chatbotMessages.children.length === 0) {
                sendBotMessage("Xin chào! 🌸 Fióre Boutique de Fleurs rất vui được hỗ trợ bạn. Bạn cần tư vấn chọn hoa, giao hàng hay thông tin gì ạ?", [
                    { text: "💐 Chọn hoa sinh nhật", keyword: "sinh nhật" },
                    { text: "🚚 Thời gian & phí ship", keyword: "giao hàng" },
                    { text: "💳 Cách thức thanh toán", keyword: "thanh toán" },
                    { text: "🎁 Khuyến mãi hiện có", keyword: "khuyến mãi" }
                ]);
            }
        });

        chatbotCloseBtn.addEventListener('click', () => {
            chatbotWindow.classList.remove('open');
            chatbotFab.style.display = 'flex'; // Hiện lại FAB khi đóng cửa sổ chat
        });

        // Click outside to close chat
        document.addEventListener('click', (e) => {
            if (!chatbotWindow.contains(e.target) && !chatbotFab.contains(e.target) && chatbotWindow.classList.contains('open')) {
                chatbotWindow.classList.remove('open');
                chatbotFab.style.display = 'flex';
            }
        });

        // Send Message on Enter
        chatbotInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                handleUserSendMessage();
            }
        });

        if (chatbotSendBtn) {
            chatbotSendBtn.addEventListener('click', () => {
                handleUserSendMessage();
            });
        }

        function handleUserSendMessage() {
            if (!chatbotInput) return;
            const query = chatbotInput.value.trim();
            if (!query) return;

            // Render User Message
            renderMessage(query, 'user');
            chatbotInput.value = '';

            // Simulate typing and reply
            setTimeout(() => {
                const reply = getBotReply(query);
                sendBotMessage(reply.text, reply.quickReplies);
            }, 800);
        }

        function renderMessage(text, sender) {
            const msgDiv = document.createElement('div');
            msgDiv.className = `chatbot-msg ${sender}`;
            msgDiv.textContent = text;
            chatbotMessages.appendChild(msgDiv);
            
            // Auto scroll to bottom
            chatbotMessages.scrollTop = chatbotMessages.scrollHeight;
        }

        function sendBotMessage(text, quickReplies = []) {
            renderMessage(text, 'bot');

            // Render Quick Replies
            if (quickReplies && quickReplies.length > 0) {
                const qrDiv = document.createElement('div');
                qrDiv.className = 'chatbot-quick-replies';
                
                quickReplies.forEach(qr => {
                    const btn = document.createElement('button');
                    btn.type = 'button';
                    btn.className = 'chatbot-quick-btn';
                    btn.textContent = qr.text;
                    btn.addEventListener('click', () => {
                        renderMessage(qr.text, 'user');
                        qrDiv.remove(); // Xóa quick replies sau khi click
                        
                        setTimeout(() => {
                            const reply = getBotReply(qr.keyword);
                            sendBotMessage(reply.text, reply.quickReplies);
                        }, 800);
                    });
                    qrDiv.appendChild(btn);
                });
                
                chatbotMessages.appendChild(qrDiv);
                chatbotMessages.scrollTop = chatbotMessages.scrollHeight;
            }
        }

        function getBotReply(query) {
            const q = query.toLowerCase();
            
            // Keywords matching
            if (q.includes('sinh nhật') || q.includes('chúc mừng') || q.includes('sinh nhat')) {
                return {
                    text: "🎁 Đối với dịp sinh nhật, Fióre khuyên bạn nên chọn: \n1. Bó Hướng Dương Nắng Sài Gòn (580k) rực rỡ tươi trẻ. \n2. Bình Tulip Ánh Dương (950k) thanh lịch. \n3. Sắc Màu Rạng Rỡ (650k) đa sắc sang trọng. \nBạn có muốn xem chi tiết mẫu nào không ạ?",
                    quickReplies: [
                        { text: "🌻 Xem Hướng Dương 580k", keyword: "hướng dương" },
                        { text: "🌷 Xem Tulip 950k", keyword: "tulip" },
                        { text: "🏡 Xem bản đồ & địa chỉ", keyword: "địa chỉ" }
                    ]
                };
            }
            
            if (q.includes('lãng mạn') || q.includes('yêu') || q.includes('tình yêu') || q.includes('người yêu') || q.includes('vo') || q.includes('vợ') || q.includes('tỏ tình')) {
                return {
                    text: "💖 Dành tặng sự ngọt ngào lãng mạn, các Floral Designer của Fióre gợi ý: \n1. Bó Hồng Thơ Ngây (750k) - bán chạy nhất, mang tone hồng phấn đài các. \n2. Lãng Mạn Nhung Đỏ (890k) - 99 đóa hồng đỏ thắm kiêu sa. \n3. Giấc Mơ Pastel Mẫu Đơn (1250k) sang trọng kiêu kỳ.",
                    quickReplies: [
                        { text: "🌹 Xem Bó Hồng Thơ Ngây", keyword: "thơ ngây" },
                        { text: "🚚 Tư vấn ship hỏa tốc", keyword: "giao hàng" }
                    ]
                };
            }

            if (q.includes('hướng dương')) {
                return {
                    text: "🌻 Bó Hướng Dương Nắng Sài Gòn (580.000đ) là sự kết hợp hoàn hảo giữa những đóa hướng dương rực rỡ và cúc Tana hoang dã. Bọc bằng giấy kraft mộc và thắt nơ đay tinh tế, rất được ưa chuộng cho dịp chúc mừng, sinh nhật hoặc tốt nghiệp!",
                    quickReplies: [
                        { text: "🛍️ Đặt hoa hướng dương", keyword: "hướng dương" },
                        { text: "💳 Hướng dẫn thanh toán", keyword: "thanh toán" }
                    ]
                };
            }

            if (q.includes('tulip')) {
                return {
                    text: "🌷 Bình Tulip Ánh Dương (950.000đ) gồm những đóa Tulip tươi nhập khẩu màu trắng và vàng, cắm nghệ thuật trong bình thủy tinh phong cách tối giản Bắc Âu. Rất hợp trang trí nhà cửa hoặc làm quà tặng tinh tế!",
                    quickReplies: [
                        { text: "💳 Xem số tài khoản thanh toán", keyword: "thanh toán" },
                        { text: "🎁 Xem ưu đãi khác", keyword: "khuyến mãi" }
                    ]
                };
            }

            if (q.includes('giao hàng') || q.includes('ship') || q.includes('phí ship') || q.includes('giao hoa')) {
                return {
                    text: "🚚 Chính sách giao hoa cực nhanh của Fióre: \n- Cam kết giao hoa hỏa tốc trong 2 giờ. \n- Miễn phí vận chuyển cho đơn hàng từ 1.000.000đ trở lên. \n- Với đơn hàng dưới 1.000.000đ, phí ship đồng giá hỏa tốc nội thành là 50.000đ.",
                    quickReplies: [
                        { text: "💳 Cách thanh toán đơn", keyword: "thanh toán" },
                        { text: "📞 Số điện thoại Hotline", keyword: "hotline" }
                    ]
                };
            }

            if (q.includes('thanh toán') || q.includes('chuyển khoản') || q.includes('ngân hàng') || q.includes('ck') || q.includes('tai khoan') || q.includes('tài khoản')) {
                return {
                    text: "💳 Fióre hỗ trợ 2 phương thức thanh toán an toàn: \n1. Quét mã QR Dynamic qua VietQR Ngân hàng MBBank: \n- Số tài khoản: 091604468 \n- Chủ tài khoản: Ngô Thủy Vân \n- Ngân hàng: MBBank (MB) \n2. Thẻ tín dụng quốc tế Visa/MasterCard bảo mật cao.",
                    quickReplies: [
                        { text: "🎁 Khuyến mãi giảm giá", keyword: "khuyến mãi" },
                        { text: "📞 Liên hệ trực tiếp", keyword: "hotline" }
                    ]
                };
            }

            if (q.includes('khuyến mãi') || q.includes('giảm giá') || q.includes('mã giảm') || q.includes('coupon') || q.includes('voucher') || q.includes('code')) {
                return {
                    text: "🎁 Các chương trình ưu đãi hiện tại của Fióre: \n- Mã WELCOME10: Giảm ngay 10% cho đơn hàng đầu tiên. \n- Mã FIOREGOLD: Giảm 15% cho các đơn hàng cao cấp trên 1.500.000đ. \n- Mã FREESHIP: Miễn phí vận chuyển (50k) cho mọi đơn hàng.",
                    quickReplies: [
                        { text: "💳 Hướng dẫn thanh toán", keyword: "thanh toán" },
                        { text: "🚚 Phí ship hỏa tốc", keyword: "giao hàng" }
                    ]
                };
            }

            if (q.includes('địa chỉ') || q.includes('cửa hàng') || q.includes('dia chi') || q.includes('huế') || q.includes('ở đâu')) {
                return {
                    text: "🏡 Showroom nghệ thuật hoa tươi Fióre: \n- Địa chỉ: 34 Trần Thái Tông, Thuần Hóa, TP. Huế. \n- Giờ mở cửa: 07:30 - 21:30 hàng ngày (kể cả ngày lễ). \nBạn có thể ghé trực tiếp showroom để ngắm hoa và thưởng trà nhé!",
                    quickReplies: [
                        { text: "📞 Gọi điện Hotline", keyword: "hotline" },
                        { text: "💐 Tư vấn chọn mẫu hoa", keyword: "sinh nhật" }
                    ]
                };
            }

            if (q.includes('hotline') || q.includes('số điện thoại') || q.includes('sđt') || q.includes('liên hệ') || q.includes('dien thoai')) {
                return {
                    text: "📞 Bạn cần liên hệ gấp? \n- Hotline trực 24/7: 0916044683 \n- Email hỗ trợ: thuyvanngo35@gmail.com \nNhân viên chăm sóc khách hàng của Fióre sẽ hỗ trợ giải đáp mọi thắc mắc ngay lập tức ạ!",
                    quickReplies: [
                        { text: "🏡 Xem địa chỉ cửa hàng", keyword: "địa chỉ" },
                        { text: "🎁 Xem các mã giảm giá", keyword: "khuyến mãi" }
                    ]
                };
            }

            // Default fallback
            return {
                text: "🌸 Fióre rất tiếc chưa hiểu rõ câu hỏi này. Bạn có thể nhấn chọn một trong các chủ đề gợi ý nhanh bên dưới, hoặc gọi trực tiếp Hotline 0916044683 để nhân viên Florist hỗ trợ bạn ngay tức khắc nhé!",
                quickReplies: [
                    { text: "💐 Tư vấn chọn hoa tươi", keyword: "sinh nhật" },
                    { text: "🚚 Thời gian giao hàng", keyword: "giao hàng" },
                    { text: "💳 Tài khoản ngân hàng", keyword: "thanh toán" },
                    { text: "📞 Gọi Hotline 0916044683", keyword: "hotline" }
                ]
            };
        }
    }

    updateCartUI();

});
