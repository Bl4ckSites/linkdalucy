/**
 * antiBot.js – Proteção contra bots e crawlers (sem bloquear navegadores in‑app)
 * Versão 4.0.0 – Compatível com Instagram, Facebook, WebViews
 */
(function () {
    'use strict';

    const ua = navigator.userAgent.toLowerCase();

    // 1. Detecta apenas bots e headless reais (não navegadores embutidos)
    const isBot = /bot|crawler|spider|googlebot|bingbot|duckduckbot|slurp|yandex|baidu|facebot|twitterbot|rogerbot|linkedinbot|embedly|quora link preview|outbrain|pinterest|prerender|whatsapp|telegrambot|discordbot/i.test(ua);

    const isHeadless = /headless|phantom|selenium|webdriver|puppeteer|playwright/i.test(ua) || navigator.webdriver === true;

    // 2. Se for bot ou headless, bloqueia completamente (conteúdo oculto)
    if (isBot || isHeadless) {
        console.log('[AntiBot] Bot/Headless detectado – conteúdo ocultado.');
        if (document.body) {
            document.body.innerHTML = '';
            document.body.style.visibility = 'hidden';
        }
        // Impede que main.js ou qualquer outro script seja executado
        throw new Error('Acesso negado: bot detectado');
    }

    // 3. Navegadores in‑app NÃO são mais bloqueados
    // Apenas exibe um aviso sutil no topo, sem impedir o acesso (opcional)
    const isInApp = /instagram|fban|fbav|threads/i.test(ua);
    if (isInApp) {
        console.log('[AntiBot] Navegador in‑app detectado – exibindo aviso amigável.');
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

    // 4. Usuário legítimo (navegador normal ou in‑app) – conteúdo liberado
    console.log('[AntiBot] Usuário legítimo – página liberada.');
})();
