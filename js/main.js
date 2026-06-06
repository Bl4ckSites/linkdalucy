/**
 * Luciana Lima – Script principal com proteção multicamadas
 * Criado por: dense_66
 * Versão: 3.0.0 – Estável para mobile, com lembrança de validação
 */

console.log('%c[Luciana Lima] main.js carregado', 'color: #0f0; font-size: 16px;');

(function () {
    'use strict';

    // ==================== CONFIGURAÇÃO ====================
    const CONFIG = {
        BACKEND_URL: 'https://linkdalucy-1.onrender.com',
        SCORE_THRESHOLD: 3,
        TOKEN_EXPIRY_SECONDS: 30,
        HEARTBEAT_INTERVAL: 20000,
        MIN_TIME_ON_PAGE: 2000,
        VALIDATION_TTL: 60 * 60 * 1000, // 60 minutos em ms
    };

    const author = 'dense_66';
    const logPrefix = `[Luciana Lima ${author}]`;

    function log(msg, data) { console.log(`${logPrefix} ${msg}`, data || ''); }
    function warn(msg, data) { console.warn(`${logPrefix} ${msg}`, data || ''); }
    function error(msg, data) { console.error(`${logPrefix} ${msg}`, data || ''); }

    // ==================== RELATÓRIO DE ERROS ====================
    window.addEventListener('error', function (event) {
        error(`Erro: ${event.message}`, { arquivo: event.filename, linha: event.lineno, coluna: event.colno, stack: event.error?.stack });
    });
    window.addEventListener('unhandledrejection', function (event) {
        error(`Rejeição: ${event.reason}`, { stack: event.reason?.stack });
    });

    // ==================== FERRAMENTAS ====================
    function redirectTo(url) { window.location.href = url; }

    function getSessionId() {
        let id = sessionStorage.getItem('ssid');
        if (!id) {
            id = crypto.randomUUID ? crypto.randomUUID() : 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
                const r = Math.random() * 16 | 0;
                return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
            });
            sessionStorage.setItem('ssid', id);
        }
        return id;
    }

    // ==================== LEMBRANÇA DE VALIDAÇÃO ====================
    function hasRecentValidation() {
        const lastValid = localStorage.getItem('lu_last_valid');
        if (!lastValid) return false;
        const elapsed = Date.now() - parseInt(lastValid);
        if (elapsed < CONFIG.VALIDATION_TTL) {
            log(`Usuário validado recentemente (${Math.floor(elapsed/1000)}s atrás).`);
            return true;
        }
        localStorage.removeItem('lu_last_valid');
        return false;
    }

    function markValidationSuccess() {
        localStorage.setItem('lu_last_valid', Date.now().toString());
        log('Validação registrada com sucesso.');
    }

    // ==================== CAMADA 3: DETECÇÃO DE AUTOMAÇÃO (AJUSTADA) ====================
    function detectAutomation() {
        // Se já foi validado recentemente, reduz falsos positivos
        if (hasRecentValidation()) {
            log('Validação recente detectada – pulando verificação de automação.');
            return false;
        }

        if (navigator.webdriver) return true;
        if (document.__selenium_unwrapped || document.__driver_evaluate || document.__webdriver_evaluate) return true;
        if (window.chrome === undefined && navigator.userAgent.includes('Chrome')) return true;

        // Apenas em desktop (largura > 1024) checamos a diferença outer/inner
        if (window.innerWidth > 1024) {
            if (window.outerWidth - window.innerWidth === 0 && window.outerWidth > 0 && navigator.languages.length === 0) return true;
        }

        if (typeof requestAnimationFrame === 'undefined') return true;
        return false;
    }

    // ==================== CAMADA 5: SCORE COMPORTAMENTAL ====================
    const behavior = {
        score: 0, mouseMoves: 0, lastMouseX: null, lastMouseY: null,
        scrolls: 0, keys: 0, touches: 0, pageEnterTime: Date.now(), visible: true
    };

    function initBehaviorTracking() {
        document.addEventListener('mousemove', function (e) {
            behavior.mouseMoves++;
            if (behavior.lastMouseX !== null) {
                const dist = Math.sqrt((e.clientX - behavior.lastMouseX)**2 + (e.clientY - behavior.lastMouseY)**2);
                if (dist > 3) behavior.score += 0.1;
            }
            behavior.lastMouseX = e.clientX;
            behavior.lastMouseY = e.clientY;
        }, { passive: true });

        window.addEventListener('scroll', () => { behavior.scrolls++; if (behavior.scrolls > 2) behavior.score += 0.5; }, { passive: true });
        document.addEventListener('keydown', () => { behavior.keys++; if (behavior.keys === 1) behavior.score += 0.5; });
        window.addEventListener('touchstart', () => { behavior.touches++; behavior.score += 0.5; }, { passive: true });
        document.addEventListener('visibilitychange', () => { behavior.visible = !document.hidden; });
    }

    function getBehaviorScore() {
        if (hasRecentValidation()) {
            log('Pontuação dispensada (validação recente).');
            return CONFIG.SCORE_THRESHOLD + 1; // sempre passa
        }
        const timeSpent = Date.now() - behavior.pageEnterTime;
        if (timeSpent > CONFIG.MIN_TIME_ON_PAGE) behavior.score += 2;
        if (behavior.mouseMoves > 5) behavior.score += 1;
        if (behavior.scrolls > 1) behavior.score += 0.5;
        log(`Pontuação comportamental: ${behavior.score}`);
        return behavior.score;
    }

    // ==================== CAMADA 4: HONEYPOT ====================
    function setupHoneypot() {
        const hpField = document.getElementById('hp-field');
        const hpLink = document.getElementById('hp-link');
        if (hpField) {
            hpField.addEventListener('focus', () => redirectTo('neutral.html'));
            hpField.addEventListener('input', () => redirectTo('neutral.html'));
        }
        if (hpLink) hpLink.addEventListener('click', e => { e.preventDefault(); redirectTo('neutral.html'); });
    }

    // ==================== CAMADA 6 & 10: FINGERPRINT ====================
    function getFingerprint() {
        const canvas = document.createElement('canvas');
        canvas.width = 200; canvas.height = 60;
        const ctx = canvas.getContext('2d');
        ctx.textBaseline = 'top'; ctx.font = '14px Arial';
        ctx.fillStyle = '#f60'; ctx.fillRect(125,1,62,20);
        ctx.fillStyle = '#069'; ctx.fillText('Luciana Lima ✨', 2, 15);
        ctx.fillStyle = 'rgba(102, 204, 0, 0.7)'; ctx.fillText('Luciana Lima ✨', 4, 17);
        const dataUrl = canvas.toDataURL(); const hash = btoa(dataUrl).slice(0, 32);
        return {
            resolution: screen.width + 'x' + screen.height,
            colorDepth: screen.colorDepth,
            language: navigator.language,
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            platform: navigator.platform,
            hardwareConcurrency: navigator.hardwareConcurrency || 'unknown',
            canvasHash: hash,
        };
    }

    // ==================== CAMADA 6: OBTENÇÃO DE JWT ====================
    async function requestToken() {
        const fingerprint = getFingerprint(); const sessionId = getSessionId();
        try {
            const response = await fetch(CONFIG.BACKEND_URL + '/token', {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ session_id: sessionId, fingerprint }),
            });
            if (!response.ok) { const err = await response.text(); error(`Falha token (${response.status}): ${err}`); return false; }
            const data = await response.json();
            if (data.token) {
                sessionStorage.setItem('jwt', data.token);
                sessionStorage.setItem('jwt_exp', data.expires_at);
                sessionStorage.setItem('jwt_fp', fingerprint.canvasHash); // apenas canvas hash
                markValidationSuccess(); // lembra que validou
                return true;
            }
            return false;
        } catch (e) { error(`Exceção token: ${e.message}`); return false; }
    }

    // ==================== CAMADA 7 & 8: VALIDAÇÃO DO TOKEN ====================
    function isTokenValid() {
        const token = sessionStorage.getItem('jwt'), exp = sessionStorage.getItem('jwt_exp');
        if (!token || !exp) return false;
        if (Date.now() > parseInt(exp) * 1000) { clearSessionAndRedirect(); return false; }
        // Compara apenas canvas hash (estável)
        const storedHash = sessionStorage.getItem('jwt_fp');
        if (storedHash && getFingerprint().canvasHash !== storedHash) {
            warn('Canvas hash alterado. Invalidando token.');
            clearSessionAndRedirect();
            return false;
        }
        return true;
    }

    function clearSessionAndRedirect() {
        sessionStorage.removeItem('jwt'); sessionStorage.removeItem('jwt_exp'); sessionStorage.removeItem('jwt_fp');
        redirectTo('neutral.html');
    }

    // ==================== CAMADA 9: HEARTBEAT ====================
    let countdownInterval = null, timeLeft = CONFIG.TOKEN_EXPIRY_SECONDS;
    function startHeartbeat() {
        countdownInterval = setInterval(() => {
            timeLeft--; if (timeLeft <= 0) { clearInterval(countdownInterval); clearSessionAndRedirect(); }
        }, 1000);
        setInterval(async () => {
            const token = sessionStorage.getItem('jwt'); if (!token) return;
            try {
                const response = await fetch(CONFIG.BACKEND_URL + '/refresh', {
                    method: 'POST', headers: { 'Authorization': 'Bearer ' + token },
                });
                if (response.ok) {
                    const data = await response.json();
                    sessionStorage.setItem('jwt', data.token);
                    sessionStorage.setItem('jwt_exp', data.expires_at);
                    timeLeft = CONFIG.TOKEN_EXPIRY_SECONDS;
                } else clearSessionAndRedirect();
            } catch (e) {}
        }, CONFIG.HEARTBEAT_INTERVAL);
    }

    // ==================== EFEITOS ====================
    function setupMagneticEffect() {
        if (window.matchMedia('(max-width: 1024px)').matches) return;
        document.querySelectorAll('.image-button').forEach(card => {
            card.addEventListener('mousemove', function (e) {
                const rect = card.getBoundingClientRect();
                const x = e.clientX - rect.left - rect.width / 2;
                const y = e.clientY - rect.top - rect.height / 2;
                card.style.transform = `perspective(600px) rotateX(${(y / rect.height) * -6}deg) rotateY(${(x / rect.width) * 6}deg) translateY(-3px)`;
            });
            card.addEventListener('mouseleave', () => card.style.transform = '');
        });
    }

    function updateResponsiveAssets() {
        const width = window.innerWidth;
        document.documentElement.classList.remove('is-mobile', 'is-tablet', 'is-desktop');
        if (width <= 480) document.documentElement.classList.add('is-mobile');
        else if (width <= 1024) document.documentElement.classList.add('is-tablet');
        else document.documentElement.classList.add('is-desktop');

        document.querySelectorAll('[data-responsive-img]').forEach(img => {
            const type = img.getAttribute('data-responsive-img');
            const base = type === 'index' ? 'imgs/profile-index' : 'imgs/profile-links';
            const suffix = width <= 480 ? '-mobile' : '-desktop';
            const newSrc = base + suffix + '.jpg';
            if (img.getAttribute('src') !== newSrc) img.setAttribute('src', newSrc);
        });
    }

    function setupVideoBackground() {
        const videos = document.querySelectorAll('.video-background video');
        if (!videos.length) return;
        log(`Configurando ${videos.length} vídeo(s)...`);
        videos.forEach(video => {
            video.removeAttribute('controls');
            video.setAttribute('disablePictureInPicture', '');
            video.setAttribute('playsinline', '');
            video.muted = true;
            video.loop = true;
            function markLoaded() { video.classList.add('loaded'); video.style.opacity = '1'; }
            if (video.readyState >= 2) markLoaded();
            else {
                video.addEventListener('loadeddata', markLoaded, { once: true });
                video.addEventListener('canplay', markLoaded, { once: true });
                setTimeout(() => { if (!video.classList.contains('loaded')) markLoaded(); }, 3000);
            }
        });
    }

    // ==================== SOM E RIPPLE ====================
    const SoundManager = (() => {
        let ctx = null, audioBuffer = null;
        const audioFiles = ['audio/click.mp3', 'audio/click.ogg', 'audio/click.wav'];
        function getCtx() {
            if (!ctx) {
                try { ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { return null; }
            }
            if (ctx.state === 'suspended') ctx.resume();
            return ctx;
        }
        function loadAudioFile(url) {
            return fetch(url)
                .then(r => r.arrayBuffer())
                .then(buffer => getCtx().decodeAudioData(buffer))
                .then(decoded => { audioBuffer = decoded; return true; })
                .catch(() => false);
        }
        function tryLoadAudio() {
            if (!getCtx()) return;
            loadAudioFile(audioFiles[0])
                .then(ok => ok || (audioFiles[1] ? loadAudioFile(audioFiles[1]) : false))
                .then(ok => ok || (audioFiles[2] ? loadAudioFile(audioFiles[2]) : false));
        }
        tryLoadAudio();
        function playClick() {
            const c = getCtx(); if (!c) return;
            if (audioBuffer) {
                const source = c.createBufferSource();
                source.buffer = audioBuffer;
                source.connect(c.destination);
                source.start(0);
                return;
            }
            try {
                const now = c.currentTime;
                const osc = c.createOscillator();
                const gain = c.createGain();
                osc.type = 'sine';
                osc.frequency.setValueAtTime(800, now);
                osc.frequency.exponentialRampToValueAtTime(600, now + 0.08);
                gain.gain.setValueAtTime(0.08, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
                osc.connect(gain); gain.connect(c.destination);
                osc.start(now); osc.stop(now + 0.12);
            } catch (e) {}
        }
        return { playClick };
    })();

    function createRipple(event, element) {
        const ripple = document.createElement('span');
        ripple.className = 'ripple';
        const rect = element.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height);
        ripple.style.width = ripple.style.height = size + 'px';
        ripple.style.left = (event.clientX - rect.left - size / 2) + 'px';
        ripple.style.top = (event.clientY - rect.top - size / 2) + 'px';
        element.appendChild(ripple);
        ripple.addEventListener('animationend', () => ripple.remove());
    }

    function trackClick(label) {
        log(`Clique: ${label}`);
        if (navigator.vibrate) navigator.vibrate(12);
        SoundManager.playClick();
    }

    function setupGlobalTracking() {
        document.body.addEventListener('click', function (e) {
            const btn = e.target.closest('.image-button');
            if (btn) {
                trackClick(btn.getAttribute('data-link') || 'card');
                createRipple(e, btn);
            }
            const soc = e.target.closest('.social-icon');
            if (soc) trackClick('social-' + (soc.getAttribute('data-platform') || ''));
        }, { passive: true });
    }

    // ==================== SCROLL REVEAL ====================
    function setupScrollReveal() {
        const revealEls = document.querySelectorAll('.reveal-el');
        if (!revealEls.length) return;
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
            revealEls.forEach(el => el.classList.add('visible'));
            return;
        }
        if (!('IntersectionObserver' in window)) {
            revealEls.forEach(el => el.classList.add('visible'));
            return;
        }
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                    observer.unobserve(entry.target);
                }
            });
        }, { root: null, rootMargin: '0px 0px 0px 0px', threshold: 0.2 });
        revealEls.forEach(el => observer.observe(el));
    }

    // ==================== PÁGINA INICIAL ====================
    function setupIndexPage() {
        log('Configurando página inicial...');
        const ctaButton = document.getElementById('ctaButton');
        const modal = document.getElementById('verifyModal');
        const modalContinue = document.getElementById('modalContinue');
        if (!ctaButton || !modal || !modalContinue) { error('Elementos essenciais não encontrados.'); return; }

        if (detectAutomation()) { warn('Automação detectada.'); redirectTo('neutral.html'); return; }
        initBehaviorTracking();
        setupHoneypot();

        ctaButton.addEventListener('click', function () {
            trackClick('cta-quero-ouvir-mais');
            const score = getBehaviorScore();
            if (score < CONFIG.SCORE_THRESHOLD) {
                warn(`Pontuação insuficiente (${score}/${CONFIG.SCORE_THRESHOLD}).`);
                redirectTo('neutral.html');
                return;
            }
            modal.classList.add('active');
        });

        modalContinue.addEventListener('click', async function () {
            trackClick('cta-continuar');
            modalContinue.disabled = true;
            modalContinue.textContent = 'Verificando...';
            const success = await requestToken();
            if (success) redirectTo('links.html');
            else {
                alert('Falha na verificação. Tente novamente.');
                redirectTo('neutral.html');
            }
        });

        modal.addEventListener('click', function (e) {
            if (e.target === modal) modal.classList.remove('active');
        });
    }

    // ==================== PÁGINA DE LINKS ====================
    function setupLinksPage() {
        log('Configurando página de links...');
        if (!isTokenValid()) return;
        startHeartbeat();
        updateResponsiveAssets();
        setupScrollReveal();
        setupVideoBackground();
        document.addEventListener('click', function () {
            if (!isTokenValid()) clearSessionAndRedirect();
        });
    }

    // ==================== INICIALIZAÇÃO ====================
    function init() {
        log('Inicializando...');
        setupGlobalTracking();
        if (document.getElementById('ctaButton')) setupIndexPage();
        else if (document.getElementById('links-main')) setupLinksPage();
        setupMagneticEffect();
        updateResponsiveAssets();
        log('Pronto.');
    }

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
    else init();
})();
