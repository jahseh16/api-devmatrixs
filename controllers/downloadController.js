const { downloadTikTok } = require('../services/tiktok');
const { downloadYouTube } = require('../services/youtube');
const { downloadInstagram } = require('../services/instagram');

/**
 * Detecta la plataforma por la URL y llama al servicio correcto.
 * Respuesta estandarizada:
 * {
 *   success: true,
 *   platform: 'tiktok' | 'youtube' | 'instagram',
 *   title: string,
 *   thumbnail: string,
 *   formats: [ { label, type: 'video'|'audio', url } ]
 * }
 */
async function handleDownload(req, res) {
  const { url } = req.query;

  if (!url) {
    return res.status(400).json({ success: false, error: 'Param ?url= es requerido' });
  }

  try {
    let result;

    if (url.includes('tiktok.com') || url.includes('vm.tiktok.com') || url.includes('vt.tiktok.com')) {
      result = await downloadTikTok(url);
    } else if (url.includes('youtube.com') || url.includes('youtu.be')) {
      result = await downloadYouTube(url);
    } else if (url.includes('instagram.com')) {
      result = await downloadInstagram(url);
    } else {
      return res.status(400).json({ success: false, error: 'Plataforma no soportada. Usa TikTok, YouTube o Instagram.' });
    }

    return res.json(result);

  } catch (err) {
    console.error('❌ Error en handleDownload:', err.message);
    return res.status(500).json({ success: false, error: err.message || 'Error interno del servidor' });
  }
}

module.exports = { handleDownload };
