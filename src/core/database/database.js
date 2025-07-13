// src/core/database/database.js

const { Sequelize } = require('sequelize');
const config = require('../config/config');

let sequelize;

if (config.database.url) {
  let sslConfig = {
    rejectUnauthorized: false,
  };

  sequelize = new Sequelize(config.database.url, {
    dialect: config.database.dialect,
    dialectModule: require('mysql2'),
    dialectOptions: {
      ssl: sslConfig,
    },
    logging: config.logging.level === 'debug' ? console.log : true,
  });

} else {
  sequelize = new Sequelize(
    config.database.name,
    config.database.user,
    config.database.password,
    {
      host: config.database.host,
      dialect: config.database.dialect,
      logging: config.logging.level === 'debug' ? console.log : true,
    }
  );
}

module.exports = sequelize;