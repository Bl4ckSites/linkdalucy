(function () {
    'use strict';

    var ua = navigator.userAgent.toLowerCase();
    var isInApp = /instagram|fban|fbav|threads/i.test(ua);
    var isBot = /bot|crawler|spider|googlebot|bingbot|duckduckbot|slurp|yandex|baidu|facebot|twitterbot|rogerbot|linkedinbot|embedly|quora link preview|outbrain|pinterest|prerender|whatsapp|telegrambot|discordbot/i.test(ua);
    var isHeadless = /headless|phantom|selenium|webdriver|puppeteer|playwright/i.test(ua) || navigator.webdriver === true;

    if (isBot || isHeadless) {
        console.log('[AntiBot] Bot/Headless detectado – conteúdo ocultado.');
        return;
    }

    if (isInApp) {
        function showWarning() {
            var blockStyle = document.getElementById('block-style');
            if (blockStyle) blockStyle.remove();

            var html = '' +
            '<div style="display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:100vh;padding:30px;text-align:center;font-family:\'Montserrat\',sans-serif;background:#1a1a1a;color:#f5f5f5;">' +
                '<div style="max-width:480px;background:#2a2a2a;border-radius:24px;padding:40px 30px;box-shadow:0 12px 40px rgba(0,0,0,0.4);">' +
                    '<div style="font-size:60px;margin-bottom:20px;">🔐</div>' +
                    '<h2 style="font-size:24px;font-weight:700;margin-bottom:12px;color:#ff7b00;">ABRA NO NAVEGADOR</h2>' +
                    '<p style="font-size:15px;line-height:1.6;margin-bottom:28px;color:#ccc;">Você está no navegador embutido do app.<br>Para acessar o conteúdo, abra no seu navegador externo (Chrome, Safari, etc).</p>' +
                    '<button id="openExternalBtn" style="display:block;width:100%;padding:16px;font-size:16px;font-weight:700;letter-spacing:3px;text-transform:uppercase;color:#fff;background:#1f78d1;border:none;border-radius:50px;cursor:pointer;box-shadow:0 8px 24px rgba(31,120,209,0.35);margin-bottom:12px;">ABRIR NO NAVEGADOR</button>' +
                    '<button id="copyLinkBtn" style="display:block;width:100%;padding:14px;font-size:14px;font-weight:600;letter-spacing:2px;text-transform:uppercase;color:#ccc;background:transparent;border:2px solid #555;border-radius:50px;cursor:pointer;">COPIAR LINK</button>' +
                    '<p style="font-size:11px;color:#777;margin-top:16px;">Se o botão não funcionar, copie o link e cole no navegador</p>' +
                '</div>' +
            '</div>';

            document.body.innerHTML = html;
            document.body.style.visibility = 'visible';

            document.getElementById('openExternalBtn').addEventListener('click', function () {
                var opened = window.open(window.location.href, '_blank', 'noopener,noreferrer');
                if (!opened) alert('Não foi possível abrir automaticamente. Copie o link.');
            });

            document.getElementById('copyLinkBtn').addEventListener('click', function () {
                var url = window.location.href;
                var btn = this;
                if (navigator.clipboard && navigator.clipboard.writeText) {
                    navigator.clipboard.writeText(url).then(function () {
                        btn.textContent = 'LINK COPIADO!';
                        btn.style.background = '#2ecc71';
                        btn.style.color = '#fff';
                        btn.style.borderColor = '#2ecc71';
                        setTimeout(function () {
                            btn.textContent = 'COPIAR LINK';
                            btn.style.background = 'transparent';
                            btn.style.color = '#ccc';
                            btn.style.borderColor = '#555';
                        }, 2000);
                    }).catch(function () { fallbackCopy(url); });
                } else {
                    fallbackCopy(url);
                }
            });

            function fallbackCopy(text) {
                var textarea = document.createElement('textarea');
                textarea.value = text;
                textarea.style.position = 'fixed';
                textarea.style.opacity = '0';
                document.body.appendChild(textarea);
                textarea.select();
                try { document.execCommand('copy'); alert('Link copiado!'); } catch (e) { prompt('Copie o link:', text); }
                document.body.removeChild(textarea);
            }
        }

        if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', showWarning);
        else showWarning();
        console.log('[AntiBot] Navegador in-app detectado – aviso exibido.');
        return;
    }

    var blockStyle = document.getElementById('block-style');
    if (blockStyle) blockStyle.remove();
    console.log('[AntiBot] Usuário legítimo – página liberada.');
})();
