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
    
    // --- 1. PRODUCT DATABASE ---
    const PRODUCTS = [
        {
            id: 'bouquet_1',
            title: 'Thơ Ngây Rose Bouquet',
            category: 'romance',
            categoryLabel: 'Tình Yêu & Sự Lãng Mạn',
            price: 750000,
            image: 'images/bouquet_1.png',
            tag: 'BESTSELLER',
            description: 'Bó hoa "Thơ Ngây" được thiết kế ngọt ngào từ những đóa hồng nhập khẩu Ecuador cao cấp màu phấn hồng và trắng tinh khôi, kết hợp cành bạch đàn hương thơm dịu nhẹ. Đây là món quà hoàn hảo nhất gửi gắm trọn vẹn thông điệp lãng mạn dịu dàng cho người thương.'
        },
        {
            id: 'bouquet_2',
            title: 'Ánh Dương Tulip Bowl',
            category: 'birthday',
            categoryLabel: 'Sinh Nhật & Chúc Mừng',
            price: 950000,
            image: 'images/bouquet_2.png',
            tag: 'NEW',
            description: 'Tác phẩm hoa Tulip tươi nhập khẩu được sắp đặt tinh tế trong bình thủy tinh phong cách tối giản Bắc Âu. Những bông Tulip trắng đại diện cho sự chân thành, phối cùng Tulip vàng mang lại may mắn, thắp sáng mọi không gian sống.'
        },
        {
            id: 'bouquet_3',
            title: 'Dạ Khúc Hydrangea & Orchids',
            category: 'grand',
            categoryLabel: 'Khai Trương & Sự Kiện',
            price: 1650000,
            image: 'images/bouquet_3.png',
            tag: 'LUXURY SIGNATURE',
            description: 'Bình hoa nghệ thuật cẩm tú cầu đại đóa màu lam tím kiêu sa, điểm xuyết những nhánh lan hồ điệp trắng quý phái. Đặt trong bình sứ cao cấp, tác phẩm toát lên vẻ vương giả và thanh lịch khó tả, gửi gắm lời chúc thành công phát đạt.'
        },
        {
            id: 'bouquet_4',
            title: 'Nắng Sài Gòn Sunflower Wrap',
            category: 'birthday',
            categoryLabel: 'Tình Yêu & Chúc Mừng',
            price: 580000,
            image: 'images/bouquet_4.png',
            tag: 'POPULAR',
            description: 'Sự kết hợp hoàn hảo giữa những đóa hướng dương rực rỡ vàng óng cùng cúc Tana hoang dại ngọt ngào. Được bao bọc bởi lớp giấy kraft thô mộc và thắt nơ đay tinh tế, sản phẩm đem đến cảm giác ấm áp như tia nắng ban mai.'
        }
    ];

    // --- 2. GLOBAL STATE ---
    let cart = JSON.parse(localStorage.getItem('fiore_cart')) || [];
    let currentSelectedProduct = null;
    let checkoutStep = 1;
    let selectedPaymentMethod = 'card'; // 'card' or 'qr'
    let qrSimulateInterval = null;

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
    const backToStep1Btns = document.querySelectorAll('.back-to-step1-btn');
    
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


    // --- 4. RENDER HOMEPAGE PRODUCTS ---
    function renderProducts(filterCategory = 'all') {
        productsGrid.innerHTML = '';
        const filtered = filterCategory === 'all' 
            ? PRODUCTS 
            : PRODUCTS.filter(p => p.category === filterCategory);

        filtered.forEach((p, idx) => {
            const card = document.createElement('article');
            card.className = 'product-card';
            card.style.animationDelay = `${idx * 0.1}s`;
            card.id = `product-${p.id}`;

            card.innerHTML = `
                <div class="product-image-area">
                    <span class="product-tag">${p.tag}</span>
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
            productsGrid.appendChild(card);
        });

        // Add Quick View & Quick Add Listeners
        document.querySelectorAll('.quick-view-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = e.target.getAttribute('data-id');
                openProductModalFunc(id);
            });
        });

        document.querySelectorAll('.quick-add-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const btnEl = e.currentTarget;
                const id = btnEl.getAttribute('data-id');
                quickAddToCart(id, btnEl);
            });
        });
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

    // Sticky Header Scroll effect
    window.addEventListener('scroll', () => {
        if (window.scrollY > 40) {
            mainHeader.classList.add('scrolled');
        } else {
            mainHeader.classList.remove('scrolled');
        }
    });

    // Filter Buttons logic
    categoryFilters.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            categoryFilters.querySelector('.filter-btn.active').classList.remove('active');
            e.target.classList.add('active');
            
            const cat = e.target.getAttribute('data-category');
            renderProducts(cat);
        });
    });

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

        // Reset Card Inputs
        cardNumberInput.value = '';
        cardHolderInput.value = '';
        cardExpiryInput.value = '';
        cardCvvInput.value = '';
        cardNumDisplay.textContent = '•••• •••• •••• ••••';
        cardHolderDisplay.textContent = 'NGUYEN VAN A';
        cardExpiryDisplay.textContent = 'MM/YY';
        cardCvvDisplay.textContent = '•••';
        creditCardPreview.classList.remove('flipped');
        
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
        const total = subtotal + shippingFee;

        checkoutSummarySubtotal.textContent = formatCurrency(subtotal);
        checkoutSummaryShipping.textContent = shippingFee === 0 ? 'Miễn phí' : formatCurrency(shippingFee);
        checkoutSummaryTotal.textContent = formatCurrency(total);
        
        // Step 2 QR payments updates
        qrPaymentAmount.textContent = formatCurrency(total);
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
        qrTransferMessage.textContent = `FIORE${randId}`;
        
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

    // Format & Sync card inputs to preview
    cardNumberInput.addEventListener('input', (e) => {
        const formatted = formatCardNumber(e.target.value);
        e.target.value = formatted;
        cardNumDisplay.textContent = formatted || '•••• •••• •••• ••••';
    });

    cardHolderInput.addEventListener('input', (e) => {
        const formatted = e.target.value.replace(/[^a-zA-Z\s]/g, '').toUpperCase();
        e.target.value = formatted;
        cardHolderDisplay.textContent = formatted || 'NGUYEN VAN A';
    });

    cardExpiryInput.addEventListener('input', (e) => {
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
    qrAccountNumber.addEventListener('click', () => {
        copyTextToClipboard(qrAccountNumber.textContent.replace(/\s/g, ''), qrAccountNumber);
    });

    // Copy Action on message description
    qrTransferMessage.addEventListener('click', () => {
        copyTextToClipboard(qrTransferMessage.textContent, qrTransferMessage);
    });

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

    btnSimulateQrPay.addEventListener('click', () => {
        clearInterval(qrSimulateInterval);
        completeCheckout();
    });


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
        
        // Clear cart BEFORE sending email so email shows correct items
        const cartSnapshot = [...cart];
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
    }

    btnCloseSuccessAndReset.addEventListener('click', () => {
        resetOrderComplete();
    });


    // --- 14. INITIALIZE APP ---
    renderProducts('all');
    updateCartUI();

});
