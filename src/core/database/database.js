// /src/core/database/database.js
const { Sequelize } = require('sequelize');
const config = require('../config/config');
const logger = require('../config/logger');

let sequelize;

// Usar la URL de producción si existe
if (config.database.url) {
  logger.info("Conectando a la base de datos de producción (Railway)...");
  sequelize = new Sequelize(config.database.url, {
    dialect: 'mysql', // Railway usa MySQL
    dialectModule: require('mysql2'),
    dialectOptions: {
      ssl: {
        // Esta configuración es a menudo necesaria para DBs en la nube
        rejectUnauthorized: true, 
      }
    },
    logging: false,
  });
} else {
  // Usar la configuración local como fallback
  logger.info("Conectando a la base de datos local (MariaDB)...");
  const dbLocal = config.database.local;
  sequelize = new Sequelize(dbLocal.name, dbLocal.user, dbLocal.password, {
    host: dbLocal.host,
    dialect: dbLocal.dialect,
    logging: false,
  });
}

module.exports = sequelize;