/**
 * antiBot.js — Proteção total contra bots + ofuscação de conteúdo restrito
 * Versão 5.0.1 — Correção: não bloqueia mais navegadores modernos sem plugins.
 * Compatível com navegadores normais e in‑app (Instagram, Facebook, etc.)
 */
(function() {
    'use strict';

    const ua = navigator.userAgent.toLowerCase();

    const botPattern = /bot|crawler|spider|googlebot|bingbot|duckduckbot|slurp|yandex|baidu|facebot|twitterbot|rogerbot|linkedinbot|embedly|quora link preview|outbrain|pinterest|prerender|whatsapp|telegrambot|discordbot|slackbot|google-structured-data-testing-tool/i;
    const isBotUA = botPattern.test(ua);

    const isHeadless = /headless|phantom|selenium|webdriver|puppeteer|playwright/i.test(ua) ||
                       navigator.webdriver === true;

    // Removidas verificações que causavam falsos positivos em navegadores modernos (Chrome sem plugins, etc.)
    const isBot = isBotUA || isHeadless;

    if (isBot) {
        console.log('[AntiBot] Bot detectado – página ocultada.');
        if (document.body) {
            document.body.innerHTML = '';
            document.body.style.display = 'none';
        }
        document.documentElement.style.display = 'none';
        throw new Error('Acesso negado: bot detectado');
    }

    var blockStyle = document.getElementById('block-style');
    if (blockStyle) blockStyle.remove();

    var encDiv = document.getElementById('enc-data');
    if (encDiv) {
        var cipher = encDiv.getAttribute('data-cipher');
        if (cipher) {
            try {
                var decrypted = decryptContent(cipher, 'MinhaChaveSecreta2024!');
                var target = document.getElementById('adult-content');
                if (target) {
                    target.innerHTML = decrypted;
                    console.log('[AntiBot] Conteúdo restrito liberado apenas para humanos.');
                }
            } catch (e) {
                console.error('[AntiBot] Falha ao descriptografar conteúdo:', e);
            }
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

    var isInApp = /instagram|fban|fbav|threads/i.test(ua);
    if (isInApp) {
        console.log('[AntiBot] Navegador in‑app – acesso liberado sem bloqueio.');
    }
    console.log('[AntiBot] Verificação concluída – humano confirmado.');
})();/**
 * antiBot.js — Proteção total contra bots + ofuscação de conteúdo restrito
 * Versão 5.0.1 — Correção: não bloqueia mais navegadores modernos sem plugins.
 * Compatível com navegadores normais e in‑app (Instagram, Facebook, etc.)
 */
(function() {
    'use strict';

    const ua = navigator.userAgent.toLowerCase();

    const botPattern = /bot|crawler|spider|googlebot|bingbot|duckduckbot|slurp|yandex|baidu|facebot|twitterbot|rogerbot|linkedinbot|embedly|quora link preview|outbrain|pinterest|prerender|whatsapp|telegrambot|discordbot|slackbot|google-structured-data-testing-tool/i;
    const isBotUA = botPattern.test(ua);

    const isHeadless = /headless|phantom|selenium|webdriver|puppeteer|playwright/i.test(ua) ||
                       navigator.webdriver === true;

    // Removidas verificações que causavam falsos positivos em navegadores modernos (Chrome sem plugins, etc.)
    const isBot = isBotUA || isHeadless;

    if (isBot) {
        console.log('[AntiBot] Bot detectado – página ocultada.');
        if (document.body) {
            document.body.innerHTML = '';
            document.body.style.display = 'none';
        }
        document.documentElement.style.display = 'none';
        throw new Error('Acesso negado: bot detectado');
    }

    var blockStyle = document.getElementById('block-style');
    if (blockStyle) blockStyle.remove();

    var encDiv = document.getElementById('enc-data');
    if (encDiv) {
        var cipher = encDiv.getAttribute('data-cipher');
        if (cipher) {
            try {
                var decrypted = decryptContent(cipher, 'MinhaChaveSecreta2024!');
                var target = document.getElementById('adult-content');
                if (target) {
                    target.innerHTML = decrypted;
                    console.log('[AntiBot] Conteúdo restrito liberado apenas para humanos.');
                }
            } catch (e) {
                console.error('[AntiBot] Falha ao descriptografar conteúdo:', e);
            }
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

    var isInApp = /instagram|fban|fbav|threads/i.test(ua);
    if (isInApp) {
        console.log('[AntiBot] Navegador in‑app – acesso liberado sem bloqueio.');
    }
    console.log('[AntiBot] Verificação concluída – humano confirmado.');
})();
