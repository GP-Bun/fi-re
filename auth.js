/* ==========================================================================
   FIÓRE — USER AUTH (Đăng ký / Đăng nhập)
   Lưu tài khoản trên localStorage (demo). Không dùng cho production thật.
   ========================================================================== */

(() => {
    const USERS_STORAGE_KEY = 'fiore_users';
    const USER_SESSION_KEY = 'fiore_user_session';

    const el = {
        overlay: document.getElementById('userAuthOverlay'),
        closeBtn: document.getElementById('closeUserAuth'),
        tabLogin: document.getElementById('authTabLogin'),
        tabRegister: document.getElementById('authTabRegister'),
        panelLogin: document.getElementById('authPanelLogin'),
        panelRegister: document.getElementById('authPanelRegister'),
        loginForm: document.getElementById('userLoginForm'),
        registerForm: document.getElementById('userRegisterForm'),
        loginError: document.getElementById('userLoginError'),
        registerError: document.getElementById('userRegisterError'),
        registerSuccess: document.getElementById('userRegisterSuccess'),
        trigger: document.getElementById('userAuthTrigger'),
        dropdown: document.getElementById('userAuthDropdown'),
        greeting: document.getElementById('userGreeting'),
        btnLoginMenu: document.getElementById('userMenuLogin'),
        btnRegisterMenu: document.getElementById('userMenuRegister'),
        btnLogout: document.getElementById('userMenuLogout'),
        mobileLogin: document.getElementById('mobileUserLogin'),
        mobileRegister: document.getElementById('mobileUserRegister'),
        mobileLogout: document.getElementById('mobileUserLogout'),
        mobileAccount: document.getElementById('mobileUserAccount')
    };

    function readUsers() {
        try {
            const raw = localStorage.getItem(USERS_STORAGE_KEY);
            const parsed = raw ? JSON.parse(raw) : [];
            return Array.isArray(parsed) ? parsed : [];
        } catch {
            return [];
        }
    }

    function writeUsers(users) {
        localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
    }

    function getSession() {
        try {
            const raw = sessionStorage.getItem(USER_SESSION_KEY);
            return raw ? JSON.parse(raw) : null;
        } catch {
            return null;
        }
    }

    function setSession(user) {
        sessionStorage.setItem(USER_SESSION_KEY, JSON.stringify({
            id: user.id,
            fullName: user.fullName,
            email: user.email,
            phone: user.phone || ''
        }));
    }

    function clearSession() {
        sessionStorage.removeItem(USER_SESSION_KEY);
    }

    function isLoggedIn() {
        return !!getSession();
    }

    function getCurrentUser() {
        return getSession();
    }

    function normalizeEmail(email) {
        return (email || '').trim().toLowerCase();
    }

    function showMsg(box, message, isSuccess = false) {
        if (!box) return;
        if (!message) {
            box.style.display = 'none';
            box.textContent = '';
            box.classList.remove('auth-msg-success');
            return;
        }
        box.textContent = message;
        box.style.display = 'block';
        box.classList.toggle('auth-msg-success', isSuccess);
    }

    function switchTab(tab) {
        const isLogin = tab === 'login';
        el.tabLogin?.classList.toggle('active', isLogin);
        el.tabRegister?.classList.toggle('active', !isLogin);
        el.panelLogin?.classList.toggle('active', isLogin);
        el.panelRegister?.classList.toggle('active', !isLogin);
        showMsg(el.loginError, '');
        showMsg(el.registerError, '');
        showMsg(el.registerSuccess, '');
    }

    function openAuthModal(tab = 'login') {
        if (!el.overlay) return;
        switchTab(tab);
        el.overlay.classList.add('open');
        closeDropdown();
        setTimeout(() => {
            const focusEl = tab === 'register'
                ? document.getElementById('regFullName')
                : document.getElementById('loginEmail');
            focusEl?.focus();
        }, 0);
    }

    function closeAuthModal() {
        el.overlay?.classList.remove('open');
    }

    function closeDropdown() {
        el.dropdown?.classList.remove('open');
    }

    function toggleDropdown() {
        if (!el.dropdown) return;
        if (isLoggedIn()) {
            el.dropdown.classList.toggle('open');
        } else {
            openAuthModal('login');
        }
    }

    function updateUI() {
        const user = getCurrentUser();
        const loggedIn = !!user;

        if (el.trigger) {
            el.trigger.classList.toggle('is-logged-in', loggedIn);
            el.trigger.setAttribute('aria-label', loggedIn ? `Tài khoản: ${user.fullName}` : 'Đăng nhập / Đăng ký');
        }

        if (el.greeting) {
            el.greeting.textContent = loggedIn ? `Xin chào, ${user.fullName}` : '';
        }

        el.btnLoginMenu && (el.btnLoginMenu.style.display = loggedIn ? 'none' : '');
        el.btnRegisterMenu && (el.btnRegisterMenu.style.display = loggedIn ? 'none' : '');
        el.btnLogout && (el.btnLogout.style.display = loggedIn ? '' : 'none');
        el.greeting && (el.greeting.style.display = loggedIn ? '' : 'none');

        if (el.mobileLogin) el.mobileLogin.style.display = loggedIn ? 'none' : '';
        if (el.mobileRegister) el.mobileRegister.style.display = loggedIn ? 'none' : '';
        if (el.mobileLogout) el.mobileLogout.style.display = loggedIn ? '' : 'none';
        if (el.mobileAccount) {
            el.mobileAccount.style.display = loggedIn ? '' : 'none';
            el.mobileAccount.textContent = loggedIn ? `Tài khoản: ${user.fullName}` : '';
        }
    }

    function register({ fullName, email, phone, password, confirmPassword }) {
        const name = (fullName || '').trim();
        const mail = normalizeEmail(email);
        const pass = (password || '').trim();
        const pass2 = (confirmPassword || '').trim();

        if (name.length < 2) return { ok: false, message: 'Họ tên phải có ít nhất 2 ký tự.' };
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(mail)) return { ok: false, message: 'Email không hợp lệ.' };
        if (pass.length < 6) return { ok: false, message: 'Mật khẩu tối thiểu 6 ký tự.' };
        if (pass !== pass2) return { ok: false, message: 'Mật khẩu xác nhận không khớp.' };

        const users = readUsers();
        if (users.some(u => normalizeEmail(u.email) === mail)) {
            return { ok: false, message: 'Email này đã được đăng ký. Hãy đăng nhập.' };
        }

        const newUser = {
            id: `user_${Date.now()}`,
            fullName: name,
            email: mail,
            phone: (phone || '').trim(),
            password: pass,
            createdAt: new Date().toISOString()
        };

        users.push(newUser);
        writeUsers(users);
        setSession(newUser);
        return { ok: true, user: newUser };
    }

    function login({ email, password }) {
        const mail = normalizeEmail(email);
        const pass = (password || '').trim();
        const users = readUsers();
        const user = users.find(u => normalizeEmail(u.email) === mail && u.password === pass);

        if (!user) {
            return { ok: false, message: 'Email hoặc mật khẩu không đúng.' };
        }

        setSession(user);
        return { ok: true, user };
    }

    function logout() {
        clearSession();
        closeDropdown();
        updateUI();
    }

    function prefillCheckoutForm() {
        const user = getCurrentUser();
        if (!user) return;

        const nameEl = document.getElementById('senderName');
        const phoneEl = document.getElementById('senderPhone');
        const emailEl = document.getElementById('senderEmail');

        if (nameEl && !nameEl.value) nameEl.value = user.fullName;
        if (phoneEl && user.phone && !phoneEl.value) phoneEl.value = user.phone;
        if (emailEl && !emailEl.value) emailEl.value = user.email;
    }

    function findUserRecord(userId) {
        return readUsers().find(u => u.id === userId) || null;
    }

    function getBoundCard(userId) {
        const u = findUserRecord(userId);
        if (!u?.boundCardDigits) return null;
        const digits = String(u.boundCardDigits).replace(/\D/g, '');
        if (digits.length !== 16) return null;
        return {
            digits,
            holder: u.boundCardHolder || '',
            expiry: u.boundCardExpiry || ''
        };
    }

    function bindCardToUser(userId, { digits, holder, expiry }) {
        const cleanDigits = (digits || '').replace(/\D/g, '').slice(0, 16);
        if (cleanDigits.length !== 16) return { ok: false, message: 'Số thẻ không hợp lệ.' };

        const users = readUsers();
        const idx = users.findIndex(u => u.id === userId);
        if (idx === -1) return { ok: false, message: 'Không tìm thấy tài khoản.' };

        const existing = users[idx].boundCardDigits
            ? String(users[idx].boundCardDigits).replace(/\D/g, '')
            : '';

        if (existing && existing !== cleanDigits) {
            return {
                ok: false,
                message: `Tài khoản đã gắn thẻ kết thúc ${existing.slice(-4)}. Không thể dùng thẻ khác.`
            };
        }

        users[idx].boundCardDigits = cleanDigits;
        users[idx].boundCardHolder = (holder || '').trim().toUpperCase();
        users[idx].boundCardExpiry = (expiry || '').trim();
        writeUsers(users);
        return { ok: true };
    }

    // --- Events ---
    el.tabLogin?.addEventListener('click', () => switchTab('login'));
    el.tabRegister?.addEventListener('click', () => switchTab('register'));

    el.closeBtn?.addEventListener('click', closeAuthModal);
    el.overlay?.addEventListener('click', (e) => {
        if (e.target === el.overlay) closeAuthModal();
    });

    el.trigger?.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleDropdown();
    });

    document.addEventListener('click', () => closeDropdown());

    el.dropdown?.addEventListener('click', (e) => e.stopPropagation());

    el.btnLoginMenu?.addEventListener('click', () => openAuthModal('login'));
    el.btnRegisterMenu?.addEventListener('click', () => openAuthModal('register'));
    el.btnLogout?.addEventListener('click', logout);

    el.mobileLogin?.addEventListener('click', (e) => {
        e.preventDefault();
        document.getElementById('mobileNavOverlay')?.classList.remove('open');
        openAuthModal('login');
    });

    el.mobileRegister?.addEventListener('click', (e) => {
        e.preventDefault();
        document.getElementById('mobileNavOverlay')?.classList.remove('open');
        openAuthModal('register');
    });

    el.mobileLogout?.addEventListener('click', (e) => {
        e.preventDefault();
        document.getElementById('mobileNavOverlay')?.classList.remove('open');
        logout();
    });

    el.loginForm?.addEventListener('submit', (e) => {
        e.preventDefault();
        const result = login({
            email: document.getElementById('loginEmail')?.value,
            password: document.getElementById('loginPassword')?.value
        });

        if (!result.ok) {
            showMsg(el.loginError, result.message);
            return;
        }

        showMsg(el.loginError, '');
        el.loginForm.reset();
        closeAuthModal();
        updateUI();
    });

    el.registerForm?.addEventListener('submit', (e) => {
        e.preventDefault();
        const result = register({
            fullName: document.getElementById('regFullName')?.value,
            email: document.getElementById('regEmail')?.value,
            phone: document.getElementById('regPhone')?.value,
            password: document.getElementById('regPassword')?.value,
            confirmPassword: document.getElementById('regPasswordConfirm')?.value
        });

        if (!result.ok) {
            showMsg(el.registerError, result.message);
            showMsg(el.registerSuccess, '');
            return;
        }

        showMsg(el.registerError, '');
        showMsg(el.registerSuccess, 'Đăng ký thành công! Bạn đã được đăng nhập.', true);
        el.registerForm.reset();

        setTimeout(() => {
            closeAuthModal();
            updateUI();
        }, 900);
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeAuthModal();
            closeDropdown();
        }
    });

    window.FioreAuth = {
        isLoggedIn,
        getCurrentUser,
        login,
        register,
        logout,
        openAuthModal,
        prefillCheckoutForm,
        getBoundCard,
        bindCardToUser,
        updateUI
    };

    updateUI();
})();
