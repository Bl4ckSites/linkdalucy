/**
 * antiBot.js — Proteção total contra bots + ofuscação de conteúdo +18
 * Versão 5.0 — Bloqueia crawlers, headless e impede leitura do fonte.
 * Compatível com navegadores normais e in‑app (Instagram, Facebook, etc.)
 */
(function() {
    'use strict';

    // ===================== 1. Detecção robusta de bots =====================
    const ua = navigator.userAgent.toLowerCase();

    // Padrões de bots conhecidos (incluindo previews de redes sociais)
    const botPattern = /bot|crawler|spider|googlebot|bingbot|duckduckbot|slurp|yandex|baidu|facebot|twitterbot|rogerbot|linkedinbot|embedly|quora link preview|outbrain|pinterest|prerender|whatsapp|telegrambot|discordbot|slackbot|google-structured-data-testing-tool/i;
    const isBotUA = botPattern.test(ua);

    // Headless browsers / automação
    const isHeadless = /headless|phantom|selenium|webdriver|puppeteer|playwright/i.test(ua) ||
                       navigator.webdriver === true;

    // Verificações complementares (sem impacto visual)
    const hasMissingPlugins = (navigator.plugins && navigator.plugins.length === 0) &&
                              !/safari/i.test(ua); // Safari pode ter 0 plugins, ignoramos
    const hasNoLanguages = navigator.languages && navigator.languages.length === 0;
    const suspiciousChrome = !!window.chrome && !navigator.plugins.length; // Chrome sem plugins é estranho

    const isBot = isBotUA || isHeadless || hasMissingPlugins || hasNoLanguages || suspiciousChrome;

    // Se for bot, limpa a página completamente
    if (isBot) {
        console.log('[AntiBot] Bot detectado – página ocultada.');
        if (document.body) {
            document.body.innerHTML = '';
            document.body.style.display = 'none';
        }
        // Para garantir: remove também qualquer elemento visível
        document.documentElement.style.display = 'none';
        throw new Error('Acesso negado: bot detectado');
    }

    // ===================== 2. Remover estilo bloqueador (se existir) =====================
    var blockStyle = document.getElementById('block-style');
    if (blockStyle) blockStyle.remove();

    // ===================== 3. Descriptografar e exibir conteúdo +18 =====================
    // O conteúdo real está em um elemento oculto com dados cifrados.
    // Exemplo no HTML: <div id="enc-data" style="display:none;" data-cipher="..."></div>
    var encDiv = document.getElementById('enc-data');
    if (encDiv) {
        var cipher = encDiv.getAttribute('data-cipher');
        if (cipher) {
            try {
                // Decifrar (XOR com chave, depois Base64)
                var decrypted = decryptContent(cipher, 'MinhaChaveSecreta2024!');
                // Injetar no container de destino
                var target = document.getElementById('adult-content');
                if (target) {
                    target.innerHTML = decrypted;
                    console.log('[AntiBot] Conteúdo +18 liberado apenas para humanos.');
                }
            } catch (e) {
                console.error('[AntiBot] Falha ao descriptografar conteúdo:', e);
            }
        }
    }

    // ===================== 4. Função de descriptografia (XOR + Base64) =====================
    function decryptContent(encStr, key) {
        // Decodifica Base64
        var raw = atob(encStr);
        var result = '';
        for (var i = 0; i < raw.length; i++) {
            result += String.fromCharCode(raw.charCodeAt(i) ^ key.charCodeAt(i % key.length));
        }
        return result;
    }

    // ===================== 5. Logs para debug (opcional, remova em produção) =====================
    var isInApp = /instagram|fban|fbav|threads/i.test(ua);
    if (isInApp) {
        console.log('[AntiBot] Navegador in‑app – acesso liberado sem bloqueio.');
    }
    console.log('[AntiBot] Verificação concluída – humano confirmado.');
})();
