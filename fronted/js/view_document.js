const viewUser = requireAuth();
if (viewUser) {
    document.getElementById('userName').textContent =
        viewUser.name + ' (' + viewUser.role + ')';
}

const viewParams = new URLSearchParams(window.location.search);
const viewDocId = viewParams.get('id');
const isAdminView = viewParams.get('admin') === '1'
    && viewUser
    && viewUser.role === 'admin';

let currentDoc = null;

function loadDocument() {
    if (!viewDocId) {
        document.getElementById('documentContent').innerHTML =
            '<p>Документ не указан</p>';
        return;
    }

    const idNum = parseInt(viewDocId, 10);
    if (isNaN(idNum) || idNum <= 0) {
        document.getElementById('documentContent').innerHTML =
            '<p>Некорректный ID документа</p>';
        return;
    }

    fetch('/api/documents/' + encodeURIComponent(viewDocId))
        .then(r => r.json())
        .then(doc => {
            if (doc.error) {
                document.getElementById('documentContent').innerHTML =
                    '<p>Ошибка: документ не найден</p>';
                return;
            }

            currentDoc = doc;

            let html = '<table>';
            html += '<tr><td><strong>Регистрационный номер:</strong></td><td>' + escapeHtml(doc.reg_number || '— (не зарегистрирован)') + '</td></tr>';
            html += '<tr><td><strong>Дата документа:</strong></td><td>' + escapeHtml(doc.doc_date || '—') + '</td></tr>';
            html += '<tr><td><strong>Статус:</strong></td><td>' + escapeHtml(getStatusName(doc.status)) + '</td></tr>';
            html += '<tr><td><strong>Автор:</strong></td><td>' + escapeHtml(doc.author || '—') + '</td></tr>';
            html += '<tr><td><strong>Должность автора:</strong></td><td>' + escapeHtml(doc.author_position || '—') + '</td></tr>';
            html += '<tr><td><strong>Название:</strong></td><td>' + escapeHtml(doc.title || '—') + '</td></tr>';
            html += '<tr><td><strong>Подразделение:</strong></td><td>' + escapeHtml(doc.department || '—') + '</td></tr>';
            html += '<tr><td><strong>Описание:</strong></td><td>' + escapeHtml(doc.description || '—') + '</td></tr>';
            html += '<tr><td><strong>Публиковались:</strong></td><td>' + escapeHtml(doc.published || '—') + '</td></tr>';
            html += '<tr><td><strong>Заключение:</strong></td><td>' + escapeHtml(doc.conclusion || '—') + '</td></tr>';
            html += '<tr><td><strong>Издательство:</strong></td><td>' + escapeHtml(doc.publisher || '—') + '</td></tr>';
            html += '<tr><td><strong>Председатель:</strong></td><td>' + escapeHtml(doc.chairman || '—') + '</td></tr>';
            html += '<tr><td><strong>Члены комиссии:</strong></td><td>' + escapeHtml(doc.members || '—') + '</td></tr>';
            html += '<tr><td><strong>Начальник отдела:</strong></td><td>' + escapeHtml(doc.approved || '—') + '</td></tr>';
            html += '<tr><td><strong>Экспортный контроль:</strong></td><td>' + escapeHtml(doc.export_control || '—') + '</td></tr>';
            html += '</table>';

            document.getElementById('documentContent').innerHTML = html;

            if (doc.admin_comment) {
                document.getElementById('adminComment').textContent = doc.admin_comment;
                document.getElementById('adminCommentBlock').style.display = 'block';
            }

            if (isAdminView) {
                document.getElementById('adminActions').style.display = 'block';
            } else if (viewUser && viewUser.role === 'user') {
                document.getElementById('userActions').style.display = 'block';

                if (doc.status === 'draft' || doc.status === 'rejected') {
                    document.getElementById('btnUserEdit').style.display = 'inline-block';
                }
                if (doc.status === 'draft') {
                    document.getElementById('btnUserSubmit').style.display = 'inline-block';
                }
            }
        })
        .catch(() => {
            document.getElementById('documentContent').innerHTML =
                '<p>Ошибка загрузки</p>';
        });
}

function editDocument() {
    window.location.href = 'document.html?id=' + encodeURIComponent(viewDocId);
}

function submitDoc() {
    if (!confirm('Отправить документ на проверку?')) return;

    fetch('/api/documents/' + encodeURIComponent(viewDocId) + '/submit', { method: 'POST' })
        .then(r => r.json())
        .then(result => {
            if (result.success) {
                alert('Документ отправлен на проверку');
                loadDocument();
            }
        });
}

function approveDoc() {
    if (!confirm('Отметить документ как проверенный?')) return;

    fetch('/api/documents/' + encodeURIComponent(viewDocId) + '/approve', { method: 'POST' })
        .then(r => r.json())
        .then(result => {
            if (result.success) loadDocument();
        });
}

function rejectDoc() {
    const comment = prompt('Причина отклонения:');
    if (comment === null) return;

    if (comment.length > 1000) {
        alert('Слишком длинный комментарий (макс. 1000)');
        return;
    }

    fetch('/api/documents/' + encodeURIComponent(viewDocId) + '/reject', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ comment: comment })
    })
        .then(r => r.json())
        .then(result => {
            if (result.success) loadDocument();
        });
}

function registerDoc() {
    if (!confirm('Зарегистрировать документ? Будет присвоен номер.')) return;

    // ЗАЩИТА: передаём user_id с сервера, а не из формы
    const user = getCurrentUser();
    const userId = user ? user.id : 0;

    fetch('/api/documents/' + encodeURIComponent(viewDocId) + '/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId })
    })
        .then(r => r.json())
        .then(result => {
            if (result.success) {
                alert('Документ зарегистрирован! Номер: ' + result.reg_number);
                loadDocument();
            } else {
                alert('Ошибка: ' + (result.error || 'неизвестная'));
            }
        });
}

function goBack() {
    const user = getCurrentUser();
    if (user && user.role === 'admin') {
        window.location.href = 'dashboard_admin.html';
    } else {
        window.location.href = 'dashboard_user.html';
    }
}

function downloadWord() {
    if (!currentDoc) {
        alert('Документ ещё не загружен');
        return;
    }
    downloadWordFile(currentDoc);
}

loadDocument();