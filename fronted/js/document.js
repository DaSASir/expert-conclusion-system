document.addEventListener('DOMContentLoaded', function () {
    const docUser = requireAuth();
    if (!docUser) return;

    const userNameEl = document.getElementById('userName');
    if (userNameEl) userNameEl.textContent = docUser.name + ' (' + docUser.role + ')';

    const editId = parsePositiveInt(new URLSearchParams(window.location.search).get('id'));
    const isAdmin = docUser.role === 'admin';

    if (isAdmin && !editId) {
        window.location.href = 'dashboard_admin.html';
        return;
    }

    const fields = {
        date:            document.getElementById('docDate'),
        author:          document.getElementById('docAuthor'),
        authorPosition:  document.getElementById('docAuthorPosition'),
        title:           document.getElementById('docTitle'),
        department:      document.getElementById('docDepartment'),
        description:     document.getElementById('docDescription'),
        published:       document.getElementById('docPublished'),
        publishedWhere:  document.getElementById('docPublishedWhere'),
        conclusion:      document.getElementById('docConclusion'),
        publisher:       document.getElementById('docPublisher'),
        chairman:        document.getElementById('docChairman'),
        members:         document.getElementById('docMembers'),
        approved:        document.getElementById('docApproved'),
        exportControl:   document.getElementById('docExportControl')
    };

    const preview = {
        number:          document.getElementById('previewNumber'),
        department:      document.getElementById('previewDepartment'),
        author:          document.getElementById('previewAuthor'),
        title:           document.getElementById('previewTitle'),
        description:     document.getElementById('previewDescription'),
        published:       document.getElementById('previewPublished'),
        conclusion:      document.getElementById('previewConclusion'),
        conclusionText:  document.getElementById('previewConclusionText'),
        chairman:        document.getElementById('previewChairman'),
        members:         document.getElementById('previewMembers'),
        approved:        document.getElementById('previewApproved'),
        exportControl:   document.getElementById('previewExportControl'),
        date:            document.getElementById('previewDate')
    };

    const message = document.getElementById('message');
    const fileInput = document.getElementById('fileInput');
    const fileName = document.getElementById('fileName');

    function updatePreview() {
        preview.department.textContent =
            fields.department.value || '_________________';

        preview.author.textContent = fields.author.value
            ? fields.author.value + ' (' + (fields.authorPosition.value || 'должность') + ')'
            : '_________________';

        preview.title.textContent       = fields.title.value       || '_________________';
        preview.description.textContent = fields.description.value || '_________________';
        preview.published.textContent   = fields.published.value   || '_____________';

        const conclusionText = fields.conclusion.value === 'разрешить' ? 'следует' : 'не следует';
        preview.conclusion.textContent = conclusionText;

        const t = fields.title.value || 'название материала';
        preview.conclusionText.textContent = fields.conclusion.value === 'разрешить'
            ? 'разрешить открытую публикацию "' + t + '" в ' +
              (fields.publisher.value || 'издательство')
            : 'запретить открытую публикацию "' + t + '"';

        preview.chairman.textContent     = fields.chairman.value     || '_____________';
        preview.members.textContent      = fields.members.value      || '_____________';
        preview.approved.textContent     = fields.approved.value     || '_____________';
        preview.exportControl.textContent = fields.exportControl.value || '_____________';
        preview.date.textContent         = formatDateRu(fields.date.value);
    }

    Object.values(fields).forEach(field => {
        field.addEventListener('input', updatePreview);
        field.addEventListener('change', updatePreview);
    });

    function collectJson() {
        return {
            doc_date:        fields.date.value,
            author:          fields.author.value,
            author_position: fields.authorPosition.value,
            title:           fields.title.value,
            department:      fields.department.value,
            description:     fields.description.value,
            published:       fields.published.value,
            published_where: fields.publishedWhere.value,
            conclusion:      fields.conclusion.value,
            publisher:       fields.publisher.value,
            chairman:        fields.chairman.value,
            members:         fields.members.value,
            approved:        fields.approved.value,
            export_control:  fields.exportControl.value,
            status:          'draft',
            author_email:    docUser.email
        };
    }

    function fillFromJson(doc) {
        if (!doc) return;

        const map = {
            doc_date:        fields.date,
            author:          fields.author,
            author_position: fields.authorPosition,
            title:           fields.title,
            department:      fields.department,
            description:     fields.description,
            published:       fields.published,
            published_where: fields.publishedWhere,
            conclusion:      fields.conclusion,
            publisher:       fields.publisher,
            chairman:        fields.chairman,
            members:         fields.members,
            approved:        fields.approved,
            export_control:  fields.exportControl
        };

        for (const key in map) {
            if (doc[key]) map[key].value = doc[key];
        }

        if (doc.reg_number) preview.number.textContent = doc.reg_number;

        updatePreview();
    }

    function loadDocumentFromServer(id) {
        safeFetch('/api/documents/' + encodeURIComponent(id))
            .then(r => {
                if (!r.ok) throw new Error('HTTP ' + r.status);
                return r.json();
            })
            .then(doc => {
                if (doc && doc.error) {
                    showMessage(message, 'Ошибка загрузки', 'error');
                    return;
                }
                fillFromJson(doc);
            })
            .catch(() => showMessage(message, 'Ошибка загрузки', 'error'));
    }

    function saveDocument() {
        const data = collectJson();

        if (!data.title || data.title.length > 500) {
            showMessage(message, 'Введите название (до 500 символов)', 'error');
            return;
        }

        let url = '/api/documents';
        let method = 'POST';
        if (editId) {
            url += '/' + encodeURIComponent(editId);
            method = 'PUT';
        }

        safeFetch(url, {
            method: method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        })
            .then(r => r.json())
            .then(result => {
                if (result && result.success) {
                    showMessage(message, 'Документ сохранён!', 'success');
                    setTimeout(() => {
                        window.location.href = docUser.role === 'admin'
                            ? 'dashboard_admin.html'
                            : 'dashboard_user.html';
                    }, 1000);
                } else {
                    showMessage(message, 'Ошибка сохранения', 'error');
                }
            })
            .catch(() => showMessage(message, 'Ошибка подключения', 'error'));
    }

    function downloadWord() {
        downloadWordFile(collectJson());
        showMessage(message, 'Документ скачан!', 'success');
    }

    if (fileInput) {
        fileInput.addEventListener('change', function (e) {
            const file = e.target.files[0];
            if (!file) return;

            if (file.size > 5 * 1024 * 1024) {
                showMessage(message, 'Файл слишком большой (макс. 5 МБ)', 'error');
                fileInput.value = '';
                return;
            }

            const lower = file.name.toLowerCase();
            if (lower.endsWith('.docx')) {
                showMessage(message,
                    'Формат .docx не поддерживается. Сохраните файл как .doc или .json.',
                    'error');
                fileInput.value = '';
                return;
            }
            if (!lower.endsWith('.doc') && !lower.endsWith('.json')) {
                showMessage(message, 'Поддерживаются только .doc и .json', 'error');
                fileInput.value = '';
                return;
            }

            fileName.textContent = 'Файл: ' + file.name;

            const reader = new FileReader();
            reader.onload = function (event) {
                const content = event.target.result;
                let doc = null;

                if (lower.endsWith('.json')) {
                    try { doc = JSON.parse(content); } catch (e) { doc = null; }
                } else {
                    doc = parseWordToJson(content);
                }

                if (doc) {
                    fillFromJson(doc);
                    showMessage(message, 'Документ загружен!', 'success');
                } else {
                    showMessage(message, 'Не удалось извлечь данные из файла', 'error');
                }
            };
            reader.readAsText(file);
        });
    }

    function goBackFromEditor() {
        window.location.href = docUser.role === 'admin'
            ? 'dashboard_admin.html'
            : 'dashboard_user.html';
    }

    window.saveDocument = saveDocument;
    window.downloadWord = downloadWord;
    window.goBackFromEditor = goBackFromEditor;

    if (editId) loadDocumentFromServer(editId);
    updatePreview();
});