const axios = require('axios');

const SCRAPER_URL = process.env.SCRAPER_URL || 'http://localhost:4000';
const PUBLIC_URL = process.env.PUBLIC_URL || 'https://api.devmatrixs.lat';

async function downloadInstagram(url) {
  let response;

  try {
    response = await axios.get(`${SCRAPER_URL}/instagram`, {
      params: { url },
      timeout: 60000,
    });
  } catch (err) {
    throw new Error('El motor ytdlp-server no respondio para Instagram. Verifica el puerto 4000.');
  }

  const data = response.data;
  if (!data?.success) throw new Error(data?.error || 'Error al procesar el contenido de Instagram.');

  const title = data.title || 'Contenido de Instagram';
  const thumbnail = data.thumb || '';
  const author = data.uploader || '';
  const formats = [];

  if (data.type === 'carousel' && Array.isArray(data.files)) {
    data.files.forEach((f, i) => {
      if (!f.file) return;
      formats.push({
        label: `${f.type === 'video' ? '🎬 Video' : '🖼️ Imagen'} ${i + 1}`,
        type: f.type === 'video' ? 'video' : 'image',
        url: `${PUBLIC_URL}${f.file}`,
        filename: f.filename || `media_${i + 1}`,
      });
    });
  } else if (data.file) {
    formats.push({
      label: data.type === 'video' ? 'MP4 Video' : 'Imagen',
      type: data.type === 'video' ? 'video' : 'image',
      url: `${PUBLIC_URL}${data.file}`,
      filename: data.filename || 'instagram_media',
    });
  }

  if (formats.length === 0) {
    throw new Error('No se encontraron archivos descargables en este post.');
  }

  return {
    success: true,
    platform: 'instagram',
    title,
    thumbnail,
    author,
    duration: data.duration || '',
    formats,
  };
}

module.exports = { downloadInstagram };
