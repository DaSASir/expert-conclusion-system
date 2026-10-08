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
    try { localStorage.removeItem('currentUser'); } catch (e) {}
    window.location.href = 'index.html';
}

function getCurrentUser() {
    try {
        const raw = localStorage.getItem('currentUser');
        if (!raw) return null;

        const user = JSON.parse(raw);
        if (!user || typeof user !== 'object' || Array.isArray(user)) return null;
        if (user.role !== 'user' && user.role !== 'admin') return null;
        if (typeof user.email !== 'string' || !user.email) return null;

        return {
            id: typeof user.id === 'number' ? user.id : 0,
            email: user.email,
            name: typeof user.name === 'string' ? user.name : '',
            role: user.role
        };
    } catch (e) {
        return null;
    }
}

function requireAuth() {
    const user = getCurrentUser();
    if (!user) {
        try { localStorage.removeItem('currentUser'); } catch (e) {}
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
    element.textContent = String(text);
    element.className = 'message message-' + (type || 'info');
}

function formatDateRu(dateStr) {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    if (parts.length !== 3) return dateStr;

    const year  = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const day   = parseInt(parts[2], 10);

    if (isNaN(year) || isNaN(month) || isNaN(day)) return dateStr;
    if (month < 0 || month > 11) return dateStr;

    const months = [
        'января', 'февраля', 'марта', 'апреля', 'мая', 'июня',
        'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'
    ];

    return '«' + day + '» ' + months[month] + ' ' + year + ' г.';
}

function safeFetch(url, options, timeoutMs) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs || 15000);
    const opts = Object.assign({}, options || {}, { signal: controller.signal });
    return fetch(url, opts).finally(() => clearTimeout(timer));
}

function parsePositiveInt(value) {
    const n = parseInt(value, 10);
    return (isNaN(n) || n <= 0 || n > 2147483647) ? null : n;
}

function looksLikeDate(value) {
    const v = String(value).trim();
    if (/^\d+$/.test(v)) return true;
    if (/^«?\d{1,2}»?\s+[а-яё]+\s+\d{4}/i.test(v)) return true;
    if (/^\d{4}-\d{2}-\d{2}$/.test(v)) return true;
    if (/^\d{1,2}[.\/]\d{1,2}[.\/]\d{2,4}$/.test(v)) return true;
    return false;
}

