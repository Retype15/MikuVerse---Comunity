// src/modules/auth/passport.config.js
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../users/user.model');
const logger = require('../../core/config/logger');

passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.GOOGLE_CALLBACK_URL
  },
  async (accessToken, refreshToken, profile, done) => {
    try {
      // Buscamos si ya existe un usuario con este Google ID
      let user = await User.findOne({ where: { googleId: profile.id } });

      if (user) {
        // Si existe, lo usamos
        logger.info(`Usuario encontrado por Google ID: ${user.username}`);
        return done(null, user);
      } else {
        // Si no existe, lo creamos
        const newUser = {
          googleId: profile.id,
          username: profile.displayName.replace(/\s/g, '') + Math.floor(Math.random() * 1000), // Crear un username único
          email: profile.emails[0].value,
          avatarUrl: profile.photos[0].value,
        };
        
        user = await User.create(newUser);
        logger.info(`Nuevo usuario creado con Google: ${user.username}`);
        return done(null, user);
      }
    } catch (error) {
      logger.error('Error en la estrategia de Google:', error);
      return done(error, null);
    }
  }
));

// No necesitamos serialize/deserialize porque usaremos JWT (session: false)