// welcome-greeting.js

// --- СТИЛИ ПРИВЕТСТВИЯ И ПЕРСОНАЖА ---
function injectGreetingStyles() {
    if (document.getElementById('welcome-greeting-styles')) return;

    const css = `
        .welcome-overlay {
            position: fixed !important; 
            top: 0 !important; 
            left: 0 !important;
            width: 100vw !important; 
            height: 100vh !important;
            background: rgba(10, 10, 12, 0.94) !important;
            backdrop-filter: blur(12px) !important;
            -webkit-backdrop-filter: blur(12px) !important;
            z-index: 9999999 !important;
            display: flex !important; 
            flex-direction: column !important;
            align-items: center !important; 
            justify-content: center !important;
            opacity: 0 !important; 
            transition: opacity 0.8s ease !important;
            overflow: hidden !important;
        }
        .welcome-overlay.visible { opacity: 1 !important; }
        .welcome-overlay.fade-out { opacity: 0 !important; }

        /* Контейнер персонажа внутри экрана приветствия */
        .welcome-character-container {
    display: flex !important;
    flex-direction: column !important;
    align-items: center !important;
    justify-content: center !important;
    gap: 28px !important;
    margin-bottom: 30px !important;
    transform: translateY(20px); /* Уберите !important здесь */
    transition: transform 0.6s cubic-bezier(0.16, 1, 0.3, 1); /* И здесь */
}

        .welcome-character-container.revealed {
            transform: translateY(0) !important;
        }

        /* Точки-лоадер над персонажем */
        .char-loader {
            display: flex !important;
            gap: 6px !important;
            align-items: center !important;
            justify-content: center !important;
            height: 20px !important;
            margin-bottom: -10px !important;
            opacity: 0 !important;
            visibility: hidden !important;
            transition: opacity 0.3s ease !important;
        }

        .welcome-character-container.state-loading .char-loader {
            opacity: 1 !important;
            visibility: visible !important;
        }

        .loader-dot {
            width: 6px !important;
            height: 6px !important;
            background: #ffffff !important;
            border-radius: 50% !important;
            opacity: 0.4 !important;
            animation: pulse-dot 1.4s infinite ease-in-out both !important;
        }

        .loader-dot:nth-child(1) { animation-delay: -0.32s !important; }
        .loader-dot:nth-child(2) { animation-delay: -0.16s !important; }

        @keyframes pulse-dot {
            0%, 80%, 100% { transform: scale(0.6); opacity: 0.4; }
            40% { transform: scale(1.2); opacity: 1; }
        }

        /* Глаза персонажа */
        .char-eyes {
            display: flex !important;
            gap: 48px !important;
            align-items: center !important;
            justify-content: center !important;
        }

        .char-eye {
            width: 50px !important;
            height: 50px !important;
            background: transparent !important;
            border: 6px solid #ffffff !important;
            border-radius: 50% !important;
            box-sizing: border-box !important;
            position: relative !important;
            overflow: hidden !important;
            transition: transform 0.1s ease !important;
        }

        .welcome-character-container.blinking .char-eye {
            transform: scaleY(0.1) !important;
        }

        .char-pupil {
            width: 12px !important;
            height: 12px !important;
            background: #ffffff !important;
            border-radius: 50% !important;
            position: absolute !important;
            top: 50% !important;
            left: 50% !important;
            transform: translate(-50%, -50%) !important;
        }

        /* Рот персонажа */
        .char-mouth {
            width: 44px !important;
            height: 6px !important;
            background: #ffffff !important;
            border-radius: 3px !important;
            transition: all 0.3s ease !important;
        }

        /* Эмоции персонажа */
        .welcome-character-container.state-loading .char-mouth {
            width: 24px !important;
            height: 6px !important;
        }
        .welcome-character-container.state-loading .char-pupil {
            top: 20% !important; 
            transform: translate(-50%, 0) !important;
        }

        .welcome-character-container.state-neutral .char-mouth {
            width: 56px !important;
            height: 6px !important;
        }

        .welcome-character-container.state-happy .char-mouth {
            width: 52px !important;
            height: 18px !important;
            background: #ffffff !important;
            border-radius: 0 0 50px 50px !important;
        }

        .welcome-container {
            width: 90% !important; 
            max-width: 900px !important;
            display: flex !important; 
            justify-content: center !important;
            min-height: 80px !important;
            position: relative !important;
            z-index: 10 !important;
        }

        .welcome-title {
            font-family: 'Montserrat', sans-serif !important;
            font-size: 28px !important; 
            font-weight: 900 !important;
            color: rgba(255, 255, 255, 0.3) !important; 
            text-transform: uppercase !important;
            letter-spacing: 3px !important; 
            margin: 0 !important;
            text-align: center !important;
            transform: translateY(35px) !important;
            transition: transform 0.6s cubic-bezier(0.16, 1, 0.3, 1), 
                        color 0.6s ease !important;
        }

        .welcome-title.revealed {
            color: #ffffff !important;
            transform: translateY(0) !important;
        }

        .welcome-bg-watermark {
            position: absolute !important;
            top: 45% !important;
            right: -15% !important;
            left: auto !important;
            width: 1200px !important;
            height: auto !important;
            max-width: none !important;
            pointer-events: none !important;
            z-index: 1 !important;
            transform-origin: center right !important;
            opacity: 0.22 !important;
            filter: blur(12px) brightness(0.9) !important;
            animation: intenseFloat 6s ease-in-out infinite alternate !important;
        }

        @keyframes intenseFloat {
            0% { transform: translateY(-50%) translateX(0px) rotate(0deg) scale(1); }
            50% { transform: translateY(-58%) translateX(-25px) rotate(-5deg) scale(1.04); }
            100% { transform: translateY(-42%) translateX(15px) rotate(4deg) scale(0.96); }
        }

        .welcome-ticker {
            display: inline-block !important;
            height: 1.2em !important;
            overflow: hidden !important;
            vertical-align: bottom !important;
            position: relative !important;
        }

        .welcome-ticker-track {
            display: flex !important;
            flex-direction: column !important;
            transition: transform 0.5s cubic-bezier(0.25, 1, 0.5, 1) !important;
        }

        .welcome-ticker-item {
            height: 1.2em !important;
            line-height: 1.2em !important;
            white-space: nowrap !important;
        }

        .welcome-loader-status {
            display: inline-flex !important;
            align-items: center !important;
            gap: 16px !important;
            font-size: 26px !important;
            font-weight: 900 !important;
            letter-spacing: 3px !important;
            color: rgba(255, 255, 255, 0.7) !important;
            transition: opacity 0.4s ease !important;
        }

        .welcome-loader-status.hidden {
            opacity: 0 !important;
            pointer-events: none !important;
            display: none !important;
        }

        .dot-loader-track {
            position: relative !important;
            width: 54px !important;
            height: 8px !important;
            background: rgba(255, 255, 255, 0.1) !important;
            border-radius: 4px !important;
            overflow: hidden !important;
        }

        .dot-loader-ball {
            position: absolute !important;
            top: 0 !important;
            left: 0 !important;
            width: 8px !important;
            height: 8px !important;
            background: #ffffff !important;
            border-radius: 50% !important;
            will-change: transform !important;
            animation: moveDotClean 0.8s ease-in-out infinite alternate !important;
        }

        @keyframes moveDotClean {
            0% { transform: translateX(0px); }
            100% { transform: translateX(46px); }
        }

        .welcome-overlay.flash-closing {
            background-color: #ffffff !important;
            transform: scale(1.05) !important;
            opacity: 0 !important;
            transition: background-color 0.4s ease, transform 0.4s ease, opacity 0.4s ease !important;
        }

        .welcome-character-container.scale-down {
            transform: scale(0) !important;
            opacity: 0 !important;
            transition: transform 0.4s cubic-bezier(0.6, 0, 0.4, 1), opacity 0.3s ease !important;
        }
    `;

    const styleElement = document.createElement('style');
    styleElement.id = 'welcome-greeting-styles';
    styleElement.textContent = css;
    document.head.appendChild(styleElement);
}

