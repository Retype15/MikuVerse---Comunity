// src/modules/auth/passport.config.js
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const jwt = require('jsonwebtoken');
const User = require('../users/user.model');
const logger = require('../../core/config/logger');
const config = require('../../core/config/config');

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
        // Si el usuario ya existe, lo pasamos para que inicie sesión.
        logger.info(`Usuario encontrado por Google ID: ${user.username}`);
        return done(null, user);
      } else {
        // --- NUEVA LÓGICA ---
        // Si el usuario NO existe, no lo creamos aquí.
        // En su lugar, creamos un token temporal para completar el registro en el frontend.
        logger.info(`Nuevo intento de registro con Google para el email: ${profile.emails[0].value}. Requiere completar perfil.`);
        
        const tempPayload = {
          googleId: profile.id,
          email: profile.emails[0].value,
          avatarUrl: profile.photos[0].value,
          suggestedUsername: profile.displayName.replace(/\s/g, '') || 'user'
        };

        // Este token es solo para el proceso de registro y caduca en 10 minutos.
        const tempToken = jwt.sign(tempPayload, config.jwt.secret, { expiresIn: '10m' });

        // Pasamos `false` para el usuario y el token en `info`.
        return done(null, false, { tempToken });
      }
    } catch (error) {
      logger.error('Error en la estrategia de Google:', error);
      return done(error, null);
    }
  }
));

// No necesitamos serialize/deserialize porque usaremos JWT (session: false)