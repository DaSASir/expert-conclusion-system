#include "DocumentRepository.h"
#include "Database.h"
#include <libpq-fe.h>

static const char* FIELDS =
"id, "
"COALESCE(reg_number,''), "
"COALESCE(reg_date::text,''), "
"COALESCE(doc_date::text,''), "
"author, author_position, author_email, "
"title, department, description, published, published_where, conclusion, "
"publisher, chairman, members, approved, export_control, status, admin_comment, "
"created_at::text, updated_at::text, "
"COALESCE(registered_at::text,''), "
"COALESCE(registered_by, 0)";


static std::string get(PGresult* r, int row, int col) {
    if (PQgetisnull(r, row, col)) {
        return "";
    }
    return std::string(PQgetvalue(r, row, col));
}

static Document rowToDocument(PGresult* r, int row) {
    Document d;

    d.id = std::stoi(get(r, row, 0));
    d.reg_number = get(r, row, 1);
    d.reg_date = get(r, row, 2);
    d.doc_date = get(r, row, 3);
    d.author = get(r, row, 4);
    d.author_position = get(r, row, 5);
    d.author_email = get(r, row, 6);
    d.title = get(r, row, 7);
    d.department = get(r, row, 8);
    d.description = get(r, row, 9);
    d.published = get(r, row, 10);
    d.published_where = get(r, row, 11);
    d.conclusion = get(r, row, 12);
    d.publisher = get(r, row, 13);
    d.chairman = get(r, row, 14);
    d.members = get(r, row, 15);
    d.approved = get(r, row, 16);
    d.export_control = get(r, row, 17);
    d.status = get(r, row, 18);
    d.admin_comment = get(r, row, 19);
    d.created_at = get(r, row, 20);
    d.updated_at = get(r, row, 21);
    d.registered_at = get(r, row, 22);
    d.registered_by = std::stoi(get(r, row, 23));

    return d;
}

static void parseDocNumber(const std::string& number, int& baseNum, int& subNum) {
    baseNum = 0;
    subNum = 0;

    if (number.empty()) {
        return;
    }

    size_t lastDash = number.rfind('-');
    if (lastDash == std::string::npos) {
        return;
    }

    std::string tail = number.substr(lastDash + 1);

    size_t dot = tail.find('.');
    if (dot == std::string::npos) {
        baseNum = std::stoi(tail);
    }
    else {
        baseNum = std::stoi(tail.substr(0, dot));
        subNum = std::stoi(tail.substr(dot + 1));
    }
}

static std::string pad3(int n) {
    std::string s = std::to_string(n);
    while (s.length() < 3) {
        s = "0" + s;
    }
    return s;
}


std::vector<Document> DocumentRepository::findByUser(
    const std::string& email, const std::string& status) {

    std::vector<Document> result;

    Database db;
    if (!db.isOpen()) {
        return result;
    }

    std::string sql = "SELECT ";
    sql += FIELDS;
    sql += " FROM documents WHERE 1=1";

    std::vector<std::string> values;

    if (!email.empty()) {
        sql += " AND author_email = $" + std::to_string(values.size() + 1);
        values.push_back(email);
    }
    if (!status.empty()) {
        sql += " AND status = $" + std::to_string(values.size() + 1);
        values.push_back(status);
    }

    sql += " ORDER BY id DESC LIMIT 1000";

    std::vector<const char*> ptrs;
    for (auto& v : values) {
        ptrs.push_back(v.c_str());
    }

    PGresult* r = PQexecParams(db.get(), sql.c_str(),
        (int)ptrs.size(), nullptr,
        ptrs.empty() ? nullptr : ptrs.data(),
        nullptr, nullptr, 0);

    if (PQresultStatus(r) == PGRES_TUPLES_OK) {
        for (int i = 0; i < PQntuples(r); i++) {
            result.push_back(rowToDocument(r, i));
        }
    }

    PQclear(r);
    return result;
}

std::vector<Document> DocumentRepository::findAll(const std::string& status) {
    std::vector<Document> result;

    Database db;
    if (!db.isOpen()) {
        return result;
    }

    std::string sql = "SELECT ";
    sql += FIELDS;
    sql += " FROM documents";

    PGresult* r;

    if (!status.empty()) {
        sql += " WHERE status = $1 ORDER BY id DESC LIMIT 1000";
        const char* p[1] = { status.c_str() };
        r = PQexecParams(db.get(), sql.c_str(), 1, nullptr, p, nullptr, nullptr, 0);
    }
    else {
        sql += " ORDER BY id DESC LIMIT 1000";
        r = PQexec(db.get(), sql.c_str());
    }

    if (PQresultStatus(r) == PGRES_TUPLES_OK) {
        for (int i = 0; i < PQntuples(r); i++) {
            result.push_back(rowToDocument(r, i));
        }
    }

    PQclear(r);
    return result;
}

