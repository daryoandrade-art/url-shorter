import { nanoid } from 'nanoid';
import db from '../database/db.js';

function isValidUrl(url) {
    try{
        const parsed = new URL(url);
        return parsed.protocol === 'http:' || parsed.protocol === 'https:';
    } catch {
        return false;
    }
}

export const shortenUrl = (req, res) => {
    const { url, expiresInDays } = req.body;

    if (!url || !isValidUrl(url)) {
        return res.status(400).json({ error: 'URL invalida'});
    }
    const shortCode = nanoid(6); //gera codigo de 6 caracteres
    let expiresAt = null;

    if (expiresInDays && Number(expiresInDays) > 0) {
        const date = new Date();
        date.setDate(date.getDate() + Number(expiresInDays));
        expiresAt = date.toISOString();
    }

    try {
        const stmt = db.prepare(`
            INSERT INTO urls (short_code, original_url, expires_at)
            VALUES (?,?,?)`)
        stmt.run(shortCode, url, expiresAt);

        const shortUrl = `${req.protocol}://${req.get('host')}/${shortCode}`;

        return res.status(201).json({
            shortCode,
            shortUrl,
            originalUrl: url,
            expiresAt
        });
    } catch (err) {
        return res.status(500).json({error: 'Erro ao encurtar URL'});
    }
};

export const redirectUrl = (req, res) => {
  const { code } = req.params;

  const urlRecord = db.prepare('SELECT * FROM urls WHERE short_code = ?').get(code);

  if (!urlRecord) {
    return res.status(404).json({ error: 'Link não encontrado.' });
  }

  // Verifica se o link expirou
  if (urlRecord.expires_at && new Date(urlRecord.expires_at) < new Date()) {
    return res.status(410).json({ error: 'Este link encurtado expirou.' });
  }

  // Registra o clique na tabela de analytics
  const userAgent = req.get('User-Agent') || 'Desconhecido';
  db.prepare('INSERT INTO clicks (url_id, user_agent) VALUES (?, ?)').run(urlRecord.id, userAgent);

  // Redireciona para o destino original
  return res.redirect(302, urlRecord.original_url);
};

export const getUrlStatus = (req, res) => {
  const { code } = req.params;

  const urlRecord = db.prepare('SELECT * FROM urls WHERE short_code = ?').get(code);

  if (!urlRecord) {
    return res.status(404).json({ error: 'Link não encontrado.' });
  }

  const totalClicks = db.prepare('SELECT COUNT(*) as count FROM clicks WHERE url_id = ?').get(urlRecord.id);
  const recentClicks = db.prepare(`
    SELECT clicked_at, user_agent 
    FROM clicks 
    WHERE url_id = ? 
    ORDER BY clicked_at DESC 
    LIMIT 10
  `).all(urlRecord.id);

  return res.json({
    shortCode: urlRecord.short_code,
    originalUrl: urlRecord.original_url,
    createdAt: urlRecord.created_at,
    expiresAt: urlRecord.expires_at,
    totalClicks: totalClicks.count,
    recentClicks
  });
};