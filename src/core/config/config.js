// /src/core/config/config.js
require('dotenv').config();

const isDebugMode = process.argv.includes('--debug');

// Exportamos un objeto de configuración claro y directo.
const config = {
  // Configuración del Servidor
  server: {
    port: process.env.PORT || 3001,
    appUrl: process.env.APP_URL || `http://localhost:${process.env.PORT || 3001}`,
    allowedOrigins: process.env.CORS_ALLOWED_ORIGINS ? process.env.CORS_ALLOWED_ORIGINS.split(',') : [],
  },

  // Configuración de la Base de Datos
  database: {
    // La URL de la base de datos de producción (Railway/Vercel) tiene prioridad.
    url: process.env.DATABASE_URL, 
    // Configuración local como fallback si DATABASE_URL no existe.
    local: {
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      name: process.env.DB_NAME,
      dialect: 'mariadb',
    }
  },

  // Configuración de JWT
  jwt: {
    secret: process.env.JWT_SECRET,
  },

  // Configuración de Google OAuth
  google: {
    clientId: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackUrl: process.env.GOOGLE_CALLBACK_URL,
  },

  // Configuración de Cloudflare Turnstile
  cloudflare: {
    siteKey: process.env.CLOUDFLARE_SITE_KEY,
    secretKey: process.env.CLOUDFLARE_SECRET_KEY,
  },
  
  // Configuración de Logging
  logging: {
    level: isDebugMode ? 'debug' : 'info',
    debugMode: isDebugMode,
  },
};

module.exports = Object.freeze(config);