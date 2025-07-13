document.addEventListener('DOMContentLoaded', () => {
    const navLinks = document.querySelectorAll('.nav-link');
    const views = document.querySelectorAll('.view');

    function handleRouteChange() {
        const hash = window.location.hash || '#chat';

        views.forEach(view => view.classList.remove('active'));
        navLinks.forEach(link => link.classList.remove('active'));

        const activeView = document.querySelector(hash + '-view');
        const activeLink = document.querySelector(`a[href="${hash}"]`);

        if (activeView) {
            activeView.classList.add('active');
        } else {
            // Fallback: si el hash no corresponde a ninguna vista, muestra el chat.
            document.querySelector('#chat-view').classList.add('active');
        }
        
        if (activeLink) {
            activeLink.classList.add('active');
        } else {
            // Fallback: si no hay enlace activo, activa el del chat.
            document.querySelector('a[href="#chat"]').classList.add('active');
        }
    }

    window.addEventListener('hashchange', handleRouteChange);
    handleRouteChange();
});