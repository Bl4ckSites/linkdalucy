/**
 * antiBot.js – Proteção contra bots e crawlers (sem bloquear navegadores in‑app)
 * Versão 4.0.1 – Corrigida remoção do estilo de bloqueio
 */
(function () {
    'use strict';

    const ua = navigator.userAgent.toLowerCase();

    // 1. Detecta bots e headless reais
    const isBot = /bot|crawler|spider|googlebot|bingbot|duckduckbot|slurp|yandex|baidu|facebot|twitterbot|rogerbot|linkedinbot|embedly|quora link preview|outbrain|pinterest|prerender|whatsapp|telegrambot|discordbot/i.test(ua);

    const isHeadless = /headless|phantom|selenium|webdriver|puppeteer|playwright/i.test(ua) || navigator.webdriver === true;

    // 2. Se for bot/headless, bloqueia e não remove o estilo (continua oculto)
    if (isBot || isHeadless) {
        console.log('[AntiBot] Bot/Headless detectado – conteúdo ocultado.');
        // Não remove o block-style, mantendo a página escondida
        if (document.body) {
            document.body.innerHTML = '';
            document.body.style.visibility = 'hidden';
        }
        throw new Error('Acesso negado: bot detectado');
    }

    // 3. Se for humano (navegador normal ou in‑app), remove o estilo bloqueador
    var blockStyle = document.getElementById('block-style');
    if (blockStyle) {
        blockStyle.remove();
        console.log('[AntiBot] Estilo de bloqueio removido – conteúdo liberado.');
    }

    // 4. Aviso amigável para navegadores in‑app (opcional, não bloqueia)
    const isInApp = /instagram|fban|fbav|threads/i.test(ua);
    if (isInApp) {
        console.log('[AntiBot] Navegador in‑app detectado – exibindo aviso.');
        document.addEventListener('DOMContentLoaded', function () {
            const banner = document.createElement('div');
            banner.id = 'inapp-banner';
            banner.style.cssText = 'background:#ff7b00;color:#fff;padding:10px;text-align:center;font-family:sans-serif;position:sticky;top:0;z-index:9999;font-size:14px;';
            banner.innerHTML = '📱 Para uma experiência ainda melhor, <a href="#" id="open-external" style="color:#fff;text-decoration:underline;font-weight:bold;">abra no navegador</a>.';
            document.body.prepend(banner);

            document.getElementById('open-external').addEventListener('click', function (e) {
                e.preventDefault();
                window.open(window.location.href, '_blank', 'noopener,noreferrer');
            });
        });
    }

    console.log('[AntiBot] Usuário legítimo – página liberada.');
})();
