// /src/modules/auth/auth.controller.js
const jwt = require('jsonwebtoken');
const User = require('../users/user.model');
const config = require('../../core/config/config');
const logger = require('../../core/config/logger');

const googleCallback = (req, res) => {
  const user = req.user;
  const payload = { id: user.id, username: user.username, role: user.role };
  const token = jwt.sign(payload, config.jwt.secret, { expiresIn: '7d' });
  res.redirect(`/app.html?token=${token}`);
};

const register = async (req, res) => {
  const { email, password, username } = req.body;
  if (!email || !password || !username) {
    return res.status(400).json({ message: 'Correo electrónico, contraseña y nombre de usuario son requeridos.' });
  }

  try {
    const existingUserByEmail = await User.findOne({ where: { email } });
    if (existingUserByEmail) {
      return res.status(409).json({ message: 'El correo electrónico ya está en uso.' });
    }
    
    const existingUserByUsername = await User.findOne({ where: { username } });
    if (existingUserByUsername) {
        return res.status(409).json({ message: 'El nombre de usuario ya está en uso.' });
    }

    const newUser = await User.create({ email, password, username });

    res.status(201).json({ message: 'Usuario registrado con éxito. Ahora puedes iniciar sesión.' });
  } catch (error) {
    logger.error('Error en el registro:', error);
    res.status(500).json({ message: 'Error interno al registrar el usuario.' });
  }
};

const login = async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ message: 'Email y contraseña son requeridos.' });
  }

  try {
    const user = await User.findOne({ where: { email } });
    if (!user || !user.password) {
      return res.status(401).json({ message: 'Correo electrónico o contraseña incorrectos.' });
    }

    const isMatch = await user.isValidPassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Correo electrónico o contraseña incorrectos.' });
    }
    
    const payload = { id: user.id, username: user.username, role: user.role };
    const token = jwt.sign(payload, config.jwt.secret, { expiresIn: '7d' });
    
    res.json({ token });

  } catch (error) {
    logger.error('Error en el login:', error);
    res.status(500).json({ message: 'Error interno al iniciar sesión.' });
  }
};

module.exports = {
  googleCallback,
  register,
  login
};