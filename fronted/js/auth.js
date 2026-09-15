const loginForm = document.getElementById('loginForm');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const message = document.getElementById('message');

function loginUser(email, password) {
    if (!email || !password) {
        message.textContent = 'Заполните все поля';
        return;
    }

    if (email.length > 100 || password.length > 100) {
        message.textContent = 'Слишком длинный ввод';
        return;
    }

    message.textContent = 'Проверка...';

    fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email, password: password })
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Ошибка сервера');
        }
        return response.json();
    })
    .then(result => {
        if (result.success && result.user) {
            message.textContent = 'Вход выполнен! Перенаправление...';

            const safeUser = {
                id: result.user.id,
                email: result.user.email,
                name: result.user.name,
                role: result.user.role
            };
            localStorage.setItem('currentUser', JSON.stringify(safeUser));

            setTimeout(function() {
                if (safeUser.role === 'admin') {
                    window.location.href = 'dashboard_admin.html';
                } else {
                    window.location.href = 'dashboard_user.html';
                }
            }, 500);
        } else {
            message.textContent = 'Неверный email или пароль';
        }
    })
    .catch(error => {
        message.textContent = 'Ошибка подключения к серверу';
    });
}

if (loginForm) {
    loginForm.addEventListener('submit', function(event) {
        event.preventDefault();
        loginUser(
            emailInput.value.trim(),
            passwordInput.value.trim()
        );
    });
}

window.addEventListener('load', function() {
    const user = getCurrentUser();
    if (user) {
        if (user.role === 'admin') {
            window.location.href = 'dashboard_admin.html';
        } else {
            window.location.href = 'dashboard_user.html';
        }
    }
});