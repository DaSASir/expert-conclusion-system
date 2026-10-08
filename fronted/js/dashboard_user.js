const currentUser = requireAuth();
if (!currentUser) {
} else if (currentUser.role === 'admin') {
    window.location.href = 'dashboard_admin.html';
} else {
    const el = document.getElementById('userName');
    if (el) el.textContent = currentUser.name + ' (' + currentUser.role + ')';

    loadDocuments();
}

function loadDocuments() {
    const user = getCurrentUser();
    if (!user) return;

    const status = document.getElementById('statusFilter').value;
    let url = '/api/documents?user=' + encodeURIComponent(user.email);
    if (status) url += '&status=' + encodeURIComponent(status);

    safeFetch(url)
        .then(r => {
            if (!r.ok) throw new Error('HTTP ' + r.status);
            return r.json();
        })
        .then(docs => {
            const container = document.getElementById('documentsList');

            if (!Array.isArray(docs) || !docs.length) {
                container.innerHTML = '<p>У вас пока нет документов</p>';
                return;
            }

            let html = '<table><tr>'
                + '<th>№</th><th>Номер</th><th>Название</th>'
                + '<th>Дата</th><th>Статус</th><th>Действия</th></tr>';

            docs.forEach((doc, i) => {
                const id = parsePositiveInt(doc.id);
                html += '<tr>'
                    + '<td>' + (i + 1) + '</td>'
                    + '<td>' + escapeHtml(doc.reg_number || '—') + '</td>'
                    + '<td>' + escapeHtml(doc.title || '—') + '</td>'
                    + '<td>' + escapeHtml(doc.created_at || '') + '</td>'
                    + '<td>' + escapeHtml(getStatusName(doc.status)) + '</td>'
                    + '<td>' + (id !== null
                        ? '<button type="button" data-open-id="' + id + '">Открыть документ</button>'
                        : '—') + '</td>'
                    + '</tr>';
            });
            html += '</table>';
            container.innerHTML = html;

            container.querySelectorAll('button[data-open-id]').forEach(btn => {
                btn.addEventListener('click', function () {
                    const id = parsePositiveInt(this.getAttribute('data-open-id'));
                    if (id !== null) window.location.href = 'view_document.html?id=' + id;
                });
            });
        })
        .catch(err => {
            document.getElementById('documentsList').innerHTML =
                '<p>Ошибка загрузки документов</p>';
            console.error(err);
        });
}

function createDocument() {
    window.location.href = 'document.html';
}

function refreshList() {
    loadDocuments();
}