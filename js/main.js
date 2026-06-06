/**
 * Luciana Lima – Script principal com proteção multicamadas
 * Criado por: dense_66
 * Versão: 2.0.4 – Produção
 */

(function () {
    'use strict';

    // ==================== CONFIGURAÇÃO ====================
    const CONFIG = {
        // 👇 SUBSTITUA PELA URL DO SEU BACKEND NO RENDER
        BACKEND_URL: 'https://linkdalucy.onrender.com',
        SCORE_THRESHOLD: 3,
        TOKEN_EXPIRY_SECONDS: 30,
        HEARTBEAT_INTERVAL: 20000,
        MIN_TIME_ON_PAGE: 2000,
        REVEAL_FALLBACK_DELAY: 2000, // 2s de fallback para revelar elementos
    };

    const author = 'dense_66';

    // ==================== RELATÓRIO DE ERROS ====================
    window.addEventListener('error', function (event) {
        console.error('[Erro ' + author + '] ' + event.message, event.filename, event.lineno, event.colno, event.error);
    });
    window.addEventListener('unhandledrejection', function (event) {
        console.error('[Rejeição ' + author + '] ' + event.reason);
    });

    // ==================== FERRAMENTAS ====================
    function redirectTo(url) {
        window.location.href = url;
    }

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

    // ==================== CAMADA 3: DETECÇÃO DE AUTOMAÇÃO ====================
    function detectAutomation() {
        if (navigator.webdriver) return true;
        if (document.__selenium_unwrapped || document.__driver_evaluate || document.__webdriver_evaluate) return true;
        if (window.chrome === undefined && navigator.userAgent.includes('Chrome')) return true;
        if (window.outerWidth - window.innerWidth === 0 && window.outerWidth > 0 && navigator.languages.length === 0) return true;
        if (typeof requestAnimationFrame === 'undefined') return true;
        return false;
    }

    // ==================== CAMADA 5: SCORE COMPORTAMENTAL ====================
    const behavior = {
        score: 0,
        mouseMoves: 0,
        lastMouseX: null,
        lastMouseY: null,
        scrolls: 0,
        keys: 0,
        touches: 0,
        pageEnterTime: Date.now(),
        visible: true,
    };

    function initBehaviorTracking() {
        document.addEventListener('mousemove', function (e) {
            behavior.mouseMoves++;
            if (behavior.lastMouseX !== null) {
                const dx = e.clientX - behavior.lastMouseX;
                const dy = e.clientY - behavior.lastMouseY;
                const dist = Math.sqrt(dx*dx + dy*dy);
                if (dist > 3) behavior.score += 0.1;
            }
            behavior.lastMouseX = e.clientX;
            behavior.lastMouseY = e.clientY;
        }, { passive: true });

        window.addEventListener('scroll', function () {
            behavior.scrolls++;
            if (behavior.scrolls > 2) behavior.score += 0.5;
        }, { passive: true });

        document.addEventListener('keydown', function () {
            behavior.keys++;
            if (behavior.keys === 1) behavior.score += 0.5;
        });

        window.addEventListener('touchstart', function () {
            behavior.touches++;
            behavior.score += 0.5;
        }, { passive: true });

        document.addEventListener('visibilitychange', function () {
            behavior.visible = !document.hidden;
        });
    }

    function getBehaviorScore() {
        const timeSpent = Date.now() - behavior.pageEnterTime;
        if (timeSpent > CONFIG.MIN_TIME_ON_PAGE) behavior.score += 2;
        if (behavior.mouseMoves > 5) behavior.score += 1;
        if (behavior.scrolls > 1) behavior.score += 0.5;
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
        if (hpLink) {
            hpLink.addEventListener('click', (e) => {
                e.preventDefault();
                redirectTo('neutral.html');
            });
        }
    }

    // ==================== CAMADA 6 & 10: FINGERPRINT ====================
    function getFingerprint() {
        const canvas = document.createElement('canvas');
        canvas.width = 200;
        canvas.height = 60;
        const ctx = canvas.getContext('2d');
        ctx.textBaseline = 'top';
        ctx.font = '14px Arial';
        ctx.fillStyle = '#f60';
        ctx.fillRect(125,1,62,20);
        ctx.fillStyle = '#069';
        ctx.fillText('Luciana Lima ✨', 2, 15);
        ctx.fillStyle = 'rgba(102, 204, 0, 0.7)';
        ctx.fillText('Luciana Lima ✨', 4, 17);
        const dataUrl = canvas.toDataURL();
        const hash = btoa(dataUrl).slice(0, 32);

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
        const fingerprint = getFingerprint();
        const sessionId = getSessionId();

        try {
            const response = await fetch(CONFIG.BACKEND_URL + '/token', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    session_id: sessionId,
                    fingerprint: fingerprint,
                }),
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error('[Token Error] Status:', response.status, errorText);
                return false;
            }

            const data = await response.json();
            if (data.token) {
                sessionStorage.setItem('jwt', data.token);
                sessionStorage.setItem('jwt_exp', data.expires_at);
                sessionStorage.setItem('jwt_fp', JSON.stringify(fingerprint));
                return true;
            }
        } catch (e) {
            console.error('[Token Error]', e.message);
        }
        return false;
    }

    // ==================== CAMADA 7 & 8: VALIDAÇÃO DO TOKEN ====================
    function isTokenValid() {
        const token = sessionStorage.getItem('jwt');
        const exp = sessionStorage.getItem('jwt_exp');
        const fpStored = sessionStorage.getItem('jwt_fp');

        if (!token || !exp) return false;

        if (Date.now() > parseInt(exp) * 1000) {
            clearSessionAndRedirect();
            return false;
        }

        if (fpStored) {
            const currentFp = JSON.stringify(getFingerprint());
            if (currentFp !== fpStored) {
                clearSessionAndRedirect();
                return false;
            }
        }

        return true;
    }

    function clearSessionAndRedirect() {
        sessionStorage.removeItem('jwt');
        sessionStorage.removeItem('jwt_exp');
        sessionStorage.removeItem('jwt_fp');
        redirectTo('neutral.html');
    }

    // ==================== CAMADA 9: HEARTBEAT COM RESET DO CONTADOR ====================
    let countdownInterval = null;
    let timeLeft = CONFIG.TOKEN_EXPIRY_SECONDS;

    function startHeartbeat() {
        // Contador regressivo
        countdownInterval = setInterval(() => {
            timeLeft--;
            if (timeLeft <= 0) {
                clearInterval(countdownInterval);
                clearSessionAndRedirect();
            }
        }, 1000);

        // Heartbeat de renovação
        setInterval(async () => {
            const token = sessionStorage.getItem('jwt');
            if (!token) return;

            try {
                const response = await fetch(CONFIG.BACKEND_URL + '/refresh', {
                    method: 'POST',
                    headers: { 'Authorization': 'Bearer ' + token },
                });
                if (response.ok) {
                    const data = await response.json();
                    sessionStorage.setItem('jwt', data.token);
                    sessionStorage.setItem('jwt_exp', data.expires_at);
                    timeLeft = CONFIG.TOKEN_EXPIRY_SECONDS; // reseta contador
                } else {
                    // Token inválido → redireciona
                    clearSessionAndRedirect();
                }
            } catch (e) {
                // Falha de rede – não redireciona, tenta de novo depois
                console.warn('[Heartbeat] Falha temporária:', e.message);
            }
        }, CONFIG.HEARTBEAT_INTERVAL);
    }

    // ==================== EFEITO MAGNÉTICO (DESKTOP) ====================
    function setupMagneticEffect() {
        if (window.matchMedia('(max-width: 1024px)').matches) return;
        const cards = document.querySelectorAll('.image-button');
        cards.forEach(card => {
            card.addEventListener('mousemove', function (e) {
                const rect = card.getBoundingClientRect();
                const x = e.clientX - rect.left - rect.width / 2;
                const y = e.clientY - rect.top - rect.height / 2;
                const rotateX = (y / rect.height) * -6;
                const rotateY = (x / rect.width) * 6;
                card.style.transform = `perspective(600px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-3px)`;
            });
            card.addEventListener('mouseleave', () => {
                card.style.transform = '';
            });
        });
    }

    // ==================== ATUALIZAÇÃO DE ASSETS RESPONSIVOS ====================
    function updateResponsiveAssets() {
        const width = window.innerWidth;
        const html = document.documentElement;
        html.classList.remove('is-mobile', 'is-tablet', 'is-desktop');
        if (width <= 480) html.classList.add('is-mobile');
        else if (width <= 1024) html.classList.add('is-tablet');
        else html.classList.add('is-desktop');

        document.querySelectorAll('[data-responsive-img]').forEach(img => {
            const type = img.getAttribute('data-responsive-img');
            const base = type === 'index' ? 'imgs/profile-index' : 'imgs/profile-links';
            const suffix = width <= 480 ? '-mobile' : '-desktop';
            const newSrc = base + suffix + '.jpg';
            if (img.getAttribute('src') !== newSrc) {
                img.setAttribute('src', newSrc);
            }
        });
    }

    // ==================== FALLBACK PARA REVEAL DE ELEMENTOS ====================
    function forceRevealIfNeeded() {
        const revealEls = document.querySelectorAll('.reveal-el');
        if (!revealEls.length) return;
        // Após REVEAL_FALLBACK_DELAY, se algum ainda não estiver visível, forçamos
        setTimeout(() => {
            revealEls.forEach(el => {
                if (!el.classList.contains('visible')) {
                    el.classList.add('visible');
                }
            });
        }, CONFIG.REVEAL_FALLBACK_DELAY);
    }

    // ==================== PÁGINA INICIAL ====================
    function setupIndexPage() {
        const ctaButton = document.getElementById('ctaButton');
        const modal = document.getElementById('verifyModal');
        const modalContinue = document.getElementById('modalContinue');

        if (!ctaButton || !modal || !modalContinue) return;

        if (detectAutomation()) {
            redirectTo('neutral.html');
            return;
        }

        initBehaviorTracking();
        setupHoneypot();
        forceRevealIfNeeded(); // fallback de visibilidade

        ctaButton.addEventListener('click', function () {
            const score = getBehaviorScore();
            console.log('[Score] Comportamento:', score);
            if (score < CONFIG.SCORE_THRESHOLD) {
                console.warn('[Score] Insuficiente, redirecionando...');
                redirectTo('neutral.html');
                return;
            }
            modal.classList.add('active');
        });

        modalContinue.addEventListener('click', async function () {
            modalContinue.disabled = true;
            modalContinue.textContent = 'Verificando...';

            const success = await requestToken();
            if (success) {
                redirectTo('links.html');
            } else {
                alert('Falha na verificação. Tente novamente.');
                redirectTo('neutral.html');
            }
        });

        modal.addEventListener('click', function (e) {
            if (e.target === modal) {
                modal.classList.remove('active');
            }
        });
    }

    // ==================== PÁGINA DE LINKS ====================
    function setupLinksPage() {
        if (!isTokenValid()) return;

        startHeartbeat();
        updateResponsiveAssets();
        forceRevealIfNeeded(); // fallback de visibilidade

        document.addEventListener('click', function () {
            if (!isTokenValid()) clearSessionAndRedirect();
        });
    }

    // ==================== INICIALIZAÇÃO ====================
    function init() {
        console.log('[Luciana Lima ' + author + '] Iniciando...');

        if (document.getElementById('ctaButton') && document.getElementById('verifyModal')) {
            setupIndexPage();
        } else if (document.getElementById('links-main')) {
            setupLinksPage();
        }

        setupMagneticEffect();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
