/**
 * antiBot.js – Proteção contra bots maliciosos e de redes sociais.
 * Versão 7.0 – NÃO remove conteúdo de humanos nem bloqueia indexadores.
 */
(function() {
    'use strict';

    // O conteúdo já está visível graças ao script inline no HTML.
    const ua = navigator.userAgent.toLowerCase();

    // 1. Indexadores confiáveis – acesso livre
    if (/googlebot|bingbot|duckduckbot|slurp|yandex|baidu/i.test(ua)) {
        console.log('[AntiBot] Indexador permitido.');
        return;
    }

    // 2. Bots de redes sociais e scrapers maliciosos
    const maliciousBots = /facebot|twitterbot|rogerbot|linkedinbot|embedly|quora link preview|outbrain|pinterest|prerender|whatsapp|telegrambot|discordbot|slackbot|google-structured-data-testing-tool/i;
    const isMaliciousUA = maliciousBots.test(ua);

    // 3. Headless / automação
    const isHeadless = /headless|phantom|selenium|webdriver|puppeteer|playwright/i.test(ua) ||
                       navigator.webdriver === true;

    if (isMaliciousUA || isHeadless) {
        console.log('[AntiBot] Bot malicioso ou de rede social bloqueado.');
        // Apenas re‑aplica a classe de ocultação, sem limpar o body
        document.documentElement.classList.add('no-js-hide');
        return;
    }

    // 4. Conteúdo restrito, se existir
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
