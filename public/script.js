// Mesma regra do backend: só http/https, com host válido
function isValidUrl(value) {
    try {
        const parsed = new URL(value);
        if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return false;
        // exige domínio com ponto (ex: site.com) ou localhost
        return parsed.hostname === 'localhost' || parsed.hostname.includes('.');
    } catch {
        return false;
    }
}

function setError(input, errorEl, message) {
    errorEl.textContent = message;
    input.classList.toggle('invalid', Boolean(message));
}

function formatDate(value) {
    if (!value) return 'Nunca';
    // SQLite CURRENT_TIMESTAMP vem como "YYYY-MM-DD HH:MM:SS" em UTC
    const iso = value.includes('T') ? value : value.replace(' ', 'T') + 'Z';
    return new Date(iso).toLocaleString('pt-BR');
}

// ---------- Encurtar ----------
const shortenForm = document.getElementById('shorten-form');
const urlInput = document.getElementById('url');
const urlError = document.getElementById('url-error');
const expiresInput = document.getElementById('expires');
const expiresError = document.getElementById('expires-error');
const shortenBtn = document.getElementById('shorten-btn');
const result = document.getElementById('result');
const shortUrlLink = document.getElementById('short-url');
const expiresInfo = document.getElementById('expires-info');
const copyBtn = document.getElementById('copy-btn');

urlInput.addEventListener('input', () => {
    const value = urlInput.value.trim();
    setError(urlInput, urlError, value && !isValidUrl(value)
        ? 'URL inválida. Use http:// ou https:// (ex: https://exemplo.com)'
        : '');
});

shortenForm.addEventListener('submit', async (event) => {
    event.preventDefault();

    const url = urlInput.value.trim();
    const expires = expiresInput.value.trim();
    let valid = true;

    if (!url) {
        setError(urlInput, urlError, 'Informe uma URL.');
        valid = false;
    } else if (!isValidUrl(url)) {
        setError(urlInput, urlError, 'URL inválida. Use http:// ou https:// (ex: https://exemplo.com)');
        valid = false;
    } else {
        setError(urlInput, urlError, '');
    }

    if (expires && (!Number.isInteger(Number(expires)) || Number(expires) < 1)) {
        setError(expiresInput, expiresError, 'Informe um número inteiro maior que 0.');
        valid = false;
    } else {
        setError(expiresInput, expiresError, '');
    }

    if (!valid) return;

    shortenBtn.disabled = true;
    shortenBtn.textContent = 'Encurtando...';
    result.classList.add('hidden');

    try {
        const body = { url };
        if (expires) body.expiresInDays = Number(expires);

        const response = await fetch('/shorten', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
        });
        const data = await response.json();

        if (!response.ok) {
            setError(urlInput, urlError, data.error || 'Erro ao encurtar URL.');
            return;
        }

        shortUrlLink.href = data.shortUrl;
        shortUrlLink.textContent = data.shortUrl;
        expiresInfo.textContent = data.expiresAt
            ? `Expira em: ${formatDate(data.expiresAt)}`
            : 'Sem data de expiração.';
        copyBtn.textContent = 'Copiar';
        result.classList.remove('hidden');
        shortenForm.reset();
    } catch {
        setError(urlInput, urlError, 'Falha de conexão com o servidor.');
    } finally {
        shortenBtn.disabled = false;
        shortenBtn.textContent = 'Encurtar';
    }
});

// Fallback para contextos não seguros (http via IP), onde navigator.clipboard não existe
function copyWithTextarea(text) {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.setAttribute('readonly', '');
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    textarea.setSelectionRange(0, text.length); // iOS
    let ok = false;
    try {
        ok = document.execCommand('copy');
    } catch {
        ok = false;
    }
    document.body.removeChild(textarea);
    return ok;
}

async function copyText(text) {
    if (navigator.clipboard && window.isSecureContext) {
        try {
            await navigator.clipboard.writeText(text);
            return true;
        } catch {
            // tenta o fallback abaixo
        }
    }
    return copyWithTextarea(text);
}

copyBtn.addEventListener('click', async () => {
    const text = shortUrlLink.href;
    if (await copyText(text)) {
        copyBtn.textContent = 'Copiado!';
    } else {
        // Último recurso: deixa o usuário copiar manualmente
        window.prompt('Copie o link (Ctrl+C):', text);
        copyBtn.textContent = 'Copiar';
    }
    setTimeout(() => { copyBtn.textContent = 'Copiar'; }, 2000);
});

// ---------- Estatísticas ----------
const statusForm = document.getElementById('status-form');
const codeInput = document.getElementById('code');
const codeError = document.getElementById('code-error');
const statusResult = document.getElementById('status-result');

// Aceita o código puro ou o link curto completo
function extractCode(value) {
    if (isValidUrl(value)) {
        return new URL(value).pathname.replace(/^\/+|\/+$/g, '');
    }
    return value;
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text ?? '';
    return div.innerHTML;
}

statusForm.addEventListener('submit', async (event) => {
    event.preventDefault();

    const code = extractCode(codeInput.value.trim());

    if (!/^[A-Za-z0-9_-]+$/.test(code)) {
        setError(codeInput, codeError, 'Código inválido.');
        return;
    }
    setError(codeInput, codeError, '');
    statusResult.classList.remove('error-box');

    try {
        const response = await fetch(`/status/${encodeURIComponent(code)}`);
        const data = await response.json();

        if (!response.ok) {
            statusResult.classList.add('error-box');
            statusResult.textContent = data.error || 'Erro ao consultar.';
        } else {
            const clicks = data.recentClicks.length
                ? `<ul>${data.recentClicks.map(c =>
                    `<li>${escapeHtml(formatDate(c.clicked_at))} — ${escapeHtml(c.user_agent)}</li>`
                  ).join('')}</ul>`
                : '<p class="muted">Nenhum clique ainda.</p>';

            statusResult.innerHTML = `
                <p><strong>Original:</strong> ${escapeHtml(data.originalUrl)}</p>
                <p><strong>Criado em:</strong> ${escapeHtml(formatDate(data.createdAt))}</p>
                <p><strong>Expira em:</strong> ${escapeHtml(formatDate(data.expiresAt))}</p>
                <p><strong>Total de cliques:</strong> ${Number(data.totalClicks)}</p>
                <p><strong>Cliques recentes:</strong></p>
                ${clicks}
            `;
        }
    } catch {
        statusResult.classList.add('error-box');
        statusResult.textContent = 'Falha de conexão com o servidor.';
    }

    statusResult.classList.remove('hidden');
});
