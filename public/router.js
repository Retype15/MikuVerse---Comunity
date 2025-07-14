document.addEventListener('DOMContentLoaded', () => {
    const navLinks = document.querySelectorAll('.nav-link');
    const views = document.querySelectorAll('.view');
    
    let chatHistoryLoaded = false;

    function handleRouteChange() {
        const hash = window.location.hash || '#chat';

        views.forEach(view => view.classList.remove('active'));
        navLinks.forEach(link => link.classList.remove('active'));

        const activeView = document.querySelector(hash + '-view');
        const activeLink = document.querySelector(`a[href="${hash}"]`);

        if (activeView) {
            activeView.classList.add('active');
        }
        
        if (activeLink) {
            activeLink.classList.add('active');
        }

        const checkSocketAndLoad = setInterval(() => {
            if (window.MikuVerse && window.MikuVerse.socket && window.MikuVerse.socket.connected) {
                clearInterval(checkSocketAndLoad);

                if (hash === '#chat' && !chatHistoryLoaded) {
                    window.MikuVerse.requestChatHistory();
                    chatHistoryLoaded = true;
                }
                // Aquí se anade la logica para futuras secciones de chat, ejemplo:
                // else if (hash === '#gallery') { window.MikuVerse.requestGallery(); }
            }
        }, 100);
    }

    window.addEventListener('hashchange', handleRouteChange);
    
    handleRouteChange();
});