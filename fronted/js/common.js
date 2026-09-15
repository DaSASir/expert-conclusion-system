function escapeHtml(text) {
    if (text === null || text === undefined) return '';
    return String(text)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function logout() {
    try {
        localStorage.removeItem('currentUser');
    } catch (e) {}
    window.location.href = 'index.html';
}

function getCurrentUser() {
    try {
        const savedUser = localStorage.getItem('currentUser');
        if (!savedUser) return null;

        const user = JSON.parse(savedUser);

        if (!user || typeof user !== 'object') return null;
        if (!user.email || !user.role) return null;
        if (user.role !== 'user' && user.role !== 'admin') return null;

        return user;
    } catch (e) {
        return null;
    }
}

function requireAuth() {
    const user = getCurrentUser();
    if (!user) {
        try {
            localStorage.removeItem('currentUser');
        } catch (e) {}
        window.location.href = 'index.html';
        return null;
    }
    return user;
}

function getStatusName(status) {
    const names = {
        'draft': 'Черновик',
        'in_review': 'На проверке',
        'ready_to_sign': 'Готов к подписанию',
        'signed': 'Подписан',
        'rejected': 'Отклонен'
    };
    return names[status] || '—';
}

function showMessage(element, text, type) {
    if (!element) return;
    element.textContent = text;
    element.className = 'message message-' + (type || 'info');
}

function formatDateRu(dateStr) {
    if (!dateStr) return '«___» __________ 2025 г.';
    try {
        const parts = dateStr.split('-');
        if (parts.length !== 3) return dateStr;

        const year  = parseInt(parts[0]);
        const month = parseInt(parts[1]) - 1;
        const day   = parseInt(parts[2]);

        const months = [
            'января', 'февраля', 'марта', 'апреля', 'мая', 'июня',
            'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'
        ];

        return '«' + day + '» ' + months[month] + ' ' + year + ' г.';
    } catch (e) {
        return dateStr;
    }
}

function buildWordFromJson(doc) {
    const regNumber   = doc.reg_number || '_________';
    const dateStr     = formatDateRu(doc.doc_date);
    const author      = doc.author || '_____________';
    const authorPos   = doc.author_position || 'должность';
    const title       = doc.title || 'название материала';
    const department  = doc.department || '_________________';
    const description = doc.description || '_________________';
    const published   = doc.published || 'не публиковались';
    const conclusion  = doc.conclusion === 'разрешить' ? 'следует' : 'не следует';
    const publisher   = doc.publisher || 'издательство';
    const chairman    = doc.chairman || '_____________';
    const members     = doc.members || '_____________';
    const approved    = doc.approved || '_____________';
    const exportCtrl  = doc.export_control || '_____________';

    const conclusionFull = doc.conclusion === 'разрешить'
        ? 'разрешить открытую публикацию "' + title + '" в ' + publisher
        : 'запретить открытую публикацию "' + title + '"';

    return `
        <html xmlns:o="urn:schemas-microsoft-com:office:office" 
              xmlns:w="urn:schemas-microsoft-com:office:word" 
              xmlns="http://www.w3.org/TR/REC-html40">
        <head>
            <meta charset="UTF-8">
            <title>Экспертное заключение</title>
            <style>
                body { font-family: 'Times New Roman', Times, serif; font-size: 14px; margin: 50px; line-height: 1.6; }
                .approval { text-align: right; margin-bottom: 30px; }
                .doc-title { text-align: center; margin: 30px 0; }
                .doc-title h1 { font-size: 18px; font-weight: bold; margin: 0; }
                .doc-text { text-align: justify; margin: 20px 0; }
                .list { font-size: 12px; margin-left: 20px; }
            </style>
        </head>
        <body>
            <div class="approval">
                <div style="font-weight: bold;">УТВЕРЖДАЮ</div>
                <div>Проректор по научной и инновационной деятельности</div>
                <div>Томского государственного университета</div>
                <div style="margin-top: 10px;">
                    <span style="display: inline-block; width: 200px; border-bottom: 1px solid #000;">&nbsp;</span> А.В. Замятин
                </div>
                <div>${dateStr}</div>
            </div>

            <div class="doc-title">
                <h1>ЭКСПЕРТНОЕ ЗАКЛЮЧЕНИЕ № ${regNumber}</h1>
                <div style="font-weight: bold;">о возможности открытого опубликования</div>
            </div>

            <div class="doc-text">
                <p>Экспертная комиссия ${department}</p>
                <p>Федерального государственного автономного образовательного учреждения
                высшего образования «Национальный исследовательский Томский
                государственный университет» Министерства науки и высшего образования
                Российской Федерации, рассмотрев ${author} (${authorPos})</p>
                <p><u>«${title}»</u></p>
                <p>${description}</p>
                <p>подтверждает, что в материале: <strong>не содержится</strong></p>
                <p>информация с ограниченным доступом (Закон РФ «О государственной тайне»,
                Перечень сведений, подлежащих засекречиванию Минобрнауки РФ № 31с от 04.12.2023)</p>
                <p><strong>не содержится</strong></p>
                <p>информация, подпадающая под Списки контролируемых товаров, технологий,
                утверждённых постановлениями Правительства Российской Федерации:</p>
                <div class="list">
                    № 1299 от 19.07.2022 двойного назначения;<br>
                    № 1284 от 16.07.2022 химикатов, оборудования, технологий;<br>
                    № 1285 от 16.07.2022 ядерных, специальных неядерных материалов, соответствующих технологий;<br>
                    № 1286 от 16.07.2022 оборудование и материалы двойного назначения, применяемых в ядерных целях;<br>
                    № 1287 от 16.07.2022 микроорганизмов, токсинов, оборудования, технологий;<br>
                    № 1288 от 16.07.2022 оборудования, материалов, используемые при создании ракетного оружия
                </div>
                <p>Материалы публиковались в российских журналах ${published}</p>
                <p>На публикацию материалов ${conclusion}</p>
                <p><strong>Заключение:</strong> ${conclusionFull}</p>
            </div>

            <div style="margin-top: 30px;">
                <p><strong>Председатель комиссии</strong> ${chairman}</p>
                <p><strong>Члены комиссии</strong> ${members}</p>
            </div>

            <div style="margin-top: 30px;">
                <div style="font-weight: bold;">СОГЛАСОВАНО:</div>
                <div>Начальник первого отдела ${approved}</div>
                <div>Специалист по экспортному контролю ОНТИ НУ ${exportCtrl}</div>
                <div>${dateStr}</div>
            </div>
        </body>
        </html>
    `;
}

function parseWordToJson(htmlContent) {
    try {
        if (htmlContent.length > 5 * 1024 * 1024) {
            console.error('Файл слишком большой');
            return null;
        }

        const parser = new DOMParser();
        const doc = parser.parseFromString(htmlContent, 'text/html');
        const body = doc.body;
        if (!body) return null;

        const text = body.textContent;
        const data = {};

        const authorMatch = text.match(/рассмотрев\s*([^(]+)\(([^)]+)\)/);
        if (authorMatch) {
            data.author = authorMatch[1].trim();
            data.author_position = authorMatch[2].trim();
        }

        const titleMatch = text.match(/«([^»]+)»/);
        if (titleMatch) data.title = titleMatch[1].trim();

        const departmentMatch = text.match(/Экспертная комиссия\s*([^,\n]+)/);
        if (departmentMatch) data.department = departmentMatch[1].trim();

        const chairmanMatch = text.match(/Председатель комиссии\s*([^\n]+)/);
        if (chairmanMatch) data.chairman = chairmanMatch[1].trim();

        const membersMatch = text.match(/Члены комиссии\s*([^\n]+)/);
        if (membersMatch) data.members = membersMatch[1].trim();

        const approvedMatch = text.match(/Начальник первого отдела\s*([^\n]+)/);
        if (approvedMatch) data.approved = approvedMatch[1].trim();

        const exportMatch = text.match(/экспортному контролю ОНТИ НУ\s*([^\n]+)/);
        if (exportMatch) data.export_control = exportMatch[1].trim();

        const dateMatch = text.match(/«(\d+)»\s*([а-я]+)\s*(\d+)\s*г\./);
        if (dateMatch) {
            const months = {
                'января': 1, 'февраля': 2, 'марта': 3, 'апреля': 4,
                'мая': 5, 'июня': 6, 'июля': 7, 'августа': 8,
                'сентября': 9, 'октября': 10, 'ноября': 11, 'декабря': 12
            };
            const month = months[dateMatch[2].toLowerCase()];
            if (month) {
                const day = dateMatch[1].padStart(2, '0');
                const mon = String(month).padStart(2, '0');
                data.doc_date = dateMatch[3] + '-' + mon + '-' + day;
            }
        }

        if (Object.keys(data).length === 0) return null;
        return data;
    } catch (error) {
        console.error('Ошибка парсинга Word:', error);
        return null;
    }
}

function downloadWordFile(doc) {
    const content = buildWordFromJson(doc);
    const blob = new Blob([content], { type: 'application/msword;charset=utf-8' });

    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = (doc.reg_number || doc.title || 'Документ')
        .replace(/\s+/g, '_') + '.doc';

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(link.href);
}