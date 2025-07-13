// src/modules/chat/chat.gateway.js
const jwt = require('jsonwebtoken');
const config = require('../../core/config/config');
const logger = require('../../core/config/logger');
const User = require('../users/user.model');
const Message = require('./message.model');
const { JSDOM } = require('jsdom');
const DOMPurify = require('dompurify');

const window = new JSDOM('').window;
const purify = DOMPurify(window);

function initializeChat(io) {
  // autenticar
  io.use(async (socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) {
      return next(new Error('Authentication error: Token not provided'));
    }
    try {
      const decoded = jwt.verify(token, config.jwt.secret);
      const user = await User.findByPk(decoded.id, { attributes: { exclude: ['password'] } });
      if (!user) {
        return next(new Error('Authentication error: User not found'));
      }
      socket.user = user;
      next();
    } catch (err) {
      return next(new Error('Authentication error: Invalid token'));
    }
  });

  io.on('connection', async (socket) => {
    logger.info(`Usuario conectado al chat: ${socket.user.username} (Socket ID: ${socket.id})`);

    socket.join('global');
    socket.emit('user_profile', {
        username: socket.user.username,
        email: socket.user.email,
        avatarUrl: socket.user.avatarUrl,
        role: socket.user.role
    });

    try {
        const lastMessages = await Message.findAll({
            where: { channel: 'global' },
            order: [['createdAt', 'ASC']],
            limit: 50,
            include: { model: User, attributes: ['username', 'avatarUrl'] }
        });
        socket.emit('chat_history', lastMessages);
    } catch(error) {
        logger.error('Error al cargar el historial del chat:', error);
    }


    socket.on('send_message', async (data) => {
      const receivedContent = data.content;
      if (!receivedContent || typeof receivedContent !== 'string' || receivedContent.trim() === '') {
        return;
      }
      const cleanContent = purify.sanitize(receivedContent).trim();

      if (cleanContent === '') return;

      logger.debugOnly(`Mensaje recibido de ${socket.user.username}: ${receivedContent}`);

      try {
        const message = await Message.create({
          content: cleanContent,
          channel: 'global',
          userId: socket.user.id,
        });

        const messageToSend = {
            id: message.id,
            content: cleanContent,
            createdAt: message.createdAt,
            User: {
                username: socket.user.username,
                avatarUrl: socket.user.avatarUrl
            }
        };
        //Por ahora solo global
        io.to('global').emit('receive_message', messageToSend);
      } catch (error) {
        logger.error('Error al guardar o emitir mensaje:', error);
      }
    });

    socket.on('delete_message', async (data) => {
        if (socket.user.role === 'moderator' || socket.user.role === 'admin') {
            try {
                const messageId = data.messageId;
                const result = await Message.destroy({ where: { id: messageId }});
                if (result > 0) {
                    io.to('global').emit('message_deleted', { messageId });
                    logger.info(`El usuario ${socket.user.username} borró el mensaje ${messageId}`);
                }
            } catch(error) {
                logger.error('Error al borrar mensaje:', error);
            }
        }
    });

    socket.on('disconnect', () => {
      logger.info(`Usuario desconectado del chat: ${socket.user.username}`);
    });
  });
}

module.exports = { initializeChat };