# API DevMatrixs

API central que actúa como puente entre el frontend (tools-flash) y los motores de scraping.

## Estructura

```
api-devmatrixs/
├── server.js                  # Entrada principal
├── routes/
│   └── download.js            # GET /api/download
├── controllers/
│   └── downloadController.js  # Detecta plataforma
├── services/
│   ├── tiktok.js              # TikWM (directo)
│   ├── youtube.js             # ytdlp-server :4000
│   └── instagram.js           # ytdlp-server :4000
└── .env.example
```

## Endpoint

```
GET /api/download?url=<link>
```

### Respuesta estándar

```json
{
  "success": true,
  "platform": "tiktok | youtube | instagram",
  "title": "Título del video",
  "thumbnail": "https://...",
  "author": "@usuario",
  "formats": [
    { "label": "MP4 Sin marca de agua", "type": "video", "url": "https://..." },
    { "label": "MP3 Audio", "type": "audio", "url": "https://..." }
  ]
}
```

## Setup en el servidor

```bash
# 1. Clonar en carpeta propia
cd /root
git clone https://github.com/jahseh16/api-devmatrixs
cd api-devmatrixs

# 2. Instalar dependencias
npm install

# 3. Configurar variables
cp .env.example .env
# Edita .env si tu motor está en otro puerto

# 4. Parar el proceso viejo y arrancar el nuevo
pm2 stop api-devmatrixs
pm2 delete api-devmatrixs
pm2 start server.js --name api-devmatrixs
pm2 save
```

## Plataformas soportadas

| Plataforma | Motor | Notas |
|---|---|---|
| TikTok | TikWM (externo) | Sin marca de agua, HD |
| YouTube | ytdlp-server :4000 | MP4 + MP3 |
| Instagram | ytdlp-server :4000 | MP4 |
