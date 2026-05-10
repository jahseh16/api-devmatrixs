const axios = require('axios');

const SCRAPER_URL = process.env.SCRAPER_URL || 'http://localhost:4000';

/**
 * Llama al motor ytdlp-server (puerto 4000) para YouTube.
 * Espera que el motor responda con { title, thumbnail, url_mp4, url_mp3 }
 * o similar — ajusta los campos según tu motor.
 */
async function downloadYouTube(url) {
  let mp4Res, mp3Res;

  try {
    // Intentamos obtener MP4 y MP3 en paralelo
    [mp4Res, mp3Res] = await Promise.allSettled([
      axios.get(`${SCRAPER_URL}/ytmp4`, { params: { url }, timeout: 30000 }),
      axios.get(`${SCRAPER_URL}/ytmp3`, { params: { url }, timeout: 30000 }),
    ]);
  } catch (err) {
    throw new Error('El motor ytdlp-server no respondió. Verifica el puerto 4000.');
  }

  const mp4Data = mp4Res.status === 'fulfilled' ? mp4Res.value.data : null;
  const mp3Data = mp3Res.status === 'fulfilled' ? mp3Res.value.data : null;

  if (!mp4Data && !mp3Data) {
    throw new Error('No se pudo obtener el video de YouTube.');
  }

  const title = mp4Data?.title || mp3Data?.title || 'Video de YouTube';
  const thumbnail = mp4Data?.thumbnail || mp3Data?.thumbnail || '';

  const formats = [];

  if (mp4Data?.url || mp4Data?.download_url || mp4Data?.link) {
    formats.push({
      label: 'MP4 Video',
      type: 'video',
      url: mp4Data.url || mp4Data.download_url || mp4Data.link,
    });
  }

  if (mp3Data?.url || mp3Data?.download_url || mp3Data?.link) {
    formats.push({
      label: 'MP3 Audio',
      type: 'audio',
      url: mp3Data.url || mp3Data.download_url || mp3Data.link,
    });
  }

  if (formats.length === 0) {
    throw new Error('El motor no devolvió URLs de descarga válidas.');
  }

  return {
    success: true,
    platform: 'youtube',
    title,
    thumbnail,
    author: mp4Data?.author || '',
    formats,
  };
}

module.exports = { downloadYouTube };
