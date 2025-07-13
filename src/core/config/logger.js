// src/core/config/logger.js
const pino = require('pino');
const config = require('./config');

const logger = pino({
  level: config.logging.level,
  transport: {
    target: 'pino-pretty',
    options: {
      colorize: true,
      translateTime: 'SYS:dd-mm-yyyy HH:MM:ss',
      ignore: 'pid,hostname',
    },
  },
});

logger.debugOnly = (message, ...args) => {
  if (config.logging.debugMode) {
    logger.debug(message, ...args);
  }
};

module.exports = logger;