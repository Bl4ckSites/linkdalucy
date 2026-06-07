/**
 * antiBot.js — Proteção total contra bots + permissão para indexadores
 * Versão 5.0.2 – Permite Googlebot, Bingbot e outros crawlers legítimos,
 * bloqueando apenas bots maliciosos, headless e scrapers.
 * Compatível com navegadores normais e in‑app (Instagram, Facebook, etc.)
 */
(function() {
    'use strict';

    const ua = navigator.userAgent.toLowerCase();

    // 1. Lista de bots de indexação CONFIÁVEIS – acesso permitido
    const allowedBots = /googlebot|bingbot|duckduckbot|slurp|yandex|baidu/i;
    if (allowedBots.test(ua)) {
        console.log('[AntiBot] Bot de indexação detectado – acesso permitido.');
        // Remove o bloqueio de visibilidade e deixa o conteúdo normal
        var blockStyle = document.getElementById('block-style');
        if (blockStyle) blockStyle.remove();
        return; // não executa o restante do script
    }

    // 2. Padrões de bots maliciosos e scrapers conhecidos
    const botPattern = /bot|crawler|spider|facebot|twitterbot|rogerbot|linkedinbot|embedly|quora link preview|outbrain|pinterest|prerender|whatsapp|telegrambot|discordbot|slackbot|google-structured-data-testing-tool/i;
    const isBotUA = botPattern.test(ua);

    // 3. Headless browsers / automação
    const isHeadless = /headless|phantom|selenium|webdriver|puppeteer|playwright/i.test(ua) ||
                       navigator.webdriver === true;

    // 4. Consideramos bot apenas se for malicioso OU headless
    const isBot = isBotUA || isHeadless;

    if (isBot) {
        console.log('[AntiBot] Bot malicioso detectado – página ocultada.');
        if (document.body) {
            document.body.innerHTML = '';
            document.body.style.display = 'none';
        }
        document.documentElement.style.display = 'none';
        throw new Error('Acesso negado: bot detectado');
    }

    // 5. Remove o estilo bloqueador para humanos
    var blockStyleEl = document.getElementById('block-style');
    if (blockStyleEl) blockStyleEl.remove();

    // 6. Descriptografar conteúdo restrito, se existir
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
 * antiBot.js — Proteção total contra bots + permissão para indexadores
 * Versão 5.0.2 – Permite Googlebot, Bingbot e outros crawlers legítimos,
 * bloqueando apenas bots maliciosos, headless e scrapers.
 * Compatível com navegadores normais e in‑app (Instagram, Facebook, etc.)
 */
(function() {
    'use strict';

    const ua = navigator.userAgent.toLowerCase();

    // 1. Lista de bots de indexação CONFIÁVEIS – acesso permitido
    const allowedBots = /googlebot|bingbot|duckduckbot|slurp|yandex|baidu/i;
    if (allowedBots.test(ua)) {
        console.log('[AntiBot] Bot de indexação detectado – acesso permitido.');
        // Remove o bloqueio de visibilidade e deixa o conteúdo normal
        var blockStyle = document.getElementById('block-style');
        if (blockStyle) blockStyle.remove();
        return; // não executa o restante do script
    }

    // 2. Padrões de bots maliciosos e scrapers conhecidos
    const botPattern = /bot|crawler|spider|facebot|twitterbot|rogerbot|linkedinbot|embedly|quora link preview|outbrain|pinterest|prerender|whatsapp|telegrambot|discordbot|slackbot|google-structured-data-testing-tool/i;
    const isBotUA = botPattern.test(ua);

    // 3. Headless browsers / automação
    const isHeadless = /headless|phantom|selenium|webdriver|puppeteer|playwright/i.test(ua) ||
                       navigator.webdriver === true;

    // 4. Consideramos bot apenas se for malicioso OU headless
    const isBot = isBotUA || isHeadless;

    if (isBot) {
        console.log('[AntiBot] Bot malicioso detectado – página ocultada.');
        if (document.body) {
            document.body.innerHTML = '';
            document.body.style.display = 'none';
        }
        document.documentElement.style.display = 'none';
        throw new Error('Acesso negado: bot detectado');
    }

    // 5. Remove o estilo bloqueador para humanos
    var blockStyleEl = document.getElementById('block-style');
    if (blockStyleEl) blockStyleEl.remove();

    // 6. Descriptografar conteúdo restrito, se existir
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
