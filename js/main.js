/**
 * Luciana Lima – Script principal com proteção multicamadas
 * Versão 5.1.1 – Corrigido fallback de crypto.randomUUID
 */
console.log('%c[Luciana Lima] main.js carregado (v5.1.1)', 'color: #0f0; font-size: 16px;');

(function () {
    'use strict';

    const CONFIG = {
        BACKEND_URL: 'https://linkdalucy-1.onrender.com',
        SCORE_THRESHOLD: 1,
        TOKEN_EXPIRY_SECONDS: 600,
        HEARTBEAT_INTERVAL: 300000,
        VALIDATION_TTL: 60 * 60 * 1000,
    };

    const author = 'dense_66';
    const logPrefix = `[Luciana Lima ${author}]`;

    function log(msg, data) { console.log(`${logPrefix} ${msg}`, data || ''); }
    function warn(msg, data) { console.warn(`${logPrefix} ${msg}`, data || ''); }
    function error(msg, data) { console.error(`${logPrefix} ${msg}`, data || ''); }

    window.addEventListener('error', function (event) {
        error(`Erro: ${event.message}`, { arquivo: event.filename, linha: event.lineno, coluna: event.colno, stack: event.error?.stack });
    });
    window.addEventListener('unhandledrejection', function (event) {
        error(`Rejeição: ${event.reason}`, { stack: event.reason?.stack });
    });

    function redirectTo(url) { window.location.href = url; }

    function getSessionId() {
        let id = sessionStorage.getItem('ssid');
        if (!id) {
            if (typeof crypto !== 'undefined' && crypto.randomUUID) {
                id = crypto.randomUUID();
            } else {
                id = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
                    const r = Math.random() * 16 | 0;
                    return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
                });
            }
            sessionStorage.setItem('ssid', id);
        }
        return id;
    }

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

    function detectAutomation() {
        if (hasRecentValidation()) {
            log('Validação recente – pulando verificação de automação.');
            return false;
        }
        if (navigator.webdriver) return true;
        if (document.__selenium_unwrapped || document.__driver_evaluate || document.__webdriver_evaluate) return true;
        if (window.callPhantom || window._phantom || window.__nightmare) return true;
        if (typeof requestAnimationFrame === 'undefined') return true;
        return false;
    }

    const behavior = {
        score: 0, mouseMoves: 0, lastMouseX: null, lastMouseY: null,
        scrolls: 0, keys: 0, touches: 0, pageEnterTime: Date.now(), visible: true,
        firstInteraction: false
    };

    function initBehaviorTracking() {
        function addFirstInteraction() {
            if (!behavior.firstInteraction) {
                behavior.firstInteraction = true;
                behavior.score = Math.max(behavior.score, 1);
                log('Primeira interação humana detectada.');
            }
        }

        document.addEventListener('mousemove', function (e) {
            behavior.mouseMoves++;
            addFirstInteraction();
            if (behavior.lastMouseX !== null) {
                const dist = Math.sqrt((e.clientX - behavior.lastMouseX)**2 + (e.clientY - behavior.lastMouseY)**2);
                if (dist > 3) behavior.score += 0.1;
            }
            behavior.lastMouseX = e.clientX;
            behavior.lastMouseY = e.clientY;
        }, { passive: true });

        window.addEventListener('scroll', () => {
            behavior.scrolls++;
            addFirstInteraction();
            if (behavior.scrolls > 2) behavior.score += 0.5;
        }, { passive: true });

        document.addEventListener('keydown', () => {
            behavior.keys++;
            addFirstInteraction();
            if (behavior.keys === 1) behavior.score += 0.5;
        });

        window.addEventListener('touchstart', () => {
            behavior.touches++;
            addFirstInteraction();
            behavior.score += 0.5;
        }, { passive: true });

        document.addEventListener('visibilitychange', () => { behavior.visible = !document.hidden; });
    }

    function getBehaviorScore() {
        if (hasRecentValidation()) return CONFIG.SCORE_THRESHOLD + 1;
        const timeSpent = Date.now() - behavior.pageEnterTime;
        if (timeSpent > 1000) behavior.score += 0.5;
        log(`Pontuação comportamental: ${behavior.score.toFixed(1)}`);
        return behavior.score;
    }

    function setupHoneypot() {
        const hpField = document.getElementById('hp-field');
        const hpLink = document.getElementById('hp-link');
        if (hpField) {
            hpField.setAttribute('aria-hidden', 'true');
            hpField.setAttribute('tabindex', '-1');
            hpField.addEventListener('focus', () => redirectTo('neutral.html'));
            hpField.addEventListener('input', () => redirectTo('neutral.html'));
        }
        if (hpLink) {
            hpLink.setAttribute('aria-hidden', 'true');
            hpLink.setAttribute('tabindex', '-1');
            hpLink.addEventListener('click', e => { e.preventDefault(); redirectTo('neutral.html'); });
        }
    }

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

    async function requestToken() {
        const fingerprint = getFingerprint(); const sessionId = getSessionId();
        try {
            const response = await fetch(CONFIG.BACKEND_URL + '/token', {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ session_id: sessionId, fingerprint }),
            });
            if (!response.ok) {
                const err = await response.text();
                error(`Falha token (${response.status}): ${err}`);
                return false;
            }
            const data = await response.json();
            if (data.token) {
                sessionStorage.setItem('jwt', data.token);
                sessionStorage.setItem('jwt_exp', data.expires_at);
                markValidationSuccess();
                return true;
            }
            return false;
        } catch (e) {
            error(`Exceção token: ${e.message}`);
            return false;
        }
    }

    function isTokenValid() {
        const token = sessionStorage.getItem('jwt');
        const exp = sessionStorage.getItem('jwt_exp');
        if (!token || !exp) return false;
        if (Date.now() > parseInt(exp) * 1000) {
            warn('Token expirado.');
            return false;
        }
        return true;
    }

    function clearSessionAndRedirect() {
        sessionStorage.removeItem('jwt');
        sessionStorage.removeItem('jwt_exp');
        redirectTo('index.html');
    }

    async function ensureValidSession() {
        if (isTokenValid()) return true;
        const token = sessionStorage.getItem('jwt');
        if (token) {
            try {
                const response = await fetch(CONFIG.BACKEND_URL + '/refresh', {
                    method: 'POST',
                    headers: { 'Authorization': 'Bearer ' + token }
                });
                if (response.ok) {
                    const data = await response.json();
                    sessionStorage.setItem('jwt', data.token);
                    sessionStorage.setItem('jwt_exp', data.expires_at);
                    return true;
                }
            } catch (e) {}
        }
        if (hasRecentValidation()) {
            log('Usuário validado anteriormente – concedendo acesso offline.');
            sessionStorage.setItem('jwt', 'local-fallback-token');
            sessionStorage.setItem('jwt_exp', (Date.now()/1000 + 600).toString());
            return true;
        }
        return false;
    }

    let countdownInterval = null, timeLeft = CONFIG.TOKEN_EXPIRY_SECONDS;
    function startHeartbeat() {
        countdownInterval = setInterval(() => {
            timeLeft--;
            if (timeLeft <= 0) {
                clearInterval(countdownInterval);
                warn('Tempo de token esgotado, redirecionando.');
                clearSessionAndRedirect();
            }
        }, 1000);

        setInterval(async () => {
            const token = sessionStorage.getItem('jwt');
            if (!token) return;
            try {
                const response = await fetch(CONFIG.BACKEND_URL + '/refresh', {
                    method: 'POST',
                    headers: { 'Authorization': 'Bearer ' + token }
                });
                if (response.ok) {
                    const data = await response.json();
                    sessionStorage.setItem('jwt', data.token);
                    sessionStorage.setItem('jwt_exp', data.expires_at);
                    timeLeft = CONFIG.TOKEN_EXPIRY_SECONDS;
                    log('Token renovado com sucesso.');
                }
            } catch (e) {}
        }, CONFIG.HEARTBEAT_INTERVAL);
    }

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

    function forceVisibility() {
        log('Aplicando fallback de visibilidade...');
        document.querySelectorAll('.reveal-el, .fade-in-scale, .fade-in-up, .fade-in-down, .page-transition-in').forEach(el => {
            el.style.opacity = '1';
            el.style.transform = 'none';
            el.style.filter = 'none';
            el.classList.add('visible');
            el.classList.remove('fade-in-scale', 'fade-in-up', 'fade-in-down', 'page-transition-in');
        });
        const modal = document.getElementById('verifyModal');
        if (modal) modal.style.display = '';
    }

    setTimeout(forceVisibility, 2000);

    function setupIndexPage() {
        log('Configurando página inicial...');
        const ctaButton = document.getElementById('ctaButton');
        const modal = document.getElementById('verifyModal');
        const modalContinue = document.getElementById('modalContinue');
        if (!ctaButton || !modal || !modalContinue) { error('Elementos essenciais não encontrados.'); return; }

        if (detectAutomation()) {
            warn('Automação detectada.');
            redirectTo('neutral.html');
            return;
        }
        initBehaviorTracking();
        setupHoneypot();

        ctaButton.addEventListener('click', function () {
            trackClick('cta-quero-ouvir-mais');
            const score = getBehaviorScore();
            if (score < CONFIG.SCORE_THRESHOLD) {
                warn(`Pontuação insuficiente (${score.toFixed(1)}/${CONFIG.SCORE_THRESHOLD}).`);
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
            if (success) {
                redirectTo('links.html');
            } else {
                alert('Falha na verificação. Tente novamente.');
                modalContinue.disabled = false;
                modalContinue.textContent = 'Continuar';
            }
        });

        modal.addEventListener('click', function (e) {
            if (e.target === modal) modal.classList.remove('active');
        });
    }

    async function setupLinksPage() {
        log('Configurando página de links...');
        const valid = await ensureValidSession();
        if (!valid) {
            warn('Sessão inválida e nenhuma validação recente – redirecionando.');
            redirectTo('index.html');
            return;
        }
        startHeartbeat();
        updateResponsiveAssets();
        setupScrollReveal();
        setupVideoBackground();
        document.addEventListener('click', async function () {
            if (!isTokenValid()) {
                const stillValid = await ensureValidSession();
                if (!stillValid) clearSessionAndRedirect();
            }
        });
    }

    function setupScrollReveal() {
        const revealEls = document.querySelectorAll('.reveal-el');
        if (!revealEls.length) return;
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
            revealEls.forEach(el => {
                el.classList.add('visible');
                el.style.opacity = '1';
                el.style.transform = 'none';
            });
            return;
        }
        if (!('IntersectionObserver' in window)) {
            revealEls.forEach(el => {
                el.classList.add('visible');
                el.style.opacity = '1';
                el.style.transform = 'none';
            });
            return;
        }
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                    observer.unobserve(entry.target);
                }
            });
        }, { root: null, rootMargin: '0px 0px 0px 0px', threshold: 0.1 });
        revealEls.forEach(el => observer.observe(el));
    }

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