bool DocumentRepository::findById(int id, Document& result) {
    Database db;
    if (!db.isOpen()) {
        return false;
    }

    std::string sql = "SELECT ";
    sql += FIELDS;
    sql += " FROM documents WHERE id = $1";

    std::string idStr = std::to_string(id);
    const char* p[1] = { idStr.c_str() };

    PGresult* r = PQexecParams(db.get(), sql.c_str(),
        1, nullptr, p, nullptr, nullptr, 0);

    bool found = false;

    if (PQresultStatus(r) == PGRES_TUPLES_OK && PQntuples(r) > 0) {
        result = rowToDocument(r, 0);
        found = true;
    }

    PQclear(r);
    return found;
}

int DocumentRepository::create(const Document& d) {
    Database db;
    if (!db.isOpen()) {
        return -1;
    }

    const char* sql =
        "INSERT INTO documents ("
        "doc_date, author, author_position, author_email, "
        "title, department, description, published, published_where, "
        "conclusion, publisher, chairman, members, approved, export_control, status"
        ") VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16) "
        "RETURNING id";

    std::string pub = "not published";
    if (!d.published.empty()) {
        pub = d.published;
    }

    std::string con = "allow";
    if (!d.conclusion.empty()) {
        con = d.conclusion;
    }

    const char* p[16] = {
        d.doc_date.empty() ? nullptr : d.doc_date.c_str(),
        d.author.empty() ? nullptr : d.author.c_str(),
        d.author_position.empty() ? nullptr : d.author_position.c_str(),
        d.author_email.empty() ? nullptr : d.author_email.c_str(),
        d.title.c_str(),
        d.department.empty() ? nullptr : d.department.c_str(),
        d.description.empty() ? nullptr : d.description.c_str(),
        pub.c_str(),
        d.published_where.empty() ? nullptr : d.published_where.c_str(),
        con.c_str(),
        d.publisher.empty() ? nullptr : d.publisher.c_str(),
        d.chairman.empty() ? nullptr : d.chairman.c_str(),
        d.members.empty() ? nullptr : d.members.c_str(),
        d.approved.empty() ? nullptr : d.approved.c_str(),
        d.export_control.empty() ? nullptr : d.export_control.c_str(),
        d.status.c_str()
    };

    PGresult* r = PQexecParams(db.get(), sql,
        16, nullptr, p, nullptr, nullptr, 0);

    if (PQresultStatus(r) != PGRES_TUPLES_OK) {
        PQclear(r);
        return -1;
    }

    int newId = std::stoi(PQgetvalue(r, 0, 0));
    PQclear(r);
    return newId;
}

bool DocumentRepository::update(const Document& d) {
    Database db;
    if (!db.isOpen()) {
        return false;
    }

    const char* sql =
        "UPDATE documents SET "
        "doc_date=$1, author=$2, author_position=$3, "
        "title=$4, department=$5, description=$6, published=$7, published_where=$8, "
        "conclusion=$9, publisher=$10, chairman=$11, members=$12, approved=$13, "
        "export_control=$14, status=$15, updated_at=CURRENT_TIMESTAMP "
        "WHERE id=$16";

    std::string pub = "not published";
    if (!d.published.empty()) {
        pub = d.published;
    }

    std::string con = "allow";
    if (!d.conclusion.empty()) {
        con = d.conclusion;
    }

    std::string idStr = std::to_string(d.id);

    const char* p[16] = {
        d.doc_date.empty() ? nullptr : d.doc_date.c_str(),
        d.author.empty() ? nullptr : d.author.c_str(),
        d.author_position.empty() ? nullptr : d.author_position.c_str(),
        d.title.c_str(),
        d.department.empty() ? nullptr : d.department.c_str(),
        d.description.empty() ? nullptr : d.description.c_str(),
        pub.c_str(),
        d.published_where.empty() ? nullptr : d.published_where.c_str(),
        con.c_str(),
        d.publisher.empty() ? nullptr : d.publisher.c_str(),
        d.chairman.empty() ? nullptr : d.chairman.c_str(),
        d.members.empty() ? nullptr : d.members.c_str(),
        d.approved.empty() ? nullptr : d.approved.c_str(),
        d.export_control.empty() ? nullptr : d.export_control.c_str(),
        d.status.c_str(),
        idStr.c_str()
    };

    PGresult* r = PQexecParams(db.get(), sql,
        16, nullptr, p, nullptr, nullptr, 0);

    bool ok = (PQresultStatus(r) == PGRES_COMMAND_OK);
    PQclear(r);
    return ok;
}

