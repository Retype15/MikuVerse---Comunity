// /test-page/client.js
document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('login-form');
    const errorMessageDiv = document.getElementById('error-message');

    const urlParams = new URLSearchParams(window.location.search);
    const redirectUrl = urlParams.get('redirect'); 

    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            errorMessageDiv.style.display = 'none';

            const formData = new FormData(loginForm);
            const data = Object.fromEntries(formData.entries());

            if (!data['cf-turnstile-response']) {
                showError('Por favor, completa el captcha de verificación.');
                return;
            }

            try {
                const response = await fetch('/api/auth/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data),
                });

                const result = await response.json();

                if (!response.ok) {
                    throw new Error(result.message || 'Error desconocido al iniciar sesión.');
                }
                
                localStorage.setItem('jwt_token', result.token);
                
                window.location.href = redirectUrl || '/chat.html'; 

            } catch (error) {
                showError(error.message);
                if (window.turnstile) {
                    window.turnstile.reset();
                }
            }
        });
    }

    function showError(message) {
        errorMessageDiv.textContent = message;
        errorMessageDiv.style.display = 'block';
    }
});