// auth-system.js

window.SUPABASE_URL = window.SUPABASE_URL || 'https://cwgkdpmxwgfypbiykafl.supabase.co'; 
window.SUPABASE_KEY = window.SUPABASE_KEY || 'sb_publishable_mjHX0OTE6LSLh2qTVqMIng_mY9cvDcN';

// Внутренний технический домен для аккаунтов
const INTERNAL_DOMAIN = '@geo.geo';

// Инициализация Supabase
if (!window.supabaseClient && window.supabase) {
    try {
        window.supabaseClient = window.supabase.createClient(window.SUPABASE_URL, window.SUPABASE_KEY);
    } catch (e) {
        console.error('Ошибка инициализации Supabase:', e);
    }
}

let currentAuthMode = null; 
let overlayClickTimeout = null;

// Таймеры и состояния для поэтапной регистрации
let regStepTimeout = null;
let regNameTypedValid = false;
let regUsernameTypedValid = false;

// --- ГЛОБАЛЬНЫЕ ФУНКЦИИ ---
window.showAuthModal = function() {
    injectAuthStyles();
    initAuthModalUI();
    initAuthEvents();
    
    const modal = document.getElementById('auth-modal-overlay');
    hideConfirmToast(true);
    resetAuthToInitialState();

    if (modal) {
        modal.classList.add('active');
    }
};

window.hideAuthModal = function() {
    const modal = document.getElementById('auth-modal-overlay');
    if (modal) {
        modal.classList.remove('active');
        hideConfirmToast(true);
    }
};

window.logoutUser = async function(event) {
    let logoutBtn = event?.currentTarget || event?.target;
    
    if (!logoutBtn || !(logoutBtn instanceof HTMLElement)) {
        logoutBtn = document.getElementById('user-logout-btn') || 
                    document.querySelector('.user-logout-btn, .logout-btn, [onclick*="logoutUser"]');
    }

    if (logoutBtn) {
        logoutBtn.style.pointerEvents = 'none';

        const textContainer = logoutBtn.querySelector('.profile-action-text, span') || logoutBtn;
        textContainer.innerHTML = 'Выход из аккаунта <span class="auth-spinner"></span>';

        const parentContainer = logoutBtn.closest('.profile-widget, .profile-dropdown, .side-panel, .user-menu') || logoutBtn.parentElement;

        if (parentContainer) {
            const allNavElements = Array.from(parentContainer.querySelectorAll('button, a, .btn, .profile-action-btn'));
            const logoutIndex = allNavElements.indexOf(logoutBtn);

            allNavElements.forEach((el, index) => {
                if (index < logoutIndex || (logoutIndex === -1 && el !== logoutBtn)) {
                    el.classList.add('btn-frozen');
                }
            });
        }
    }

    try {
        if (window.supabaseClient) {
            await window.supabaseClient.auth.signOut();
        }
    } catch (error) {
        console.error('Ошибка при выходе из аккаунта:', error);
    } finally {
        document.body.classList.add('page-hidden');
        setTimeout(() => {
            window.location.href = 'login.html';
        }, 500);
    }
};

function showConfirmToast() {
    const toast = document.getElementById('auth-confirm-toast');
    const wave = document.getElementById('auth-confirm-wave');
    
    if (toast) {
        toast.classList.remove('hiding', 'visible');
        if (wave) wave.classList.remove('active');

        void toast.offsetWidth;

        toast.classList.add('visible');
        if (wave) wave.classList.add('active');
    }
}

function hideConfirmToast(immediate = false) {
    const toast = document.getElementById('auth-confirm-toast');
    const wave = document.getElementById('auth-confirm-wave');

    if (!toast) return;

    if (wave) wave.classList.remove('active');

    if (immediate) {
        toast.classList.remove('visible', 'hiding');
    } else {
        toast.classList.add('hiding');
        setTimeout(() => {
            toast.classList.remove('visible', 'hiding');
        }, 350);
    }
}

