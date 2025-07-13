// src/core/database/database.js

const { Sequelize } = require('sequelize');
const config = require('./config');
const fs = require('fs');
const path = require('path');

let sequelize;

if (config.database.url) {
  let sslConfig = {
    rejectUnauthorized: true,
  };

  if (process.env.DB_CERT_CA_PATH) {
    try {
      const caCertPath = path.resolve(process.env.DB_CERT_CA_PATH);
      sslConfig.ca = fs.readFileSync(caCertPath).toString();
      console.log(`[DB] Certificado CA cargado desde: ${caCertPath}`);
    } catch (e) {
      console.error(`[DB ERROR] No se pudo cargar el certificado CA SSL desde ${process.env.DB_CERT_CA_PATH}:`, e.message);
    }
  } else {
    console.warn("[DB WARNING] Variable DB_CERT_CA_PATH no definida. La conexión SSL podría fallar si el host requiere un CA específico y rejectUnauthorized es true.");
  }

  sequelize = new Sequelize(config.database.url, {
    dialect: config.database.dialect,
    dialectModule: require('mysql2'),
    dialectOptions: {
      ssl: sslConfig,
    },
    logging: config.logging.level === 'debug' ? console.log : false,
  });

} else {
  sequelize = new Sequelize(
    config.database.name,
    config.database.user,
    config.database.password,
    {
      host: config.database.host,
      dialect: config.database.dialect,
      logging: config.logging.level === 'debug' ? console.log : false,
    }
  );
}

module.exports = sequelize;