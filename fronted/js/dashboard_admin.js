const adminUser = requireAuth();
if (!adminUser) {
} else if (adminUser.role !== 'admin') {
    window.location.href = 'dashboard_user.html';
} else {
    const el = document.getElementById('userName');
    if (el) el.textContent = adminUser.name + ' (' + adminUser.role + ')';

    loadAllDocuments();
}

function loadAllDocuments() {
    const status = document.getElementById('statusFilter').value;
    let url = '/api/all-documents';
    if (status) url += '?status=' + encodeURIComponent(status);

    safeFetch(url)
        .then(r => {
            if (!r.ok) throw new Error('HTTP ' + r.status);
            return r.json();
        })
        .then(docs => {
            const container = document.getElementById('documentsList');

            if (!Array.isArray(docs) || !docs.length) {
                container.innerHTML = '<p>Нет документов с выбранным статусом</p>';
                return;
            }

            let html = '<table><tr>'
                + '<th>№</th><th>Рег. номер</th><th>Автор</th>'
                + '<th>Название</th><th>Дата документа</th>'
                + '<th>Статус</th><th>Действия</th></tr>';

            docs.forEach((doc, i) => {
                const id = parsePositiveInt(doc.id);
                html += '<tr>'
                    + '<td>' + (i + 1) + '</td>'
                    + '<td>' + escapeHtml(doc.reg_number || '—') + '</td>'
                    + '<td>' + escapeHtml(doc.author || '—') + '</td>'
                    + '<td>' + escapeHtml(doc.title || '—') + '</td>'
                    + '<td>' + escapeHtml(doc.doc_date || '') + '</td>'
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
                    if (id !== null) {
                        window.location.href = 'view_document.html?id=' + id + '&admin=1';
                    }
                });
            });
        })
        .catch(err => {
            document.getElementById('documentsList').innerHTML =
                '<p>Ошибка загрузки</p>';
            console.error(err);
        });
}