function resetAuthToInitialState() {
    currentAuthMode = null;
    if (regStepTimeout) clearTimeout(regStepTimeout);
    regNameTypedValid = false;
    regUsernameTypedValid = false;

    const btnLogin = document.getElementById('tab-login-btn');
    const btnRegister = document.getElementById('tab-register-btn');
    
    const formLogin = document.getElementById('auth-form-login');
    const formRegister = document.getElementById('auth-form-register');

    if (!btnLogin || !btnRegister || !formLogin || !formRegister) return;

    btnLogin.classList.remove('dimmed', 'active-mode');
    btnLogin.style.pointerEvents = 'auto';
    
    btnRegister.classList.remove('dimmed', 'active-mode');
    btnRegister.style.pointerEvents = 'auto';

    formLogin.classList.remove('visible');
    formRegister.classList.remove('visible');

    const rowUsername = document.getElementById('reg-username-row');
    const rowPassword = document.getElementById('reg-password-row');
    if (rowUsername) rowUsername.classList.remove('visible-row');
    if (rowPassword) rowPassword.classList.remove('visible-row');

    const regName = document.getElementById('reg-name');
    const regUser = document.getElementById('reg-username');
    const regPass = document.getElementById('reg-password');
    if (regName) regName.value = '';
    if (regUser) regUser.value = '';
    if (regPass) regPass.value = '';
}

function setAuthMode(mode) {
    currentAuthMode = mode;

    const btnLogin = document.getElementById('tab-login-btn');
    const btnRegister = document.getElementById('tab-register-btn');
    
    const formLogin = document.getElementById('auth-form-login');
    const formRegister = document.getElementById('auth-form-register');

    if (!btnLogin || !btnRegister || !formLogin || !formRegister) return;

    if (mode === 'login') {
        if (regStepTimeout) clearTimeout(regStepTimeout);
        btnLogin.classList.add('active-mode');
        btnLogin.classList.remove('dimmed');
        btnLogin.style.pointerEvents = 'auto';

        btnRegister.classList.add('dimmed');
        btnRegister.classList.remove('active-mode');
        btnRegister.style.pointerEvents = 'auto';

        formRegister.classList.remove('visible');
        formLogin.classList.add('visible');
    } else {
        btnRegister.classList.add('active-mode');
        btnRegister.classList.remove('dimmed');
        btnRegister.style.pointerEvents = 'auto';

        btnLogin.classList.add('dimmed');
        btnLogin.classList.remove('active-mode');
        btnLogin.style.pointerEvents = 'auto';

        formLogin.classList.remove('visible');
        formRegister.classList.add('visible');
    }
}

function setButtonLoading(button, isLoading, originalText) {
    if (!button) return;

    if (isLoading) {
        button.disabled = true;
        button.classList.add('loading');
        button.dataset.originalText = originalText;
        button.innerHTML = '<span class="auth-spinner"></span>';
    } else {
        button.disabled = false;
        button.classList.remove('loading');
        button.innerHTML = button.dataset.originalText || originalText;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    injectAuthStyles();
    initAuthModalUI();
    initAuthEvents();
    
    if (window.supabaseClient) {
        checkUserSession();
    }
});

