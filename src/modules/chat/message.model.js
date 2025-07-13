// src/modules/chat/message.model.js
const { DataTypes } = require('sequelize');
const sequelize = require('../../core/database/database');

const Message = sequelize.define('Message', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  content: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  channel: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'global',
  },
  // No necesitamos un campo 'username', porque lo obtenemos con la relación
});

module.exports = Message;