// --- ОСНОВНАЯ ФУНКЦИЯ ---
function initGreetingUI(onComplete) {
    if (document.getElementById('welcome-greeting-overlay')) return;

    injectGreetingStyles();

    let displayName = 'ПОЛЬЗОВАТЕЛЬ';
    let displayPrefix = 'USER';

    try {
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.endsWith('-auth-token')) {
                const tokenData = JSON.parse(localStorage.getItem(key));
                const user = tokenData?.user || tokenData?.currentSession?.user;
                if (user) {
                    displayPrefix = (user.email ? user.email.split('@')[0] : 'USER').toUpperCase();
                    displayName = (user.user_metadata?.full_name || user.user_metadata?.username || displayPrefix).toUpperCase();
                    break;
                }
            }
        }
    } catch (e) {
        console.error('Ошибка чтения локальной сессии:', e);
    }

    const greetingHTML = `
        <div id="welcome-greeting-overlay" class="welcome-overlay">
            <img src="images/geo_logo.png" alt="" class="welcome-bg-watermark">
            
            <div id="welcome-character" class="welcome-character-container state-loading revealed">
                <div class="char-loader">
                    <div class="loader-dot"></div>
                    <div class="loader-dot"></div>
                    <div class="loader-dot"></div>
                </div>
                <div class="char-eyes">
                    <div class="char-eye"><div class="char-pupil"></div></div>
                    <div class="char-eye"><div class="char-pupil"></div></div>
                </div>
                <div class="char-mouth"></div>
            </div>

            <div class="welcome-container">
                <h1 id="welcome-title-element" class="welcome-title">
                    <span id="welcome-status-box" class="welcome-loader-status">
                        УЗНАЕМ ВАС
                        <span class="dot-loader-track">
                            <span class="dot-loader-ball"></span>
                        </span>
                    </span>
                    <span id="welcome-main-greeting" style="display: none;">
                        ЗДРАВСТВУЙТЕ, 
                        <span class="welcome-ticker">
                            <span class="welcome-ticker-track" id="welcome-track">
                                <span class="welcome-ticker-item" id="greeting-prefix">${displayPrefix}!</span>
                                <span class="welcome-ticker-item" id="greeting-fullname">${displayName}!</span>
                            </span>
                        </span>
                    </span>
                </h1>
            </div>
        </div>
    `;

    document.body.insertAdjacentHTML('beforeend', greetingHTML);
    const overlay = document.getElementById('welcome-greeting-overlay');
    
    requestAnimationFrame(() => {
        overlay.classList.add('visible');
    });

    const titleElement = document.getElementById('welcome-title-element');
    const statusBox = document.getElementById('welcome-status-box');
    const mainGreeting = document.getElementById('welcome-main-greeting');
    const track = document.getElementById('welcome-track');
    const character = document.getElementById('welcome-character');

    const mouseMoveHandler = (e) => {
        if (!character) return;
        const pupils = character.querySelectorAll('.char-pupil');
        pupils.forEach(pupil => {
            const eye = pupil.parentElement;
            const rect = eye.getBoundingClientRect();
            const eyeCenterX = rect.left + rect.width / 2;
            const eyeCenterY = rect.top + rect.height / 2;
            const radian = Math.atan2(e.clientY - eyeCenterY, e.clientX - eyeCenterX);
            const distance = Math.min(10, Math.hypot(e.clientX - eyeCenterX, e.clientY - eyeCenterY) * 0.1);
            pupil.style.transform = `translate(calc(-50% + ${Math.cos(radian) * distance}px), calc(-50% + ${Math.sin(radian) * distance}px))`;
        });
    };
    window.addEventListener('mousemove', mouseMoveHandler);

    function triggerBlink() {
        if (!character || !document.contains(character)) return;
        character.classList.add('blinking');
        setTimeout(() => { if (character) character.classList.remove('blinking'); }, 120);
        setTimeout(triggerBlink, Math.random() * 2500 + 1000);
    }
    const blinkTimeout = setTimeout(triggerBlink, 1500);

    setTimeout(() => {
        if (!statusBox || !mainGreeting) return;
        statusBox.classList.add('hidden');
        statusBox.style.display = 'none';
        mainGreeting.style.display = 'inline';
        if (titleElement) titleElement.classList.add('revealed');
        if (character) character.className = 'welcome-character-container state-happy revealed';
    }, 1500);

    setTimeout(() => {
        if (track) track.style.transform = 'translateY(-1.2em)';
    }, 2800);

    setTimeout(() => {
        if (character) character.classList.add('scale-down');
        overlay.classList.add('flash-closing');

        setTimeout(() => {
            window.removeEventListener('mousemove', mouseMoveHandler);
            clearTimeout(blinkTimeout);
            overlay.remove();
            if (typeof onComplete === 'function') onComplete();
        }, 800);
    }, 4000);
}

window.initGreetingUI = initGreetingUI;
