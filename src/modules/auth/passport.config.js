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
      let user = await User.findOne({ where: { googleId: profile.id } });

      if (user) {
        logger.info(`Usuario encontrado por Google ID: ${user.username}`);
        return done(null, user);
      } else {
        logger.info(`Nuevo intento de registro con Google para el email: ${profile.emails[0].value}. Requiere completar perfil.`);
        
        const tempPayload = {
          googleId: profile.id,
          email: profile.emails[0].value,
          avatarUrl: profile.photos[0].value,
          suggestedUsername: profile.displayName.replace(/\s/g, '') || 'user'
        };

        const tempToken = jwt.sign(tempPayload, config.jwt.secret, { expiresIn: '10m' });

        return done(null, false, { tempToken });
      }
    } catch (error) {
      logger.error('Error en la estrategia de Google:', error);
      return done(error, null);
    }
  }
));