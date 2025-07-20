document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('login-form');
    const errorContainer = document.getElementById('error-container');

    form.addEventListener('submit', function(event) {
        event.preventDefault();

        // Limpar mensagens de erro
        errorContainer.classList.add('d-none');
        errorContainer.innerHTML = '';

        // Limpar classes de erro
        const fields = form.querySelectorAll('.form-control');
        fields.forEach(field => {
            field.classList.remove('is-invalid');
        });

        const email = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value.trim();
        let hasErrors = false;

        if (!email) {
            setError('email', 'Por favor, insira um email válido.');
            hasErrors = true;
        } else {
            const emailField = document.getElementById('email');
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                setError('email', 'Por favor, insira um email válido.');
                hasErrors = true;
            }
        }

        if (!password) {
            setError('password', 'Por favor, insira a senha.');
            hasErrors = true;
        }

        if (hasErrors) {
            return;
        }

        fetch('/api/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password })
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Email ou senha incorretos.');
            }
            return response.json();
        })
        .then(user => {
            sessionStorage.setItem('user', JSON.stringify(user));
            window.location.href = '/dashboard.html';
        })
        .catch(error => {
            showError(error.message);
        });
    });

    function setError(fieldId, message) {
        const field = document.getElementById(fieldId);
        field.classList.add('is-invalid');
        const feedback = field.nextElementSibling;
        if (feedback) {
            feedback.textContent = message;
        }
    }

    function showError(message) {
        errorContainer.classList.remove('d-none');
        errorContainer.textContent = message;
    }
});
