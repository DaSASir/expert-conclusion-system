document.addEventListener('DOMContentLoaded', function() {
    const docUser = requireAuth();
    if (!docUser) return;

    document.getElementById('userName').textContent =
        docUser.name + ' (' + docUser.role + ')';

    const urlParams = new URLSearchParams(window.location.search);
    const editId = urlParams.get('id');
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
        preview.department.textContent = fields.department.value || '_________________';

        const authorText = fields.author.value
            ? fields.author.value + ' (' + (fields.authorPosition.value || 'должность') + ')'
            : '_________________';
        preview.author.textContent = authorText;

        preview.title.textContent = fields.title.value || '_________________';
        preview.description.textContent = fields.description.value || '_________________';
        preview.published.textContent = fields.published.value || '_____________';

        const conclusionText = fields.conclusion.value === 'разрешить' ? 'следует' : 'не следует';
        preview.conclusion.textContent = conclusionText;

        const conclusionFull = fields.conclusion.value === 'разрешить'
            ? 'разрешить открытую публикацию "' + (fields.title.value || 'название материала')
              + '" в ' + (fields.publisher.value || 'издательство')
            : 'запретить открытую публикацию "' + (fields.title.value || 'название материала') + '"';
        preview.conclusionText.textContent = conclusionFull;

        preview.chairman.textContent = fields.chairman.value || '_____________';
        preview.members.textContent = fields.members.value || '_____________';
        preview.approved.textContent = fields.approved.value || '_____________';
        preview.exportControl.textContent = fields.exportControl.value || '_____________';
        preview.date.textContent = formatDateRu(fields.date.value);
    }

    Object.values(fields).forEach(field => {
        if (!field) return;
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
        if (doc.doc_date)        fields.date.value = doc.doc_date;
        if (doc.author)          fields.author.value = doc.author;
        if (doc.author_position) fields.authorPosition.value = doc.author_position;
        if (doc.title)           fields.title.value = doc.title;
        if (doc.department)      fields.department.value = doc.department;
        if (doc.description)     fields.description.value = doc.description;
        if (doc.published)       fields.published.value = doc.published;
        if (doc.published_where) fields.publishedWhere.value = doc.published_where;
        if (doc.conclusion)      fields.conclusion.value = doc.conclusion;
        if (doc.publisher)       fields.publisher.value = doc.publisher;
        if (doc.chairman)        fields.chairman.value = doc.chairman;
        if (doc.members)         fields.members.value = doc.members;
        if (doc.approved)        fields.approved.value = doc.approved;
        if (doc.export_control)  fields.exportControl.value = doc.export_control;

        if (doc.reg_number && preview.number) {
            preview.number.textContent = doc.reg_number;
        }

        updatePreview();
    }

    function loadDocumentFromServer(id) {
        fetch('/api/documents/' + encodeURIComponent(id))
            .then(r => r.json())
            .then(doc => {
                if (doc.error) {
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

        fetch(url, {
            method: method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        })
            .then(r => r.json())
            .then(result => {
                if (result.success) {
                    showMessage(message, 'Документ сохранён!', 'success');
                    setTimeout(() => {
                        if (docUser.role === 'admin') {
                            window.location.href = 'dashboard_admin.html';
                        } else {
                            window.location.href = 'dashboard_user.html';
                        }
                    }, 1000);
                } else {
                    showMessage(message, 'Ошибка сохранения', 'error');
                }
            })
            .catch(() => showMessage(message, 'Ошибка подключения', 'error'));
    }

    function downloadWord() {
        const doc = collectJson();
        downloadWordFile(doc);
        showMessage(message, 'Документ скачан!', 'success');
    }

    if (fileInput) {
        fileInput.addEventListener('change', function(e) {
            const file = e.target.files[0];
            if (!file) return;

            if (file.size > 5 * 1024 * 1024) {
                showMessage(message, 'Файл слишком большой (макс. 5 МБ)', 'error');
                return;
            }

            fileName.textContent = 'Файл: ' + file.name;

            const reader = new FileReader();
            reader.onload = function(event) {
                const content = event.target.result;
                let doc = null;

                try {
                    doc = JSON.parse(content);
                } catch (e) {
                    // Не JSON — пробуем как Word
                    doc = parseWordToJson(content);
                }

                if (doc) {
                    fillFromJson(doc);
                    showMessage(message, 'Документ загружен!', 'success');
                } else {
                    showMessage(message, 'Не удалось извлечь данные', 'error');
                }
            };
            reader.readAsText(file);
        });
    }

    function goBackFromEditor() {
        if (docUser.role === 'admin') {
            window.location.href = 'dashboard_admin.html';
        } else {
            window.location.href = 'dashboard_user.html';
        }
    }

    window.saveDocument = saveDocument;
    window.downloadWord = downloadWord;
    window.goBackFromEditor = goBackFromEditor;

    if (editId) {
        loadDocumentFromServer(editId);
    }

    updatePreview();
});