function injectAuthStyles() {
    if (document.getElementById('auth-system-styles')) return;

    const css = `
        .btn-frozen, .btn-frozen:hover, .btn-frozen:active, .btn-frozen:focus {
            pointer-events: none !important; user-select: none !important; cursor: default !important;
            opacity: 0.65 !important; transform: none !important; transition: none !important;
            box-shadow: none !important; background: inherit !important; color: inherit !important;
        }
        .auth-modal-overlay {
            position: fixed !important; top: 0 !important; left: 0 !important; width: 100vw !important; height: 100vh !important;
            background: rgba(10, 10, 12, 0.94) !important; backdrop-filter: blur(12px) !important; -webkit-backdrop-filter: blur(12px) !important;
            z-index: 9999999 !important; display: flex !important; align-items: center !important; justify-content: center !important;
            padding: 20px !important; box-sizing: border-box !important; overflow: hidden !important;
            opacity: 0 !important; visibility: hidden !important; pointer-events: none !important;
            transition: opacity 0.3s ease, visibility 0.3s ease !important;
        }
        .auth-modal-overlay.active { opacity: 1 !important; visibility: visible !important; pointer-events: auto !important; }
        .auth-modal-container {
            background: transparent !important; border: none !important; box-shadow: none !important; padding: 0 !important;
            width: 100% !important; max-width: 300px !important; position: relative !important; color: #ffffff !important;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif !important; box-sizing: border-box !important;
            display: flex !important; flex-direction: column !important; align-items: center !important;
            transform: scale(0.96) !important; transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1) !important; z-index: 5 !important;
        }
        .auth-modal-overlay.active .auth-modal-container { transform: scale(1) !important; }
        .auth-modal-container.shake { animation: shakeAnimation 0.4s cubic-bezier(0.36, 0.07, 0.19, 0.97) !important; }
        @keyframes shakeAnimation {
            10%, 90% { transform: scale(1) translateX(-3px); }
            20%, 80% { transform: scale(1) translateX(4px); }
            30%, 50%, 70% { transform: scale(1) translateX(-6px); }
            40%, 60% { transform: scale(1) translateX(6px); }
        }
        .auth-close-btn {
            position: absolute !important; top: 30px !important; right: 30px !important; background: transparent !important;
            border: none !important; color: rgba(255, 255, 255, 0.4) !important; font-size: 28px !important; line-height: 1 !important;
            cursor: pointer !important; z-index: 99999999 !important; padding: 0 !important;
            transition: color 0.25s ease, transform 0.25s ease !important;
        }
        .auth-close-btn::before { content: '' !important; position: absolute !important; top: -12px !important; bottom: -12px !important; left: -12px !important; right: -12px !important; }
        .auth-close-btn:hover { color: #ffffff !important; transform: scale(1.15) rotate(90deg) !important; }
        .auth-header-title { display: flex !important; align-items: center !important; justify-content: center !important; gap: 20px !important; margin-top: -30px !important; margin-bottom: 30px !important; }
        .auth-logo-wrapper { display: flex !important; align-items: center !important; justify-content: center !important; animation: logoHover 3s ease-in-out infinite alternate !important; }
        .auth-header-logo { height: 105px !important; width: auto !important; display: block !important; object-fit: contain !important; }
        @keyframes logoHover { 0% { transform: translateY(0px) rotate(0deg); } 50% { transform: translateY(-8px) rotate(-2deg); } 100% { transform: translateY(6px) rotate(2deg); } }
        .auth-title-ticker { height: 55px !important; overflow: hidden !important; position: relative !important; }
        .auth-title-track { display: flex !important; flex-direction: column !important; animation: titleVerticalScroll 8s cubic-bezier(0.77, 0, 0.175, 1) infinite !important; }
        .auth-title-track span { height: 55px !important; line-height: 55px !important; font-family: 'Unbounded', sans-serif !important; font-size: 32px !important; font-weight: 900 !important; color: #ffffff !important; text-transform: uppercase !important; white-space: nowrap !important; display: flex !important; align-items: center !important; }
        @keyframes titleVerticalScroll { 0%, 20% { transform: translateY(0); } 25%, 45% { transform: translateY(-55px); } 50%, 70% { transform: translateY(-55px); } 75%, 100% { transform: translateY(0); } }
        
        .auth-actions-group { display: flex !important; gap: 12px !important; width: 100% !important; margin-bottom: 30px !important; box-sizing: border-box !important; }
        
        .auth-action-btn { flex: 1 !important; background: transparent !important; border: 1px solid rgba(255, 255, 255, 0.3) !important; border-radius: 24px !important; padding: 11px 15px !important; color: #ffffff !important; font-size: 13px !important; font-weight: 500 !important; cursor: pointer !important; text-align: center !important; transition: all 0.35s cubic-bezier(0.4, 0, 0.2, 1) !important; box-sizing: border-box !important; }
        .auth-action-btn:hover { background: #ffffff !important; color: #000000 !important; border-color: #ffffff !important; }

        .auth-action-btn.dimmed { opacity: 0.35 !important; border-color: rgba(255, 255, 255, 0.1) !important; color: rgba(255, 255, 255, 0.4) !important; }
        .auth-action-btn.dimmed:hover { background: transparent !important; color: rgba(255, 255, 255, 0.7) !important; border-color: rgba(255, 255, 255, 0.2) !important; }

        .auth-forms-wrapper { position: relative !important; width: 100% !important; min-height: 220px !important; }
        .auth-form { position: absolute !important; top: 0 !important; left: 0 !important; width: 100% !important; display: flex !important; flex-direction: column !important; gap: 25px !important; opacity: 0 !important; filter: blur(8px) !important; pointer-events: none !important; transition: opacity 0.35s cubic-bezier(0.4, 0, 0.2, 1), filter 0.35s cubic-bezier(0.4, 0, 0.2, 1) !important; }
        .auth-form.visible { opacity: 1 !important; filter: blur(0px) !important; pointer-events: auto !important; }
        
        .auth-input-group { position: relative !important; width: 100% !important; }
        .auth-input { background: transparent !important; border: none !important; border-bottom: 1px solid rgba(255, 255, 255, 0.4) !important; padding: 4px 0 8px 0 !important; color: #ffffff !important; font-size: 13px !important; text-align: center !important; outline: none !important; width: 100% !important; box-sizing: border-box !important; transition: border-color 0.25s !important; }
        .auth-input::placeholder { color: rgba(255, 255, 255, 0.35) !important; text-align: center !important; }
        .auth-input:focus { border-bottom-color: #ffffff !important; }

        .reg-step-row {
            opacity: 0 !important;
            max-height: 0 !important;
            overflow: hidden !important;
            margin-top: 0 !important;
            transition: opacity 0.4s ease, max-height 0.4s ease, margin 0.4s ease !important;
            pointer-events: none !important;
        }
        .reg-step-row.visible-row {
            opacity: 1 !important;
            max-height: 100px !important;
            margin-top: 25px !important;
            pointer-events: auto !important;
        }

        /* Центрированное поле логина с небольшим отступом и эффектом единого текста */
        .reg-login-container {
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
            gap: 4px !important;
            border-bottom: 1px solid rgba(255, 255, 255, 0.4) !important;
            padding: 4px 0 8px 0 !important;
            width: 100% !important;
            box-sizing: border-box !important;
            transition: border-color 0.25s !important;
        }
        .reg-login-container:focus-within {
            border-bottom-color: #ffffff !important;
        }
        .reg-login-input {
            background: transparent !important;
            border: none !important;
            outline: none !important;
            color: #ffffff !important;
            font-size: 13px !important;
            text-align: right !important;
            padding: 0 !important;
            margin: 0 !important;
            width: auto !important;
            max-width: 60% !important;
        }
        .reg-login-input::placeholder {
            color: rgba(255, 255, 255, 0.35) !important;
            text-align: right !important;
        }
        .reg-login-suffix {
            color: #ffffff !important;
            font-size: 13px !important;
            font-weight: 500 !important;
            white-space: nowrap !important;
            user-select: none !important;
            text-align: left !important;
            padding: 0 !important;
            margin: 0 !important;
        }
        
        .auth-submit-btn { position: relative !important; display: flex !important; align-items: center !important; justify-content: center !important; background: transparent !important; color: #ffffff !important; border: 1px solid #ffffff !important; border-radius: 24px !important; padding: 10px 20px !important; font-size: 14px !important; font-weight: 500 !important; cursor: pointer !important; width: 100% !important; margin-top: 15px !important; transition: all 0.25s ease !important; min-height: 42px !important; box-sizing: border-box !important; }
        .auth-submit-btn:hover:not(:disabled) { background: #ffffff !important; color: #000000 !important; }
        .auth-submit-btn.loading, .auth-submit-btn:disabled { background: rgba(255, 255, 255, 0.08) !important; border-color: rgba(255, 255, 255, 0.25) !important; color: rgba(255, 255, 255, 0.4) !important; cursor: not-allowed !important; }
        
        .auth-spinner { display: inline-block !important; width: 18px !important; height: 18px !important; border: 2px solid rgba(255, 255, 255, 0.25) !important; border-radius: 50% !important; border-top-color: #ffffff !important; animation: authSpinnerRotate 0.75s linear infinite !important; }
        @keyframes authSpinnerRotate { to { transform: rotate(360deg); } }
        
        .auth-confirm-wave { position: fixed !important; bottom: 20px !important; left: 50% !important; width: 10px !important; height: 10px !important; border-radius: 50% !important; background: radial-gradient(circle, rgba(255, 255, 255, 0.6) 0%, rgba(255, 255, 255, 0.25) 30%, rgba(255, 255, 255, 0) 70%) !important; transform: translate(-50%, 50%) scale(0) !important; pointer-events: none !important; z-index: 8 !important; opacity: 0 !important; }
        .auth-confirm-wave.active { animation: fullScreenWave 0.85s cubic-bezier(0.1, 0.8, 0.3, 1) forwards !important; }
        @keyframes fullScreenWave { 0% { transform: translate(-50%, 50%) scale(1); opacity: 1; } 50% { opacity: 0.7; } 100% { transform: translate(-50%, 50%) scale(280); opacity: 0; } }
        
        .auth-confirm-toast { position: fixed !important; bottom: 30px !important; left: 50% !important; transform: translateX(-50%) translateY(100px) scale(0.85); background: rgba(22, 22, 28, 0.96) !important; border: 1px solid rgba(255, 255, 255, 0.25) !important; border-radius: 16px !important; padding: 12px 20px !important; display: flex !important; align-items: center !important; gap: 15px !important; box-shadow: 0 12px 40px rgba(0, 0, 0, 0.7) !important; opacity: 0 !important; visibility: hidden !important; pointer-events: none !important; white-space: nowrap !important; z-index: 10 !important; transition: opacity 0.35s ease, transform 0.35s ease, visibility 0.35s ease !important; }
        .auth-confirm-toast.visible { opacity: 1 !important; visibility: visible !important; pointer-events: auto !important; animation: bounceInUp 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards !important; }
        .auth-confirm-toast.hiding { opacity: 0 !important; transform: translateX(-50%) translateY(40px) scale(0.9) !important; pointer-events: none !important; animation: none !important; }
        @keyframes bounceInUp { 0% { opacity: 0; transform: translateX(-50%) translateY(100px) scale(0.7); } 65% { opacity: 1; transform: translateX(-50%) translateY(-12px) scale(1.03); } 85% { transform: translateX(-50%) translateY(4px) scale(0.98); } 100% { opacity: 1; transform: translateX(-50%) translateY(0) scale(1); } }
        
        .auth-confirm-text { color: rgba(255, 255, 255, 0.95) !important; font-size: 13px !important; font-weight: 500 !important; }
        .auth-confirm-actions { display: flex !important; gap: 8px !important; }
        .auth-confirm-btn { background: transparent !important; border: 1px solid rgba(255, 255, 255, 0.2) !important; color: #ffffff !important; padding: 5px 12px !important; border-radius: 12px !important; font-size: 12px !important; cursor: pointer !important; transition: all 0.2s ease !important; }
        .auth-confirm-btn:hover { background: rgba(255, 255, 255, 0.12) !important; }
        .auth-confirm-btn.danger { background: #ffffff !important; color: #000000 !important; border-color: #ffffff !important; font-weight: 600 !important; }
        
        .auth-bg-watermark { position: absolute !important; top: 45% !important; right: -15% !important; width: 1200px !important; height: auto !important; pointer-events: none !important; z-index: 1 !important; opacity: 0 !important; filter: blur(45px) brightness(0.6) !important; transition: opacity 1.2s ease-out, filter 1.2s ease-out !important; animation: intenseFloat 6s ease-in-out infinite alternate !important; }
        .auth-modal-overlay.active .auth-bg-watermark { opacity: 0.22 !important; filter: blur(12px) brightness(0.9) !important; }
        @keyframes intenseFloat { 0% { transform: translateY(-50%) translateX(0px) rotate(0deg) scale(1); } 50% { transform: translateY(-58%) translateX(-25px) rotate(-5deg) scale(1.04); } 100% { transform: translateY(-42%) translateX(15px) rotate(4deg) scale(0.96); } }
    `;

    const styleElement = document.createElement('style');
    styleElement.id = 'auth-system-styles';
    styleElement.textContent = css;
    document.head.appendChild(styleElement);
}

