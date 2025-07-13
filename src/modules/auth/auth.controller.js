// /src/modules/auth/auth.controller.js
const jwt = require('jsonwebtoken');
const User = require('../users/user.model');
const config = require('../../core/config/config');
const logger = require('../../core/config/logger');

const googleCallback = (req, res) => {
  // Caso 1: El usuario ya existía y Passport lo encontró (Login exitoso).
  if (req.user) {
    const user = req.user;
    const payload = { id: user.id, username: user.username, role: user.role };
    const token = jwt.sign(payload, config.jwt.secret, { expiresIn: '7d' });
    return res.redirect(`/app.html?token=${token}`);
  }

  // Caso 2: Es un usuario nuevo y Passport nos dio un token temporal.
  if (req.authInfo && req.authInfo.tempToken) {
    const tempToken = req.authInfo.tempToken;
    return res.redirect(`/index.html?tempToken=${tempToken}`);
  }

  // Caso 3: Fallo la autenticación de Google por alguna razón.
  logger.warn('Callback de Google llamado sin usuario ni token temporal.');
  return res.redirect('/index.html?error=google_auth_failed');
};

const completeGoogleRegistration = async (req, res) => {
  const { username, password, tempToken } = req.body;

  if (!username || !password || !tempToken) {
    return res.status(400).json({ message: 'Nombre de usuario, contraseña y token son requeridos.' });
  }

  try {
    // 1. Verificar el token temporal
    const decoded = jwt.verify(tempToken, config.jwt.secret);
    const { googleId, email, avatarUrl } = decoded;

    // 2. Comprobar que el nombre de usuario no esté en uso
    const existingUserByUsername = await User.findOne({ where: { username } });
    if (existingUserByUsername) {
      return res.status(409).json({ message: 'El nombre de usuario ya está en uso. Por favor, elige otro.' });
    }
    
    // 3. Comprobar que el email no esté en uso (doble chequeo)
    const existingUserByEmail = await User.findOne({ where: { email } });
    if (existingUserByEmail) {
        return res.status(409).json({ message: 'El correo electrónico ya está registrado. Intenta iniciar sesión.' });
    }

    // 4. Crear el nuevo usuario en la base de datos
    const newUser = await User.create({
      googleId,
      email,
      avatarUrl,
      username,
      password // El hook `beforeCreate` se encargará de hashear la contraseña
    });

    logger.info(`Usuario completó registro de Google con éxito: ${newUser.username}`);

    // 5. Generar un token de sesión JWT final
    const payload = { id: newUser.id, username: newUser.username, role: newUser.role };
    const token = jwt.sign(payload, config.jwt.secret, { expiresIn: '7d' });

    res.status(201).json({ token });

  } catch (error) {
    if (error.name === 'TokenExpiredError' || error.name === 'JsonWebTokenError') {
      logger.warn('Intento de completar registro con token temporal inválido o expirado.');
      return res.status(401).json({ message: 'Tu sesión de registro ha expirado. Por favor, inténtalo de nuevo.' });
    }
    logger.error('Error al completar el registro de Google:', error);
    res.status(500).json({ message: 'Error interno al registrar el usuario.' });
  }
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
  completeGoogleRegistration, // Exportar la nueva función
  register,
  login
};