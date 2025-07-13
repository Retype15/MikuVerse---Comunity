document.addEventListener('DOMContentLoaded', () => {
    // 1. Manejo de Token
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

    // 2. Elementos del DOM
    const sidebar = document.getElementById('sidebar');
    const sidebarToggle = document.getElementById('sidebar-toggle');
    const logoutBtn = document.getElementById('logout-btn');
    const messageInput = document.getElementById('message-input');
    const sendButton = document.getElementById('send-button');
    const messagesDiv = document.querySelector('#chat-view .messages');

    // 3. Lógica del Sidebar Plegable
    if (sidebarToggle) {
        sidebarToggle.addEventListener('click', () => {
            sidebar.classList.toggle('collapsed');
        });
    }

    // 4. Lógica de Logout
    if (logoutBtn) {
        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            if (socket) socket.disconnect();
            localStorage.removeItem('jwt_token');
            window.location.href = '/index.html';
        });
    }
    
    // 5. Conexión de Socket.IO
    const socket = io({ auth: { token } });

    socket.on('connect_error', (err) => {
        console.error('Socket connect_error:', err.message);
        if (logoutBtn) logoutBtn.click();
    });

    // 6. Lógica de Perfil
    socket.on('user_profile', (user) => {
        const usernameField = document.getElementById('profile-username');
        const emailField = document.getElementById('profile-email');
        const avatarImg = document.getElementById('profile-avatar-img');

        if (usernameField) usernameField.value = user.username;
        if (emailField) emailField.value = user.email;
        if (avatarImg) {
            avatarImg.src = user.avatarUrl || `https://i.pravatar.cc/150?u=${encodeURIComponent(user.username)}`;
        }
    });

    // 7. Lógica del Chat
    socket.on('chat_history', (history) => {
        if (!messagesDiv) return;
        messagesDiv.innerHTML = '';
        history.forEach(msg => renderMessage(msg));
    });

    socket.on('receive_message', (msg) => {
        renderMessage(msg);
    });

    if (sendButton) {
        sendButton.addEventListener('click', sendMessage);
    }
    if (messageInput) {
        // Lógica para TEXTAREA
        messageInput.addEventListener('keypress', (e) => {
            // Envía con Enter, nueva línea con Shift+Enter
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault(); // Prevenir el salto de línea
                sendMessage();
            }
        });

        // Lógica para que el textarea crezca automáticamente
        messageInput.addEventListener('input', () => {
            messageInput.style.height = 'auto';
            messageInput.style.height = (messageInput.scrollHeight) + 'px';
        });
    }

    function sendMessage() {
        if (!messageInput) return;
        const content = messageInput.value.trim();
        if (content) {
            socket.emit('send_message', { content });
            messageInput.value = '';
            messageInput.style.height = 'auto'; // Resetear altura
            messageInput.focus();
        }
    }

    function renderMessage(msg) {
        if(!messagesDiv) return;
        const msgEl = document.createElement('div');
        msgEl.classList.add('message');

        const avatar = document.createElement('div');
        avatar.className = 'message-avatar';
        const avatarImg = document.createElement('img');
        avatarImg.src = msg.User.avatarUrl ? msg.User.avatarUrl : `https://i.pravatar.cc/40?u=${encodeURIComponent(msg.User.username)}`;
        avatarImg.alt = "Avatar";
        avatar.appendChild(avatarImg);

        const body = document.createElement('div');
        body.className = 'message-body';

        const header = document.createElement('div');
        header.className = 'message-header';
        const usernameSpan = document.createElement('span');
        usernameSpan.className = 'username';
        usernameSpan.textContent = msg.User.username;
        header.appendChild(usernameSpan);

        const contentDiv = document.createElement('div');
        contentDiv.className = 'message-content';
        contentDiv.innerHTML = msg.content;

        body.appendChild(header);
        body.appendChild(contentDiv);
        
        const timestampSpan = document.createElement('span');
        timestampSpan.className = 'timestamp-right';
        timestampSpan.textContent = new Date(msg.createdAt).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });

        msgEl.appendChild(avatar);
        msgEl.appendChild(body);
        msgEl.appendChild(timestampSpan);
        
        messagesDiv.appendChild(msgEl);
        messagesDiv.scrollTop = messagesDiv.scrollHeight;
    }
});