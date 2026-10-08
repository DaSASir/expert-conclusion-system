const loginForm = document.getElementById('loginForm');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const message = document.getElementById('message');

function loginUser(email, password) {
    if (!email || !password) {
        showMessage(message, 'Заполните все поля', 'error');
        return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        showMessage(message, 'Некорректный email', 'error');
        return;
    }

    showMessage(message, 'Проверка...', 'info');

    safeFetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email, password: password })
    })
    .then(r => r.json().then(data => ({ ok: r.ok, data: data })))
    .then(({ ok, data }) => {
        if (ok && data.success && data.user) {
            showMessage(message, 'Вход выполнен! Перенаправление...', 'success');

            const u = data.user;
            const safeUser = {
                id: typeof u.id === 'number' ? u.id : 0,
                email: String(u.email || ''),
                name: String(u.name || ''),
                role: u.role === 'admin' ? 'admin' : 'user'
            };

            try {
                localStorage.setItem('currentUser', JSON.stringify(safeUser));
            } catch (e) {
                showMessage(message, 'Не удалось сохранить сессию', 'error');
                return;
            }

            setTimeout(() => {
                window.location.href = safeUser.role === 'admin'
                    ? 'dashboard_admin.html'
                    : 'dashboard_user.html';
            }, 500);
        } else {
            showMessage(message, 'Неверный email или пароль', 'error');
        }
    })
    .catch(() => showMessage(message, 'Ошибка подключения к серверу', 'error'));
}

if (loginForm) {
    loginForm.addEventListener('submit', function (event) {
        event.preventDefault();
        loginUser(emailInput.value.trim(), passwordInput.value.trim());
    });
}

window.addEventListener('load', function () {
    const user = getCurrentUser();
    if (user) {
        window.location.href = user.role === 'admin'
            ? 'dashboard_admin.html'
            : 'dashboard_user.html';
    }
});