/* ==========================================================================
   FIÓRE — SHOP PAGE CONTROLLER
   ========================================================================== */
document.addEventListener('DOMContentLoaded', () => {
    const grid = document.getElementById('shopProductsGrid');
    if (!grid || !window.FioreApp) return;

    const { PRODUCTS, renderProductsToGrid, formatCurrency } = window.FioreApp;
    const PAGE_SIZE = 9;
    const MAX_PRICE = 3000000;

    let visibleCount = PAGE_SIZE;
    let searchQuery = '';
    let maxPrice = MAX_PRICE;
    let sortBy = 'default';
    const activeCategories = new Set(['romance', 'birthday', 'grand', 'sympathy']);

    const resultsCountEl = document.getElementById('shopResultsCount');
    const sortSelect = document.getElementById('shopSortSelect');
    const searchInput = document.getElementById('shopSearchInput');
    const priceSlider = document.getElementById('shopPriceSlider');
    const priceMaxLabel = document.getElementById('shopPriceMaxLabel');
    const loadMoreBtn = document.getElementById('shopLoadMoreBtn');
    const clearFiltersBtn = document.getElementById('shopClearFiltersBtn');
    const categoryCheckboxes = document.querySelectorAll('.shop-cat-checkbox');

    function updateCategoryCounts() {
        document.querySelectorAll('[data-cat-count]').forEach(el => {
            const cat = el.getAttribute('data-cat-count');
            const count = PRODUCTS.filter(p => p.category === cat).length;
            el.textContent = count;
        });
    }

    function getFilteredProducts() {
        let list = PRODUCTS.filter(p => {
            if (!activeCategories.has(p.category)) return false;
            if (p.price > maxPrice) return false;
            if (searchQuery) {
                const q = searchQuery.toLowerCase();
                const haystack = `${p.title} ${p.categoryLabel} ${p.description}`.toLowerCase();
                if (!haystack.includes(q)) return false;
            }
            return true;
        });

        switch (sortBy) {
            case 'price-asc':
                list = [...list].sort((a, b) => a.price - b.price);
                break;
            case 'price-desc':
                list = [...list].sort((a, b) => b.price - a.price);
                break;
            case 'name':
                list = [...list].sort((a, b) => a.title.localeCompare(b.title, 'vi'));
                break;
            default:
                break;
        }
        return list;
    }

    function renderShop() {
        const filtered = getFilteredProducts();
        const toShow = filtered.slice(0, visibleCount);

        if (filtered.length === 0) {
            grid.innerHTML = `
                <div class="shop-empty-state">
                    <svg xmlns="http://www.w3.org/2000/svg" width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                    <h3>Không tìm thấy sản phẩm</h3>
                    <p>Thử đổi bộ lọc hoặc từ khóa tìm kiếm khác.</p>
                </div>
            `;
        } else {
            renderProductsToGrid(grid, toShow);
        }

        if (resultsCountEl) {
            resultsCountEl.innerHTML = `Hiển thị <strong>${Math.min(visibleCount, filtered.length)}</strong> / <strong>${filtered.length}</strong> sản phẩm`;
        }

        if (loadMoreBtn) {
            const hasMore = visibleCount < filtered.length;
            loadMoreBtn.style.display = hasMore ? 'inline-flex' : 'none';
            loadMoreBtn.disabled = !hasMore;
        }
    }

    function resetVisibleAndRender() {
        visibleCount = PAGE_SIZE;
        renderShop();
    }

    if (searchInput) {
        searchInput.addEventListener('input', () => {
            searchQuery = searchInput.value.trim();
            resetVisibleAndRender();
        });
    }

    if (priceSlider && priceMaxLabel) {
        const updateSliderFill = () => {
            const pct = (maxPrice / MAX_PRICE) * 100;
            priceSlider.style.setProperty('--val', `${pct}%`);
        };
        priceSlider.addEventListener('input', () => {
            maxPrice = parseInt(priceSlider.value, 10);
            priceMaxLabel.textContent = formatCurrency(maxPrice);
            updateSliderFill();
            resetVisibleAndRender();
        });
        priceSlider.max = MAX_PRICE;
        priceSlider.value = MAX_PRICE;
        priceMaxLabel.textContent = formatCurrency(MAX_PRICE);
        updateSliderFill();
    }

    categoryCheckboxes.forEach(cb => {
        cb.addEventListener('change', () => {
            const cat = cb.value;
            if (cb.checked) activeCategories.add(cat);
            else activeCategories.delete(cat);
            resetVisibleAndRender();
        });
    });

    if (sortSelect) {
        sortSelect.addEventListener('change', () => {
            sortBy = sortSelect.value;
            resetVisibleAndRender();
        });
    }

    if (loadMoreBtn) {
        loadMoreBtn.addEventListener('click', () => {
            visibleCount += PAGE_SIZE;
            renderShop();
        });
    }

    if (clearFiltersBtn) {
        clearFiltersBtn.addEventListener('click', () => {
            searchQuery = '';
            maxPrice = MAX_PRICE;
            sortBy = 'default';
            activeCategories.clear();
            ['romance', 'birthday', 'grand', 'sympathy'].forEach(c => activeCategories.add(c));

            if (searchInput) searchInput.value = '';
            if (sortSelect) sortSelect.value = 'default';
            if (priceSlider) {
                priceSlider.value = MAX_PRICE;
                priceSlider.dispatchEvent(new Event('input'));
            }
            categoryCheckboxes.forEach(cb => { cb.checked = true; });
            resetVisibleAndRender();
        });
    }

    updateCategoryCounts();
    renderShop();
});
