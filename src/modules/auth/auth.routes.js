// /src/modules/auth/auth.routes.js
const express = require('express');
const passport = require('passport');
const { googleCallback, register, login } = require('./auth.controller');
const verifyCloudflare = require('../../core/middleware/cloudflare.middleware');
const router = express.Router();

router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

router.get(
  '/google/callback',
  passport.authenticate('google', { failureRedirect: '/', session: false }),
  googleCallback
);

router.post('/register', verifyCloudflare, register);

router.post('/login', verifyCloudflare, login);

module.exports = router;