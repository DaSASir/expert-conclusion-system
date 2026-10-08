const viewUser = requireAuth();
if (viewUser) {
    const userNameEl = document.getElementById('userName');
    if (userNameEl) userNameEl.textContent = viewUser.name + ' (' + viewUser.role + ')';

    initViewDocument();
}

function initViewDocument() {
    const params = new URLSearchParams(window.location.search);
    const viewDocId = parsePositiveInt(params.get('id'));
    const isAdminView = params.get('admin') === '1' && viewUser.role === 'admin';

    let currentDoc = null;

    function loadDocument() {
        if (!viewDocId) {
            document.getElementById('documentContent').textContent = 'Документ не указан';
            return;
        }

        safeFetch('/api/documents/' + encodeURIComponent(viewDocId))
            .then(r => {
                if (!r.ok) throw new Error('HTTP ' + r.status);
                return r.json();
            })
            .then(doc => {
                if (!doc || doc.error) {
                    document.getElementById('documentContent').textContent =
                        'Ошибка: документ не найден';
                    return;
                }

                currentDoc = doc;

                const row = (label, value) =>
                    '<tr><td><strong>' + label + ':</strong></td><td>'
                    + escapeHtml(value || '—') + '</td></tr>';

                document.getElementById('documentContent').innerHTML =
                    '<table>'
                    + row('Регистрационный номер', doc.reg_number || '— (не зарегистрирован)')
                    + row('Дата документа', doc.doc_date)
                    + row('Статус', getStatusName(doc.status))
                    + row('Автор', doc.author)
                    + row('Должность автора', doc.author_position)
                    + row('Название', doc.title)
                    + row('Подразделение', doc.department)
                    + row('Описание', doc.description)
                    + row('Публиковались', doc.published)
                    + row('Заключение', doc.conclusion)
                    + row('Издательство', doc.publisher)
                    + row('Председатель', doc.chairman)
                    + row('Члены комиссии', doc.members)
                    + row('Начальник отдела', doc.approved)
                    + row('Экспортный контроль', doc.export_control)
                    + '</table>';

                if (doc.admin_comment) {
                    document.getElementById('adminComment').textContent = doc.admin_comment;
                    document.getElementById('adminCommentBlock').style.display = 'block';
                }

                if (isAdminView) {
                    document.getElementById('adminActions').style.display = 'block';
                } else if (viewUser.role === 'user') {
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
                document.getElementById('documentContent').textContent = 'Ошибка загрузки';
            });
    }

    function post(url, body) {
        return safeFetch(url, {
            method: 'POST',
            headers: body ? { 'Content-Type': 'application/json' } : undefined,
            body: body ? JSON.stringify(body) : undefined
        }).then(r => r.json());
    }

    function editDocument() {
        if (viewDocId) window.location.href = 'document.html?id=' + viewDocId;
    }

    function submitDoc() {
        if (!viewDocId) return;
        if (!confirm('Отправить документ на проверку?')) return;
        post('/api/documents/' + viewDocId + '/submit')
            .then(r => {
                if (r && r.success) {
                    alert('Документ отправлен на проверку');
                    loadDocument();
                }
            })
            .catch(() => alert('Ошибка соединения'));
    }

    function approveDoc() {
        if (!viewDocId) return;
        if (!confirm('Отметить документ как проверенный?')) return;
        post('/api/documents/' + viewDocId + '/approve')
            .then(r => { if (r && r.success) loadDocument(); })
            .catch(() => alert('Ошибка соединения'));
    }

    function rejectDoc() {
        if (!viewDocId) return;
        const comment = prompt('Причина отклонения:');
        if (comment === null) return;
        if (comment.length > 1000) {
            alert('Слишком длинный комментарий (макс. 1000)');
            return;
        }
        post('/api/documents/' + viewDocId + '/reject', { comment: comment })
            .then(r => { if (r && r.success) loadDocument(); })
            .catch(() => alert('Ошибка соединения'));
    }

    function registerDoc() {
        if (!viewDocId) return;
        if (!confirm('Зарегистрировать документ? Будет присвоен номер.')) return;

        const user = getCurrentUser();
        const userId = user ? user.id : 0;

        post('/api/documents/' + viewDocId + '/register', { user_id: userId })
            .then(r => {
                if (r && r.success) {
                    alert('Документ зарегистрирован! Номер: ' + r.reg_number);
                    loadDocument();
                } else {
                    alert('Ошибка: ' + ((r && r.error) || 'неизвестная'));
                }
            })
            .catch(() => alert('Ошибка соединения'));
    }

    function goBack() {
        window.location.href = viewUser.role === 'admin'
            ? 'dashboard_admin.html'
            : 'dashboard_user.html';
    }

    function downloadWord() {
        if (!currentDoc) {
            alert('Документ ещё не загружен');
            return;
        }
        downloadWordFile(currentDoc);
    }

    window.editDocument = editDocument;
    window.submitDoc = submitDoc;
    window.approveDoc = approveDoc;
    window.rejectDoc = rejectDoc;
    window.registerDoc = registerDoc;
    window.goBack = goBack;
    window.downloadWord = downloadWord;

    loadDocument();
}