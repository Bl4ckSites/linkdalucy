/**
 * antiBot.js – Proteção total + permissão para indexadores + bloqueio de redes sociais
 * Versão 6.0 — Remove "no-js-hide" antes de tudo; bloqueia facebot, twitterbot, etc.
 */
(function() {
    'use strict';

    const docEl = document.documentElement;
    // Remove IMEDIATAMENTE a classe que esconde o body.
    // Assim, humanos nunca veem tela branca.
    docEl.classList.remove('no-js-hide');

    const ua = navigator.userAgent.toLowerCase();

    // 1. Bots de indexação CONFIÁVEIS — acesso livre
    if (/googlebot|bingbot|duckduckbot|slurp|yandex|baidu/i.test(ua)) {
        console.log('[AntiBot] Indexador permitido.');
        return;
    }

    // 2. Bots de redes sociais e scrapers — BLOQUEAR (inclusive facebot)
    const maliciousBots = /facebot|twitterbot|rogerbot|linkedinbot|embedly|quora link preview|outbrain|pinterest|prerender|whatsapp|telegrambot|discordbot|slackbot|google-structured-data-testing-tool/i;
    const isMaliciousUA = maliciousBots.test(ua);

    // 3. Headless / automação
    const isHeadless = /headless|phantom|selenium|webdriver|puppeteer|playwright/i.test(ua) ||
                       navigator.webdriver === true;

    // 4. Qualquer outro bot genérico (crawler/spider) também bloqueamos
    const genericBot = /bot|crawler|spider/i.test(ua);

    if (isMaliciousUA || isHeadless || genericBot) {
        console.log('[AntiBot] Bot malicioso ou de rede social bloqueado.');
        // Reaplica a classe de ocultação
        docEl.classList.add('no-js-hide');
        if (document.body) {
            document.body.innerHTML = '';
        }
        return;
    }

    // 5. Conteúdo restrito, se houver
    var encDiv = document.getElementById('enc-data');
    if (encDiv) {
        var cipher = encDiv.getAttribute('data-cipher');
        if (cipher) {
            try {
                var decrypted = decryptContent(cipher, 'MinhaChaveSecreta2024!');
                var target = document.getElementById('adult-content');
                if (target) {
                    target.innerHTML = decrypted;
                }
            } catch (e) {}
        }
    }

    function decryptContent(encStr, key) {
        var raw = atob(encStr);
        var result = '';
        for (var i = 0; i < raw.length; i++) {
            result += String.fromCharCode(raw.charCodeAt(i) ^ key.charCodeAt(i % key.length));
        }
        return result;
    }

    console.log('[AntiBot] Humano confirmado.');
})();