function isGarbageValue(value) {
    const v = String(value).trim();
    if (v.length < 3 || v.length > 500) return true;
    if (/^[\d\s.,;:№\-–—()«»"'\/\\]+$/.test(v)) return true;
    if (looksLikeDate(v)) return true;
    return false;
}

function looksLikePerson(value) {
    const v = String(value).trim();
    return v.length >= 2 && v.length <= 300 && !isGarbageValue(v);
}

function looksLikeTitle(value) {
    const v = String(value).trim();
    if (v.length < 3 || v.length > 500) return false;
    if (isGarbageValue(v)) return false;

    const lower = v.toLowerCase();
    const blacklist = [
        'университет', 'томский государственный',
        'о государственной тайне', 'экспертное заключение',
        'министерства науки', 'российской федерации',
        'правительства российской'
    ];
    for (const word of blacklist) {
        if (lower.indexOf(word) !== -1) return false;
    }
    return true;
}

function buildWordFromJson(doc) {
    const e = escapeHtml;
    const regNumber   = e(doc.reg_number || '');
    const dateStr     = e(formatDateRu(doc.doc_date));
    const author      = e(doc.author || '');
    const authorPos   = e(doc.author_position || '');
    const title       = e(doc.title || '');
    const department  = e(doc.department || '');
    const description = e(doc.description || '');
    const published   = e(doc.published || '');
    const publisher   = e(doc.publisher || '');
    const chairman    = e(doc.chairman || '');
    const members     = e(doc.members || '');
    const approved    = e(doc.approved || '');
    const exportCtrl  = e(doc.export_control || '');

    const conclusion  = doc.conclusion === 'разрешить' ? 'следует' : 'не следует';

    const headerNumber = regNumber ? (' № ' + regNumber) : '';

    let authorPart = author;
    if (authorPart && authorPos) authorPart += ' (' + authorPos + ')';
    else if (!authorPart && authorPos) authorPart = authorPos;

    let conclusionFull = '';
    if (doc.conclusion === 'разрешить') {
        conclusionFull = 'разрешить открытую публикацию';
        if (title) conclusionFull += ' "' + title + '"';
        if (publisher) conclusionFull += ' в ' + publisher;
    } else if (doc.conclusion === 'запретить') {
        conclusionFull = 'запретить открытую публикацию';
        if (title) conclusionFull += ' "' + title + '"';
    }

    const line = {
        dept:       department  ? `<p>Экспертная комиссия ${department}</p>` : '',
        author:     authorPart  ? `рассмотрев ${authorPart}` : 'рассмотрев',
        title:      title       ? `<p><u>«${title}»</u></p>` : '',
        descr:      description ? `<p>${description}</p>` : '',
        published:  published   ? `<p>Материалы публиковались в российских журналах ${published}</p>` : '',
        conclusion: (doc.conclusion === 'разрешить' || doc.conclusion === 'запретить')
            ? `<p>На публикацию материалов ${conclusion}</p>` : '',
        conclFull:  conclusionFull ? `<p><strong>Заключение:</strong> ${conclusionFull}</p>` : '',
        chairman:   chairman    ? `<p><strong>Председатель комиссии</strong> ${chairman}</p>` : '',
        members:    members     ? `<p><strong>Члены комиссии</strong> ${members}</p>` : '',
        approved:   approved    ? `<div>Начальник первого отдела ${approved}</div>` : '',
        export:     exportCtrl  ? `<div>Специалист по экспортному контролю ОНТИ НУ ${exportCtrl}</div>` : '',
        date:       dateStr     ? `<div>${dateStr}</div>` : ''
    };

    return `<!DOCTYPE html>
<html xmlns:o="urn:schemas-microsoft-com:office:office"
      xmlns:w="urn:schemas-microsoft-com:office:word"
      xmlns="http://www.w3.org/TR/REC-html40">
<head>
<meta charset="UTF-8">
<title>Экспертное заключение</title>
<style>
    body { font-family: 'Times New Roman', Times, serif; font-size: 14px; margin: 50px; line-height: 1.6; color: #000; background: #fff; }
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
    ${line.date}
</div>

<div class="doc-title">
    <h1>ЭКСПЕРТНОЕ ЗАКЛЮЧЕНИЕ${headerNumber}</h1>
    <div style="font-weight: bold;">о возможности открытого опубликования</div>
</div>

<div class="doc-text">
    ${line.dept}
    <p>Федерального государственного автономного образовательного учреждения
    высшего образования «Национальный исследовательский Томский
    государственный университет» Министерства науки и высшего образования
    Российской Федерации, ${line.author}</p>
    ${line.title}
    ${line.descr}
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
    ${line.published}
    ${line.conclusion}
    ${line.conclFull}
</div>

<div style="margin-top: 30px;">
    ${line.chairman}
    ${line.members}
</div>

<div style="margin-top: 30px;">
    <div style="font-weight: bold;">СОГЛАСОВАНО:</div>
    ${line.approved}
    ${line.export}
    ${line.date}
</div>
</body>
</html>`;
}

function parseWordToJson(htmlContent) {
    try {
        if (typeof htmlContent !== 'string') return null;
        if (htmlContent.length > 5 * 1024 * 1024) return null;

        const head = htmlContent.slice(0, 2000).toLowerCase();
        if (head.indexOf('<html') === -1
            && head.indexOf('<?xml') === -1
            && head.indexOf('<w:worddocument') === -1) return null;

        const parsed = new DOMParser().parseFromString(htmlContent, 'text/html');
        const body = parsed.body;
        if (!body) return null;

        const text = body.textContent.replace(/\u00a0/g, ' ').replace(/\s+/g, ' ').trim();
        const data = {};

        const authorMatch = text.match(/рассмотрев\s+([^(),;]+?)\s*\(([^)]+)\)/);
        if (authorMatch) {
            const a = authorMatch[1].trim();
            const p = authorMatch[2].trim();
            if (looksLikePerson(a)) data.author = a;
            if (looksLikePerson(p)) data.author_position = p;
        }

        const titleMatch = text.match(/рассмотрев[\s\S]*?\([^)]+\)\s*«([^»]+)»/);
        if (titleMatch && looksLikeTitle(titleMatch[1].trim())) {
            data.title = titleMatch[1].trim();
        }

        if (!data.title) {
            const afterIdx = authorMatch
                ? text.indexOf(authorMatch[0]) + authorMatch[0].length
                : -1;
            const re = /«([^»]+)»/g;
            let m;
            while ((m = re.exec(text)) !== null) {
                if (afterIdx !== -1 && m.index < afterIdx) continue;
                if (looksLikeTitle(m[1].trim())) {
                    data.title = m[1].trim();
                    break;
                }
            }
        }

        const deptMatch = text.match(/Экспертная комиссия\s+([^\n]+?)(?:\s+Федерального|$)/);
        if (deptMatch && !isGarbageValue(deptMatch[1].trim())) {
            data.department = deptMatch[1].trim();
        }

        const chairmanMatch = text.match(/Председатель комиссии\s+(.+?)(?:\s+Члены|$)/);
        if (chairmanMatch && looksLikePerson(chairmanMatch[1].trim())) {
            data.chairman = chairmanMatch[1].trim();
        }

        const membersMatch = text.match(/Члены комиссии\s+(.+?)(?:\s+СОГЛАСОВАНО|$)/);
        if (membersMatch && !isGarbageValue(membersMatch[1].trim())) {
            data.members = membersMatch[1].trim();
        }

        const approvedMatch = text.match(/Начальник первого отдела\s+(.+?)(?:\s+Специалист|$)/);
        if (approvedMatch && looksLikePerson(approvedMatch[1].trim())) {
            data.approved = approvedMatch[1].trim();
        }

        const exportMatch = text.match(/экспортному контролю ОНТИ НУ\s+(.+?)(?:\s+«|$)/);
        if (exportMatch && looksLikePerson(exportMatch[1].trim())) {
            data.export_control = exportMatch[1].trim();
        }

        const dateMatch = text.match(/«\s*(\d{1,2})\s*»\s*([а-яё]+)\s*(\d{4})\s*г\./i);
        if (dateMatch) {
            const months = {
                'января': 1, 'февраля': 2, 'марта': 3, 'апреля': 4,
                'мая': 5, 'июня': 6, 'июля': 7, 'августа': 8,
                'сентября': 9, 'октября': 10, 'ноября': 11, 'декабря': 12
            };
            const month = months[dateMatch[2].toLowerCase()];
            if (month) {
                data.doc_date = dateMatch[3] + '-'
                    + String(month).padStart(2, '0') + '-'
                    + dateMatch[1].padStart(2, '0');
            }
        }

        return Object.keys(data).length ? data : null;
    } catch (error) {
        console.error('Ошибка парсинга Word:', error);
        return null;
    }
}

function downloadWordFile(doc) {
    try {
        const blob = new Blob([buildWordFromJson(doc)],
            { type: 'application/msword;charset=utf-8' });

        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = (doc.reg_number || doc.title || 'Документ')
            .toString()
            .replace(/[^\wа-яА-ЯёЁ\-\.]+/g, '_')
            .slice(0, 100) + '.doc';

        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(link.href);
    } catch (e) {
        alert('Не удалось скачать документ');
    }
}