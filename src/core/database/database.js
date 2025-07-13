// /src/core/database/database.js

const { Sequelize } = require('sequelize');
const config = require('../config/config');
const logger = require('../config/logger');

let sequelize;

if (config.database.url) {
  logger.info("Conectando a la base de datos de producción (Railway)...");
  sequelize = new Sequelize(config.database.url, {
    dialect: 'mysql',
    dialectModule: require('mysql2'),
    dialectOptions: {
      ssl: {
        rejectUnauthorized: false, 
      }
    },
    logging: false,
  });
} else {
  logger.info("Conectando a la base de datos local (MariaDB)...");
  const dbLocal = config.database.local;
  sequelize = new Sequelize(
    dbLocal.name,
    dbLocal.user,
    dbLocal.password,
    {
      host: dbLocal.host,
      dialect: dbLocal.dialect,
      logging: false,
    }
  );
}

module.exports = sequelize;