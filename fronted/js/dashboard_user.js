const currentUser = requireAuth();
if (!currentUser) {
} else if (currentUser.role === 'admin') {
    window.location.href = 'dashboard_admin.html';
} else {
    document.getElementById('userName').textContent =
        currentUser.name + ' (' + currentUser.role + ')';
}

function loadDocuments() {
    const u = getCurrentUser();
    if (!u) return;

    const statusFilter = document.getElementById('statusFilter');
    const status = statusFilter ? statusFilter.value : '';

    let url = '/api/documents?user=' + encodeURIComponent(u.email);
    if (status) {
        url += '&status=' + encodeURIComponent(status);
    }

    fetch(url)
        .then(response => {
            if (!response.ok) throw new Error('HTTP ' + response.status);
            return response.json();
        })
        .then(docs => {
            const container = document.getElementById('documentsList');
            if (!container) return;

            if (!docs || docs.length === 0) {
                container.innerHTML = '<p>У вас пока нет документов</p>';
                return;
            }

            let html = '<table>';
            html += '<tr>';
            html += '<th>№</th><th>Номер</th><th>Название</th>';
            html += '<th>Дата</th><th>Статус</th><th>Действия</th>';
            html += '</tr>';

            docs.forEach((doc, i) => {
                html += '<tr>';
                html += '<td>' + (i + 1) + '</td>';
                html += '<td>' + escapeHtml(doc.reg_number || '—') + '</td>';
                html += '<td>' + escapeHtml(doc.title || '—') + '</td>';
                html += '<td>' + escapeHtml(doc.created_at || '') + '</td>';
                html += '<td>' + escapeHtml(getStatusName(doc.status)) + '</td>';
                html += '<td>';
                html += '<button onclick="openDocument(' + doc.id + ')">Открыть документ</button>';
                html += '</td></tr>';
            });

            html += '</table>';
            container.innerHTML = html;
        })
        .catch(err => {
            const container = document.getElementById('documentsList');
            if (container) {
                container.innerHTML = '<p>Ошибка загрузки документов</p>';
            }
            console.error('Ошибка:', err);
        });
}

function createDocument() {
    window.location.href = 'document.html';
}

function openDocument(id) {
    window.location.href = 'view_document.html?id=' + encodeURIComponent(id);
}

function refreshList() {
    loadDocuments();
}

loadDocuments();