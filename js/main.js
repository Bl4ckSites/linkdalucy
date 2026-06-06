/**
 * Luciana Lima – Script principal com proteção multicamadas
 * Criado por: dense_66
 * Versão: 2.0.4 – Logs detalhados + correção de vídeos
 */

(function () {
    'use strict';

    // ==================== CONFIGURAÇÃO ====================
    const CONFIG = {
        BACKEND_URL: 'https://linklucy.onrender.com',  // 👈 ajuste para a URL real do Render
        SCORE_THRESHOLD: 3,
        TOKEN_EXPIRY_SECONDS: 30,
        HEARTBEAT_INTERVAL: 20000,
        MIN_TIME_ON_PAGE: 2000,
    };

    const author = 'dense_66';
    const logPrefix = `[Luciana Lima ${author}]`;

    function log(message, data = null) {
        if (data) {
            console.log(`${logPrefix} ${message}`, data);
        } else {
            console.log(`${logPrefix} ${message}`);
        }
    }

    function warn(message, data = null) {
        if (data) {
            console.warn(`${logPrefix} ${message}`, data);
        } else {
            console.warn(`${logPrefix} ${message}`);
        }
    }

    function error(message, data = null) {
        if (data) {
            console.error(`${logPrefix} ${message}`, data);
        } else {
            console.error(`${logPrefix} ${message}`);
        }
    }

    // ==================== RELATÓRIO GLOBAL DE ERROS ====================
    window.addEventListener('error', function (event) {
        error(`Erro não capturado: ${event.message}`, {
            arquivo: event.filename,
            linha: event.lineno,
            coluna: event.colno,
            stack: event.error ? event.error.stack : 'N/A'
        });
    });

    window.addEventListener('unhandledrejection', function (event) {
        error(`Rejeição não tratada: ${event.reason}`, {
            stack: event.reason && event.reason.stack ? event.reason.stack : 'N/A'
        });
    });

    // ==================== FERRAMENTAS ====================
    function redirectTo(url) {
        log(`Redirecionando para: ${url}`);
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
            log(`Nova sessão gerada: ${id}`);
        }
        return id;
    }

    // ==================== CAMADA 3: DETECÇÃO DE AUTOMAÇÃO ====================
    function detectAutomation() {
        log('Iniciando detecção de automação...');
        const checks = {
            webdriver: navigator.webdriver,
            selenium_unwrapped: !!document.__selenium_unwrapped,
            chromeUndefined: window.chrome === undefined && navigator.userAgent.includes('Chrome'),
            headlessZero: window.outerWidth - window.innerWidth === 0 && window.outerWidth > 0 && navigator.languages.length === 0,
            requestAnimationFrame: typeof requestAnimationFrame === 'undefined'
        };
        log('Resultados das verificações de automação:', checks);

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
        log('Iniciando rastreamento comportamental...');
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
        log(`Pontuação comportamental: ${behavior.score}`);
        return behavior.score;
    }

    // ==================== CAMADA 4: HONEYPOT ====================
    function setupHoneypot() {
        log('Configurando honeypot...');
        const hpField = document.getElementById('hp-field');
        const hpLink = document.getElementById('hp-link');

        if (hpField) {
            hpField.addEventListener('focus', () => {
                warn('Honeypot acionado: campo oculto recebeu foco');
                redirectTo('neutral.html');
            });
            hpField.addEventListener('input', () => {
                warn('Honeypot acionado: campo oculto recebeu entrada');
                redirectTo('neutral.html');
            });
        }
        if (hpLink) {
            hpLink.addEventListener('click', (e) => {
                e.preventDefault();
                warn('Honeypot acionado: link oculto clicado');
                redirectTo('neutral.html');
            });
        }
    }

    // ==================== CAMADA 6 & 10: FINGERPRINT ====================
    function getFingerprint() {
        log('Coletando fingerprint...');
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

        const fp = {
            resolution: screen.width + 'x' + screen.height,
            colorDepth: screen.colorDepth,
            language: navigator.language,
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            platform: navigator.platform,
            hardwareConcurrency: navigator.hardwareConcurrency || 'unknown',
            canvasHash: hash,
        };
        log('Fingerprint coletado:', fp);
        return fp;
    }

    // ==================== CAMADA 6: OBTENÇÃO DE JWT ====================
    async function requestToken() {
        log('Solicitando token ao backend...');
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
                error(`Falha ao obter token (status ${response.status}): ${errorText}`);
                return false;
            }

            const data = await response.json();
            if (data.token) {
                sessionStorage.setItem('jwt', data.token);
                sessionStorage.setItem('jwt_exp', data.expires_at);
                sessionStorage.setItem('jwt_fp', JSON.stringify(fingerprint));
                log('Token recebido e armazenado.');
                return true;
            } else {
                warn('Resposta do backend não continha token.');
                return false;
            }
        } catch (e) {
            error(`Exceção ao solicitar token: ${e.message}`);
            return false;
        }
    }

    // ==================== CAMADA 7 & 8: VALIDAÇÃO DO TOKEN ====================
    function isTokenValid() {
        const token = sessionStorage.getItem('jwt');
        const exp = sessionStorage.getItem('jwt_exp');
        const fpStored = sessionStorage.getItem('jwt_fp');

        if (!token || !exp) {
            warn('Token ou expiração ausentes no sessionStorage.');
            return false;
        }

        if (Date.now() > parseInt(exp) * 1000) {
            warn('Token expirado.');
            clearSessionAndRedirect();
            return false;
        }

        if (fpStored) {
            const currentFp = JSON.stringify(getFingerprint());
            if (currentFp !== fpStored) {
                warn('Fingerprint alterado! Invalidando sessão.');
                clearSessionAndRedirect();
                return false;
            }
        }

        log('Token válido.');
        return true;
    }

    function clearSessionAndRedirect() {
        log('Limpando sessão e redirecionando para neutral.html');
        sessionStorage.removeItem('jwt');
        sessionStorage.removeItem('jwt_exp');
        sessionStorage.removeItem('jwt_fp');
        redirectTo('neutral.html');
    }

    // ==================== CAMADA 9: HEARTBEAT COM RESET DO CONTADOR ====================
    let countdownInterval = null;
    let timeLeft = CONFIG.TOKEN_EXPIRY_SECONDS;

    function startHeartbeat() {
        log(`Iniciando heartbeat (intervalo: ${CONFIG.HEARTBEAT_INTERVAL}ms)...`);
        countdownInterval = setInterval(() => {
            timeLeft--;
            if (timeLeft <= 0) {
                warn('Contador regressivo zerado. Redirecionando.');
                clearInterval(countdownInterval);
                clearSessionAndRedirect();
            }
        }, 1000);

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
                    timeLeft = CONFIG.TOKEN_EXPIRY_SECONDS;
                    log('Heartbeat renovado com sucesso.');
                } else {
                    warn('Heartbeat falhou. Redirecionando.');
                    clearSessionAndRedirect();
                }
            } catch (e) {
                error(`Erro no heartbeat: ${e.message}`);
                // Não redireciona imediatamente para evitar falsos positivos de rede
            }
        }, CONFIG.HEARTBEAT_INTERVAL);
    }

    // ==================== EFEITO MAGNÉTICO (DESKTOP) ====================
    function setupMagneticEffect() {
        if (window.matchMedia('(max-width: 1024px)').matches) {
            log('Efeito magnético desativado (dispositivo móvel ou tablet).');
            return;
        }
        const cards = document.querySelectorAll('.image-button');
        log(`Aplicando efeito magnético em ${cards.length} cards.`);
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
        log(`Assets responsivos atualizados para largura ${width}px.`);

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

    // ==================== VÍDEOS DE FUNDO (CORREÇÃO) ====================
    function setupVideoBackground() {
        const videos = document.querySelectorAll('.video-background video');
        if (videos.length === 0) {
            warn('Nenhum vídeo de fundo encontrado!');
            return;
        }
        log(`Configurando ${videos.length} vídeo(s) de fundo...`);
        videos.forEach((video, index) => {
            video.removeAttribute('controls');
            video.setAttribute('disablePictureInPicture', '');
            video.setAttribute('playsinline', '');
            video.muted = true;
            video.loop = true;

            function markLoaded() {
                video.classList.add('loaded');
                video.style.opacity = '1';
                log(`Vídeo ${index+1} marcado como carregado.`);
            }

            if (video.readyState >= 2) {
                markLoaded();
            } else {
                video.addEventListener('loadeddata', markLoaded, { once: true });
                video.addEventListener('canplay', markLoaded, { once: true });
                // Fallback: se após 3 segundos o evento não disparou, forçamos a visibilidade
                setTimeout(() => {
                    if (!video.classList.contains('loaded')) {
                        warn(`Vídeo ${index+1} não carregou a tempo; forçando visibilidade.`);
                        markLoaded();
                    }
                }, 3000);
            }
        });
    }

    // ==================== PÁGINA INICIAL ====================
    function setupIndexPage() {
        log('Configurando página inicial...');
        const ctaButton = document.getElementById('ctaButton');
        const modal = document.getElementById('verifyModal');
        const modalContinue = document.getElementById('modalContinue');

        if (!ctaButton || !modal || !modalContinue) {
            error('Elementos essenciais não encontrados no index.html');
            return;
        }

        if (detectAutomation()) {
            warn('Automação detectada na página inicial.');
            redirectTo('neutral.html');
            return;
        }

        initBehaviorTracking();
        setupHoneypot();

        ctaButton.addEventListener('click', function () {
            const score = getBehaviorScore();
            if (score < CONFIG.SCORE_THRESHOLD) {
                warn(`Pontuação insuficiente (${score}/${CONFIG.SCORE_THRESHOLD}). Redirecionando.`);
                redirectTo('neutral.html');
                return;
            }
            log('Pontuação suficiente, exibindo modal.');
            modal.classList.add('active');
        });

        modalContinue.addEventListener('click', async function () {
            log('Botão "Continuar" clicado.');
            modalContinue.disabled = true;
            modalContinue.textContent = 'Verificando...';

            const success = await requestToken();
            if (success) {
                log('Token obtido com sucesso, indo para links.html.');
                redirectTo('links.html');
            } else {
                alert('Falha na verificação. Tente novamente.');
                redirectTo('neutral.html');
            }
        });

        modal.addEventListener('click', function (e) {
            if (e.target === modal) {
                log('Fechando modal.');
                modal.classList.remove('active');
            }
        });
    }

    // ==================== PÁGINA DE LINKS ====================
    function setupLinksPage() {
        log('Configurando página de links...');
        if (!isTokenValid()) {
            warn('Token inválido ao carregar links.html.');
            return;
        }

        startHeartbeat();
        updateResponsiveAssets();

        document.addEventListener('click', function () {
            if (!isTokenValid()) clearSessionAndRedirect();
        });
    }

    // ==================== INICIALIZAÇÃO ====================
    function init() {
        log('Inicializando aplicação...');

        if (document.getElementById('ctaButton') && document.getElementById('verifyModal')) {
            setupIndexPage();
        } else if (document.getElementById('links-main')) {
            setupLinksPage();
            setupVideoBackground();   // CORREÇÃO: chamada garantida na página de links
        }

        setupMagneticEffect();
        log('Inicialização concluída.');
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
})();