bool DocumentRepository::updateStatus(int id, const std::string& status,
    const std::string& comment) {
    Database db;
    if (!db.isOpen()) {
        return false;
    }

    std::string idStr = std::to_string(id);
    PGresult* r;

    if (comment.empty()) {
        const char* sql =
            "UPDATE documents SET status=$1, updated_at=CURRENT_TIMESTAMP WHERE id=$2";
        const char* p[2] = { status.c_str(), idStr.c_str() };
        r = PQexecParams(db.get(), sql, 2, nullptr, p, nullptr, nullptr, 0);
    }
    else {
        const char* sql =
            "UPDATE documents SET status=$1, admin_comment=$2, "
            "updated_at=CURRENT_TIMESTAMP WHERE id=$3";
        const char* p[3] = { status.c_str(), comment.c_str(), idStr.c_str() };
        r = PQexecParams(db.get(), sql, 3, nullptr, p, nullptr, nullptr, 0);
    }

    bool ok = (PQresultStatus(r) == PGRES_COMMAND_OK);
    PQclear(r);
    return ok;
}

std::string DocumentRepository::generateDocNumber(const std::string& doc_date) {
    if (doc_date.empty()) {
        return "";
    }

    Database db;
    if (!db.isOpen()) {
        return "";
    }

    std::string year = doc_date.substr(0, 4);

    std::string sql =
        "SELECT reg_number, doc_date::text FROM documents "
        "WHERE EXTRACT(YEAR FROM doc_date) = $1 "
        "  AND reg_number IS NOT NULL AND reg_number != '' "
        "ORDER BY doc_date ASC";

    const char* params[1] = { year.c_str() };
    PGresult* r = PQexecParams(db.get(), sql.c_str(), 1, nullptr, params, nullptr, nullptr, 0);

    std::vector<std::pair<std::string, std::string>> docs;

    if (PQresultStatus(r) == PGRES_TUPLES_OK) {
        for (int i = 0; i < PQntuples(r); i++) {
            std::string num = PQgetvalue(r, i, 0);
            std::string date = PQgetvalue(r, i, 1);
            docs.push_back({ num, date });
        }
    }
    PQclear(r);

    if (docs.empty()) {
        return "EK-" + year + "-001";
    }

    int lastIdx = -1;
    int nextIdx = -1;

    for (size_t i = 0; i < docs.size(); i++) {
        if (docs[i].second <= doc_date) {
            lastIdx = (int)i;
        }
        else {
            nextIdx = (int)i;
            break;
        }
    }

    if (nextIdx == -1) {
        std::string lastNum = docs.back().first;
        int baseNum = 0, subNum = 0;
        parseDocNumber(lastNum, baseNum, subNum);

        if (subNum == 0) {
            baseNum++;
            return "EK-" + year + "-" + pad3(baseNum);
        }
        else {
            subNum++;
            return "EK-" + year + "-" + pad3(baseNum) + "." + std::to_string(subNum);
        }
    }

    if (lastIdx == -1) {
        std::string firstNum = docs.front().first;
        int baseNum = 0, subNum = 0;
        parseDocNumber(firstNum, baseNum, subNum);
        return "EK-" + year + "-" + pad3(baseNum) + ".1";
    }

    std::string prevNum = docs[lastIdx].first;
    int prevBase = 0, prevSub = 0;
    parseDocNumber(prevNum, prevBase, prevSub);

    if (prevSub > 0) {
        prevSub++;
        return "EK-" + year + "-" + pad3(prevBase) + "." + std::to_string(prevSub);
    }

    return "EK-" + year + "-" + pad3(prevBase) + ".1";
}

std::string DocumentRepository::registerDocument(int id, int userId) {
    Database db;
    if (!db.isOpen()) {
        return "";
    }

    Document doc;
    if (!findById(id, doc)) {
        return "";
    }

    if (!doc.reg_number.empty()) {
        return doc.reg_number;
    }

    if (doc.doc_date.empty()) {
        return "";
    }

    std::string newNumber = generateDocNumber(doc.doc_date);
    if (newNumber.empty()) {
        return "";
    }

    std::string idStr = std::to_string(id);
    std::string userStr = std::to_string(userId);

    const char* sql =
        "UPDATE documents SET "
        "reg_number = $1, "
        "reg_date = doc_date, "
        "registered_at = CURRENT_TIMESTAMP, "
        "registered_by = $2, "
        "status = 'signed', "
        "updated_at = CURRENT_TIMESTAMP "
        "WHERE id = $3 AND (reg_number IS NULL OR reg_number = '') "
        "RETURNING reg_number";

    const char* p[3] = { newNumber.c_str(), userStr.c_str(), idStr.c_str() };
    PGresult* r = PQexecParams(db.get(), sql,
        3, nullptr, p, nullptr, nullptr, 0);

    std::string result;

    if (PQresultStatus(r) == PGRES_TUPLES_OK && PQntuples(r) > 0) {
        result = PQgetvalue(r, 0, 0);
    }

    PQclear(r);
    return result;
}