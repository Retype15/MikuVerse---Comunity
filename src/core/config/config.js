require('dotenv').config();

const isDebugMode = process.argv.includes('--debug');

let dbConfig;

if (process.env.DATABASE_URL) {
  dbConfig = {
    url: process.env.DATABASE_URL,
    dialect: 'mysql',
    dialectModule: require('mysql2'),
    ssl: { rejectUnauthorized: true }
  };
} else {
  dbConfig = {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    name: process.env.DB_NAME,
    dialect: process.env.DB_DIALECT,
  };
}

const config = {
  server: {
    port: process.env.PORT || 3001,
    appUrl: process.env.APP_URL || `http://localhost:${process.env.PORT || 3001}`,
    allowedOrigins: process.env.CORS_ALLOWED_ORIGINS ? process.env.CORS_ALLOWED_ORIGINS.split(',') : [],
  },
  database: dbConfig, 
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