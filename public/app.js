// public/app.js

window.MikuVerse = {
    socket: null,
    init: function() {
        const urlParams = new URLSearchParams(window.location.search);
        const tokenFromUrl = urlParams.get('token');
        if (tokenFromUrl) {
            localStorage.setItem('jwt_token', tokenFromUrl);
            window.history.replaceState({}, document.title, "/app.html" + window.location.hash);
        }

        const token = localStorage.getItem('jwt_token');
        if (!token) {
            window.location.href = `/index.html?redirect=${encodeURIComponent(window.location.pathname + window.location.hash)}`;
            return;
        }

        const logoutBtn = document.getElementById('logout-btn');
        const messageInput = document.getElementById('message-input');
        const sendButton = document.getElementById('send-button');

        if (logoutBtn) {
            logoutBtn.addEventListener('click', (e) => {
                e.preventDefault();
                if (this.socket) this.socket.disconnect();
                localStorage.removeItem('jwt_token');
                window.location.href = '/index.html';
            });
        }
        
        this.socket = io({ auth: { token } });

        this.socket.on('connect', () => {
            console.log('Socket conectado exitosamente. ID:', this.socket.id);
        });

        this.socket.on('connect_error', (err) => {
            console.error('Socket connect_error:', err.message);
            if (err.message.includes('Authentication error')) {
                logoutBtn.click();
            }
        });

        this.socket.on('user_profile', (user) => this.renderProfileView(user));
        this.socket.on('receive_message', (msg) => this.renderMessage(msg));
        this.socket.on('message_deleted', (data) => {
            const messageElement = document.getElementById(`message-${data.messageId}`);
            if(messageElement) messageElement.remove();
        });

        if (sendButton) {
            sendButton.addEventListener('click', () => this.sendMessage());
        }
        if (messageInput) {
            messageInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    this.sendMessage();
                }
            });
        }
    },

    sendMessage: function() {
        const messageInput = document.getElementById('message-input');
        const content = messageInput.value.trim();
        if (content && this.socket) {
            this.socket.emit('send_message', { content: content, channel: 'global' });
            messageInput.value = '';
            messageInput.style.height = 'auto';
            messageInput.focus();
        }
    },

    requestChatHistory: function() {
        const messagesDiv = document.querySelector('#chat-view .messages');
        if (!messagesDiv) return;
        messagesDiv.innerHTML = '<div class="loading-spinner">Cargando mensajes...</div>';
        
        this.socket.emit('request_chat_history', { channel: 'global' }, (response) => {
            if (response.error) {
                console.error(response.error);
                messagesDiv.innerHTML = '<div class="error-message">No se pudo cargar el historial.</div>';
                return;
            }
            this.renderChatHistory(response.history);
        });
    },

    renderChatHistory: function(history) {
        const messagesDiv = document.querySelector('#chat-view .messages');
        if (!messagesDiv) return;
        messagesDiv.innerHTML = '';
        if (history && history.length > 0) {
            history.forEach(msg => this.renderMessage(msg, true));
        } else {
            messagesDiv.innerHTML = '<div class="info-message">¡Sé el primero en escribir un mensaje!</div>';
        }
        messagesDiv.scrollTop = messagesDiv.scrollHeight;
    },

    renderMessage: function(msg, isFromHistory = false) {
        console.log("renderMessage: Recibido objeto de mensaje completo:", msg);
        if (!msg || !msg.User) {
            console.error("renderMessage: El mensaje o msg.User es nulo o indefinido. Saltando renderizado.");
            return;
        }
        const messagesDiv = document.querySelector('#chat-view .messages');
        if (!messagesDiv || !msg || !msg.User) return;
        if (document.getElementById(`message-${msg.id}`)) return;

        const infoMessage = messagesDiv.querySelector('.info-message');
        if (infoMessage) infoMessage.remove();

        const msgEl = document.createElement('div');
        msgEl.classList.add('message');
        msgEl.id = `message-${msg.id}`;

        

        const avatarSrc = msg.User.avatarUrl ? msg.User.avatarUrl : `https://i.pravatar.cc/40?u=${encodeURIComponent(msg.User.username)}`;
        const timestamp = new Date(msg.createdAt).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
        console.log(`renderMessage: Asignando URL de avatar para ${msg.User.username}:`, avatarSrc);
         msgEl.innerHTML = `
            <div class="message-avatar">
                <img alt="${this.escapeHTML(msg.User.username)}">
            </div>
            <div class="message-body">
                <div class="message-header">
                    <span class="username">${this.escapeHTML(msg.User.username)}</span>
                </div>
                <div class="message-content">${msg.content}</div>
            </div>
            <span class="timestamp-right">${timestamp}</span>
        `;

        const avatarImg = msgEl.querySelector('img');
        avatarImg.src = avatarSrc;
        avatarImg.onerror = () => {
            avatarImg.src = '/images/logo.png';
        };
        
        messagesDiv.appendChild(msgEl);
        
        if (!isFromHistory) {
            messagesDiv.scrollTop = messagesDiv.scrollHeight;
        }
    },

    renderProfileView: function(user) {
        // --- INICIO DE DEPURACIÓN ---
        console.log("renderProfileView: Recibido objeto de usuario completo:", user);
        if (!user) {
            console.error("renderProfileView: El objeto de usuario es nulo. Saltando renderizado.");
            return;
        }
        // --- FIN DE DEPURACIÓN ---

        const usernameField = document.getElementById('profile-username');
        const emailField = document.getElementById('profile-email');
        const avatarImg = document.getElementById('profile-avatar-img');

        if (usernameField) usernameField.value = user.username;
        if (emailField) emailField.value = user.email;
        if (avatarImg) {
            // --- DEPURACIÓN DE LA URL DEL AVATAR ---
            const profileAvatarSrc = user.avatarUrl;
            console.log(`renderProfileView: Asignando URL de avatar para perfil de ${user.username}:`, profileAvatarSrc);
            avatarImg.src = profileAvatarSrc;
            // --- FIN DE DEPURACIÓN ---
            
            avatarImg.onerror = () => {
                console.error('Error al cargar imagen de perfil:', avatarImg.src);
                avatarImg.src = '/images/logo.png';
            };
        }
    },

    escapeHTML: function(str) {
        if (!str) return '';
        return str.replace(/[&<>"']/g, (match) => ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#39;',
        }[match]));
    }
};

document.addEventListener('DOMContentLoaded', () => {
    window.MikuVerse.init();
});