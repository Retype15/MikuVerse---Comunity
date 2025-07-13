require('dotenv').config();

const isDebugMode = process.argv.includes('--debug');

const config = {
  server: {
    port: process.env.PORT || 3001,
    appUrl: process.env.APP_URL,
    allowedOrigins: process.env.CORS_ALLOWED_ORIGINS ? process.env.CORS_ALLOWED_ORIGINS.split(',') : [],
  },
  database: {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    name: process.env.DB_NAME,
    dialect: process.env.DB_DIALECT,
  },
  jwt: {
    secret: process.env.JWT_SECRET,
  },
  google: {
    clientId: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackUrl: process.env.GOOGLE_CALLBACK_URL,
  },

  logging: {
    level: isDebugMode ? 'debug' : 'info',
    debugMode: isDebugMode,
  },
  cloudflare: {
    siteKey: process.env.CLOUDFLARE_SITE_KEY,
    secretKey: process.env.CLOUDFLARE_SECRET_KEY,
  }
};

module.exports = Object.freeze(config);