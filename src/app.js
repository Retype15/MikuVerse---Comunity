// src/app.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const passport = require('passport');
const logger = require('./core/config/logger');
const sequelize = require('./core/database/database');
const config = require('./core/config/config');
const miscRoutes = require('./modules/misc/misc.routes');
const User = require('./modules/users/user.model');
const Message = require('./modules/chat/message.model');

require('./modules/auth/passport.config');
const authRoutes = require('./modules/auth/auth.routes');

User.hasMany(Message, { foreignKey: 'userId' });
Message.belongsTo(User, { foreignKey: 'userId' });


const app = express();

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin || config.server.allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Acceso no permitido.'));
    }
  },
  credentials: true,
};
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, '..', 'public')));

//////////////////////////////

app.use(passport.initialize());

app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'MikuVerse Backend is running!' });
});

app.use('/api/auth', authRoutes);
app.use('/api/misc', miscRoutes);

app.get(/^(.*)$/, (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});

sequelize.sync()
  .then(() => logger.info('Base de datos sincronizada correctamente.'))
  .catch((err) => logger.error('Error al sincronizar la base de datos:', err));

module.exports = app;