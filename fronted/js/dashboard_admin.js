const adminUser = requireAuth();
if (!adminUser) {
} else if (adminUser.role !== 'admin') {
    window.location.href = 'dashboard_user.html';
} else {
    document.getElementById('userName').textContent =
        adminUser.name + ' (' + adminUser.role + ')';
}

function loadAllDocuments() {
    const status = document.getElementById('statusFilter').value;
    let url = '/api/all-documents';
    if (status) {
        url += '?status=' + encodeURIComponent(status);
    }

    fetch(url)
        .then(response => {
            if (!response.ok) throw new Error('HTTP ' + response.status);
            return response.json();
        })
        .then(docs => {
            const container = document.getElementById('documentsList');

            if (!docs || docs.length === 0) {
                container.innerHTML = '<p>Нет документов с выбранным статусом</p>';
                return;
            }

            let html = '<table>';
            html += '<tr>';
            html += '<th>№</th>';
            html += '<th>Рег. номер</th>';
            html += '<th>Автор</th>';
            html += '<th>Название</th>';
            html += '<th>Дата документа</th>';
            html += '<th>Статус</th>';
            html += '<th>Действия</th>';
            html += '</tr>';

            docs.forEach((doc, i) => {
                html += '<tr>';
                html += '<td>' + (i + 1) + '</td>';
                html += '<td>' + escapeHtml(doc.reg_number || '—') + '</td>';
                html += '<td>' + escapeHtml(doc.author || '—') + '</td>';
                html += '<td>' + escapeHtml(doc.title || '—') + '</td>';
                html += '<td>' + escapeHtml(doc.doc_date || '') + '</td>';
                html += '<td>' + escapeHtml(getStatusName(doc.status)) + '</td>';
                html += '<td>';
                html += '<button onclick="openDocument(' + doc.id + ')">Открыть документ</button>';
                html += '</td></tr>';
            });

            html += '</table>';
            container.innerHTML = html;
        })
        .catch(error => {
            document.getElementById('documentsList').innerHTML =
                '<p>Ошибка загрузки</p>';
            console.error('Ошибка:', error);
        });
}

function openDocument(id) {
    window.location.href = 'view_document.html?id=' + encodeURIComponent(id) + '&admin=1';
}

loadAllDocuments();