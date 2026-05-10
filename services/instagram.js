const axios = require('axios');

const SCRAPER_URL = process.env.SCRAPER_URL || 'http://localhost:4000';

/**
 * Llama al motor ytdlp-server (puerto 4000) para Instagram.
 */
async function downloadInstagram(url) {
  let response;

  try {
    response = await axios.get(`${SCRAPER_URL}/instagram`, {
      params: { url },
      timeout: 30000,
    });
  } catch (err) {
    throw new Error('El motor ytdlp-server no respondió para Instagram. Verifica el puerto 4000.');
  }

  const data = response.data;

  if (!data) throw new Error('Respuesta vacía del motor de Instagram.');

  const downloadUrl = data.url || data.download_url || data.link || null;

  if (!downloadUrl) {
    throw new Error('El motor no devolvió una URL de descarga para Instagram.');
  }

  return {
    success: true,
    platform: 'instagram',
    title: data.title || 'Video de Instagram',
    thumbnail: data.thumbnail || '',
    author: data.author || '',
    formats: [
      {
        label: 'MP4 Video',
        type: 'video',
        url: downloadUrl,
      },
    ],
  };
}

module.exports = { downloadInstagram };