// --- HTML РАЗМЕТКА ---
function initAuthModalUI() {
    if (document.getElementById('auth-modal-overlay')) return;

    const modalHTML = `
        <div id="auth-modal-overlay" class="auth-modal-overlay">
            <button id="auth-close-btn" class="auth-close-btn" type="button">&times;</button>

            <img src="images/geo_logo.png" alt="" class="auth-bg-watermark">

            <div class="auth-modal-container">
                <div class="auth-header-title">
                    <div class="auth-logo-wrapper">
                        <img src="images/geo_logo.png" alt="Geo Logo" class="auth-header-logo">
                    </div>

                    <div class="auth-title-ticker">
                        <div class="auth-title-track">
                            <span>GEOГРАФИЯ</span>
                            <span>АВТОРИЗАЦИЯ</span>
                        </div>
                    </div>
                </div>
                
                <div class="auth-actions-group" id="auth-actions-group">
                    <button type="button" class="auth-action-btn" id="tab-login-btn">Вход</button>
                    <button type="button" class="auth-action-btn" id="tab-register-btn">Регистрация</button>
                </div>

                <div class="auth-forms-wrapper">
                    <form id="auth-form-login" class="auth-form">
                        <div class="auth-input-group">
                            <input type="text" id="login-username" placeholder="Придуманный логин..." required class="auth-input" autocomplete="username">
                        </div>
                        <div class="auth-input-group">
                            <input type="password" id="login-password" placeholder="Пароль..." required class="auth-input" autocomplete="current-password">
                        </div>
                        <button type="submit" id="btn-submit-login" class="auth-submit-btn">Войти</button>
                    </form>

                    <form id="auth-form-register" class="auth-form">
                        <!-- Шаг 1: Ваш никнейм -->
                        <div class="auth-input-group">
                            <input type="text" id="reg-name" placeholder="Ваш никнейм..." required class="auth-input" autocomplete="name">
                        </div>
                        
                        <!-- Шаг 2: Центрированный логин с суффиксом @geo.geo -->
                        <div class="auth-input-group reg-step-row" id="reg-username-row">
                            <div class="reg-login-container">
                                <input type="text" id="reg-username" placeholder="придумайте логин" class="reg-login-input" autocomplete="username">
                                <span class="reg-login-suffix">@geo.geo</span>
                            </div>
                        </div>

                        <!-- Шаг 3: Пароль -->
                        <div class="auth-input-group reg-step-row" id="reg-password-row">
                            <input type="password" id="reg-password" placeholder="Пароль..." required class="auth-input" autocomplete="new-password">
                        </div>

                        <button type="submit" id="btn-submit-register" class="auth-submit-btn">Зарегистрироваться</button>
                    </form>
                </div>
            </div>

            <div id="auth-confirm-wave" class="auth-confirm-wave"></div>

            <div id="auth-confirm-toast" class="auth-confirm-toast">
                <span class="auth-confirm-text">Вы точно хотите покинуть авторизацию?</span>
                <div class="auth-confirm-actions">
                    <button type="button" class="auth-confirm-btn" id="auth-cancel-close-btn">Отмена</button>
                    <button type="button" class="auth-confirm-btn danger" id="auth-confirm-close-btn">Да</button>
                </div>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modalHTML);
}

// --- СОБЫТИЯ ---
function initAuthEvents() {
    const overlay = document.getElementById('auth-modal-overlay');
    const closeBtn = document.getElementById('auth-close-btn');
    const tabLogin = document.getElementById('tab-login-btn');
    const tabRegister = document.getElementById('tab-register-btn');
    
    const formLogin = document.getElementById('auth-form-login');
    const formRegister = document.getElementById('auth-form-register');

    const regNameInput = document.getElementById('reg-name');
    const regUsernameInput = document.getElementById('reg-username');
    const regPasswordInput = document.getElementById('reg-password');

    const rowUsername = document.getElementById('reg-username-row');
    const rowPassword = document.getElementById('reg-password-row');

    const btnConfirmYes = document.getElementById('auth-confirm-close-btn');
    const btnConfirmNo = document.getElementById('auth-cancel-close-btn');

    if (overlay && overlay.dataset.eventsInitialized) return;
    if (overlay) overlay.dataset.eventsInitialized = "true";

    btnConfirmYes?.addEventListener('click', window.hideAuthModal);
    btnConfirmNo?.addEventListener('click', () => hideConfirmToast(false));
    closeBtn?.addEventListener('click', window.hideAuthModal);

    overlay?.addEventListener('click', (e) => {
        if (e.target !== overlay) return;
        if (overlayClickTimeout) clearTimeout(overlayClickTimeout);

        overlayClickTimeout = setTimeout(() => {
            const container = document.querySelector('.auth-modal-container');
            if (container) {
                container.classList.remove('shake');
                void container.offsetWidth;
                container.classList.add('shake');
                setTimeout(() => container.classList.remove('shake'), 400);
            }
        }, 250);
    });

    overlay?.addEventListener('dblclick', (e) => {
        if (e.target === overlay) {
            if (overlayClickTimeout) clearTimeout(overlayClickTimeout);
            showConfirmToast();
        }
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') window.hideAuthModal();
    });

    tabLogin?.addEventListener('click', () => setAuthMode('login'));
    tabRegister?.addEventListener('click', () => setAuthMode('register'));

    // --- ЛОГИКА ПОЭТАПНОЙ РЕГИСТРАЦИИ (1.5 сек затишья) ---

    regNameInput?.addEventListener('input', () => {
        const val = regNameInput.value.trim();
        
        if (!val) {
            rowUsername?.classList.remove('visible-row');
            rowPassword?.classList.remove('visible-row');
            if (regUsernameInput) regUsernameInput.value = '';
            if (regPasswordInput) regPasswordInput.value = '';
            regNameTypedValid = false;
            regUsernameTypedValid = false;
            return;
        }

        if (!regPasswordInput.value) {
            rowPassword?.classList.remove('visible-row');
            regUsernameTypedValid = false;
        }

        if (regPasswordInput.value.length > 0) return;

        if (regStepTimeout) clearTimeout(regStepTimeout);
        
        regStepTimeout = setTimeout(() => {
            if (regNameInput.value.trim().length > 0) {
                rowUsername?.classList.add('visible-row');
                regNameTypedValid = true;
            }
        }, 1500);
    });

    regUsernameInput?.addEventListener('input', () => {
        const val = regUsernameInput.value.trim();
        
        if (!val) {
            rowPassword?.classList.remove('visible-row');
            if (regPasswordInput) regPasswordInput.value = '';
            regUsernameTypedValid = false;
            return;
        }

        if (regPasswordInput.value.length > 0) return;

        if (regStepTimeout) clearTimeout(regStepTimeout);

        regStepTimeout = setTimeout(() => {
            if (regUsernameInput.value.trim().length > 0) {
                rowPassword?.classList.add('visible-row');
                regUsernameTypedValid = true;
            }
        }, 1500);
    });

    regPasswordInput?.addEventListener('input', () => {
        const val = regPasswordInput.value;
        if (val.length > 0) {
            if (regStepTimeout) clearTimeout(regStepTimeout);
            rowUsername?.classList.add('visible-row');
            rowPassword?.classList.add('visible-row');
        } else {
            if (!regUsernameInput.value.trim()) {
                rowPassword?.classList.remove('visible-row');
            }
        }
    });

    // --- ОБРАБОТКА ВХОДА ---
    formLogin?.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (!window.supabaseClient) return alert('Supabase CDN не подключен!');

        const submitBtn = document.getElementById('btn-submit-login');
        
        // Убираем автоматическое добавление INTERNAL_DOMAIN, оставляем то, что введено в поле
        const email = document.getElementById('login-username').value.trim().toLowerCase();
        const password = document.getElementById('login-password').value;

        setButtonLoading(submitBtn, true, 'Войти');

        try {
            const { data, error } = await window.supabaseClient.auth.signInWithPassword({ email, password });

            if (error) {
                alert(`Ошибка входа: ${error.message}`);
                setButtonLoading(submitBtn, false, 'Войти');
            } else {
                window.hideAuthModal();
                window.location.href = 'welcome.html';
            }
        } catch (err) {
            console.error(err);
            setButtonLoading(submitBtn, false, 'Войти');
        }
    });

    // --- ОБРАБОТКА РЕГИСТРАЦИИ ---
    formRegister?.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (!window.supabaseClient) return alert('Supabase CDN не подключен!');

        const submitBtn = document.getElementById('btn-submit-register');
        const name = regNameInput.value.trim();
        const userInput = regUsernameInput.value.trim().toLowerCase();
        const password = regPasswordInput.value;

        const email = userInput + INTERNAL_DOMAIN;

        setButtonLoading(submitBtn, true, 'Зарегистрироваться');

        try {
            const { data, error } = await window.supabaseClient.auth.signUp({ 
                email, 
                password,
                options: {
                    data: {
                        full_name: name,
                        username: userInput
                    }
                }
            });

            if (error) {
                alert(`Ошибка регистрации: ${error.message}`);
                setButtonLoading(submitBtn, false, 'Зарегистрироваться');
            } else {
                setButtonLoading(submitBtn, false, 'Зарегистрироваться');
                window.hideAuthModal();
                alert('Регистрация прошла успешно!');
                window.location.href = 'welcome.html';
            }
        } catch (err) {
            console.error(err);
            setButtonLoading(submitBtn, false, 'Зарегистрироваться');
        }
    });
}

async function checkUserSession() {
    if (!window.supabaseClient) return;

    const { data: { session } } = await window.supabaseClient.auth.getSession();
    
    if (session && session.user) {
        if (window.location.pathname.includes('login.html')) {
            window.location.href = 'welcome.html';
            return;
        }
    }

    updateUIForUser(session ? session.user : null);

    window.supabaseClient.auth.onAuthStateChange((event, session) => {
        const user = session ? session.user : null;
        updateUIForUser(user);
    });
}

function updateUIForUser(user) {
    const mainAuthBtn = document.getElementById('open-auth-btn') || document.getElementById('auth-main-btn');
    const profileWidget = document.getElementById('user-profile-widget');
    
    const profileNameText = document.getElementById('profile-name-text');
    const profileEmailText = document.getElementById('profile-email-text');

    if (user) {
        document.body.classList.add('user-logged-in');

        if (mainAuthBtn) mainAuthBtn.style.display = 'none';

        if (profileWidget) {
            const customName = user.user_metadata?.full_name || user.user_metadata?.username;
            const userEmail = user.email || '';
            const cleanLogin = userEmail.replace(INTERNAL_DOMAIN, '');
            const username = customName || cleanLogin || 'Пользователь';

            if (profileNameText) {
                profileNameText.textContent = username;
            }

            if (profileEmailText) {
                profileEmailText.textContent = cleanLogin;
            }

            profileWidget.style.display = 'block';
        }
    } else {
        document.body.classList.remove('user-logged-in');
        if (mainAuthBtn) mainAuthBtn.style.display = 'inline-block';
        if (profileWidget) profileWidget.style.display = 'none';
    }
}