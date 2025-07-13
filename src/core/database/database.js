const { Sequelize } = require('sequelize');
const config = require('./config');
require('dotenv').config();

let sequelize;

if (config.database.url) {
  sequelize = new Sequelize(config.database.url, {
    dialect: config.database.dialect,
    dialectModule: config.database.dialectModule,
    dialectOptions: {
      ssl: config.database.ssl
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