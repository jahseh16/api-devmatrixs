const axios = require('axios');

/**
 * Descarga info de TikTok usando TikWM (gratis, sin key).
 * Docs: https://www.tikwm.com/
 */
async function downloadTikTok(url) {
  const response = await axios.post(
    'https://www.tikwm.com/api/',
    new URLSearchParams({ url, hd: '1' }),
    { headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, timeout: 15000 }
  );

  const data = response.data;

  if (!data || data.code !== 0) {
    throw new Error(data?.msg || 'TikWM no pudo procesar el video');
  }

  const video = data.data;

  return {
    success: true,
    platform: 'tiktok',
    title: video.title || 'Video de TikTok',
    thumbnail: video.cover || '',
    author: video.author?.nickname || '',
    formats: [
      {
        label: 'MP4 Sin marca de agua',
        type: 'video',
        url: video.play,
      },
      {
        label: 'MP4 HD Sin marca de agua',
        type: 'video',
        url: video.hdplay || video.play,
      },
      {
        label: 'Solo Audio (MP3)',
        type: 'audio',
        url: video.music,
      },
    ].filter(f => f.url),
  };
}

module.exports = { downloadTikTok };
