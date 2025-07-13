// /src/modules/auth/auth.routes.js
const express = require('express');
const passport = require('passport');
const { googleCallback, register, login, completeGoogleRegistration } = require('./auth.controller');
const verifyCloudflare = require('../../core/middleware/cloudflare.middleware');
const router = express.Router();

router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

router.get(
  '/google/callback',
  passport.authenticate('google', { failureRedirect: '/index.html?error=google_auth_failed', session: false }),
  googleCallback
);

// Nueva ruta para completar el registro de Google
router.post('/complete-google', verifyCloudflare, completeGoogleRegistration);

router.post('/register', verifyCloudflare, register);

router.post('/login', verifyCloudflare, login);

module.exports = router;