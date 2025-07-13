document.addEventListener('DOMContentLoaded', async () => {
    const token = localStorage.getItem('mikuverse_token');
    if (token) {
        window.location.href = '/app.html';
        return;
    }

    let cloudflareSiteKey = null;
    try {
        const response = await fetch('/api/misc/config');
        const data = await response.json();
        cloudflareSiteKey = data.cloudflareSiteKey;
        if (!cloudflareSiteKey) {
            throw new Error("Cloudflare Site Key no recibida del backend.");
        }
    } catch (error) {
        console.error("Error al obtener la Site Key de Cloudflare:", error);
        showError("No se pudo cargar el sistema de verificación. Inténtalo de nuevo más tarde.");
        return;
    }

    const loginView = document.getElementById('login-view');
    const registerView = document.getElementById('register-view');
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    
    const showRegisterBtn = document.getElementById('show-register');
    const showLoginBtn = document.getElementById('show-login');
    
    const errorMessageDiv = document.getElementById('error-message');

    let loginWidgetId = null;
    let registerWidgetId = null;

    function renderTurnstile(view) {
        if (!window.turnstile || !cloudflareSiteKey) {
            console.error("La API de Turnstile o la Site Key no están disponibles.");
            return;
        }
        if (view === 'login' && !loginWidgetId) {
            loginWidgetId = window.turnstile.render('#turnstile-login-widget', { sitekey: cloudflareSiteKey });
        } else if (view === 'register' && !registerWidgetId) {
            registerWidgetId = window.turnstile.render('#turnstile-register-widget', { sitekey: cloudflareSiteKey });
        }
    }

    showRegisterBtn.addEventListener('click', () => {
        loginView.classList.remove('active');
        registerView.classList.add('active');
        hideError();
        renderTurnstile('register');
    });

    showLoginBtn.addEventListener('click', () => {
        registerView.classList.remove('active');
        loginView.classList.add('active');
        hideError();
        renderTurnstile('login');
    });

    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        await handleFormSubmit('/api/auth/login', loginForm, (result) => {
            localStorage.setItem('mikuverse_token', result.token);
            const urlParams = new URLSearchParams(window.location.search);
            const redirectUrl = urlParams.get('redirect');
            window.location.href = redirectUrl || '/app.html';
        });
    });

    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        await handleFormSubmit('/api/auth/register', registerForm, () => {
            alert('¡Registro exitoso! Ahora puedes iniciar sesión.');
            showLoginBtn.click();
        });
    });

    async function handleFormSubmit(endpoint, form, onSuccess) {
        hideError();
        
        const formData = new FormData(form);
        const data = Object.fromEntries(formData.entries());

        const turnstileResponse = window.turnstile.getResponse(form.querySelector('[id^="turnstile-"] > iframe'));
        
        if (!turnstileResponse) {
            showError('Por favor, completa la verificación.');
            return;
        }
        
        data['cf-turnstile-response'] = turnstileResponse;

        try {
            const response = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });
            const result = await response.json();

            if (!response.ok) throw new Error(result.message);
            
            onSuccess(result);

        } catch (error) {
            showError(error.message);
        } finally {
            if (window.turnstile) {
                try {
                    const widgetId = form.id === 'login-form' ? loginWidgetId : registerWidgetId;
                    if (widgetId) window.turnstile.reset(widgetId);
                } catch (e) {
                    console.error('Error al resetear Turnstile', e);
                }
            }
        }
    }

    function showError(message) {
        errorMessageDiv.textContent = message;
        errorMessageDiv.style.display = 'block';
    }

    function hideError() {
        errorMessageDiv.style.display = 'none';
    }

    renderTurnstile('login');
});