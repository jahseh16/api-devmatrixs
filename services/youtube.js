const axios = require('axios');

const SCRAPER_URL = process.env.SCRAPER_URL || 'http://localhost:4000';
// URL publica que el navegador del usuario puede acceder
const PUBLIC_URL = process.env.PUBLIC_URL || 'https://api.devmatrixs.lat';

async function downloadYouTube(url) {
  const [mp4Res, mp3Res] = await Promise.allSettled([
    axios.get(`${SCRAPER_URL}/ytmp4`, { params: { url }, timeout: 120000 }),
    axios.get(`${SCRAPER_URL}/ytmp3`, { params: { url }, timeout: 120000 }),
  ]);

  const mp4Data = mp4Res.status === 'fulfilled' ? mp4Res.value.data : null;
  const mp3Data = mp3Res.status === 'fulfilled' ? mp3Res.value.data : null;

  if (!mp4Data?.success && !mp3Data?.success) {
    throw new Error('El motor ytdlp-server no pudo procesar el video de YouTube.');
  }

  const title = mp4Data?.title || mp3Data?.title || 'Video de YouTube';
  const thumbnail = mp4Data?.thumb || mp3Data?.thumb || '';
  const formats = [];

  if (mp4Data?.success && mp4Data?.file) {
    formats.push({
      label: 'MP4 Video',
      type: 'video',
      // PUBLIC_URL para que el navegador pueda descargarlo
      url: `${PUBLIC_URL}${mp4Data.file}`,
      filename: mp4Data.filename || 'video.mp4',
    });
  }

  if (mp3Data?.success && mp3Data?.file) {
    formats.push({
      label: 'MP3 Audio',
      type: 'audio',
      url: `${PUBLIC_URL}${mp3Data.file}`,
      filename: mp3Data.filename || 'audio.mp3',
    });
  }

  if (formats.length === 0) {
    throw new Error('El motor no devolvio archivos de descarga validos.');
  }

  return {
    success: true,
    platform: 'youtube',
    title,
    thumbnail,
    author: '',
    duration: mp4Data?.duration || mp3Data?.duration || '',
    formats,
  };
}

module.exports = { downloadYouTube };
