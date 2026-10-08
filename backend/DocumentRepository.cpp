#include "DocumentRepository.h"
#include "Database.h"
#include <libpq-fe.h>
#include <string>
#include <utility>

namespace {
    const char* FIELDS =
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

    std::string get(PGresult* r, int row, int col) {
        if (PQgetisnull(r, row, col)) 
            return "";

        return std::string(PQgetvalue(r, row, col));
    }

    const char* cstr(const std::string& s) {
        return s.empty() ? nullptr : s.c_str();
    }

    Document rowToDocument(PGresult* r, int row) {
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

    std::string pad3(int n) {
        std::string s = std::to_string(n);
        while (s.size() < 3) 
            s = "0" + s;

        return s;
    }

    void parseDocNumber(const std::string& number, int& baseNum, int& subNum) {
        baseNum = 0;
        subNum = 0;
        auto dash = number.rfind('-');
        if (dash == std::string::npos) 
            return;

        std::string tail = number.substr(dash + 1);
        auto dot = tail.find('.');
        if (dot == std::string::npos) {
            baseNum = std::stoi(tail);
        }
        else {
            baseNum = std::stoi(tail.substr(0, dot));
            subNum = std::stoi(tail.substr(dot + 1));
        }
    }

}

std::vector<Document> DocumentRepository::findByUser(const std::string& email,
    const std::string& status) const {
    std::vector<Document> result;
    Database db;
    if (!db.isOpen()) 
        return result;

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
    ptrs.reserve(values.size());
    for (auto& v : values) 
        ptrs.push_back(v.c_str());

    PGresult* r = PQexecParams(db.get(), sql.c_str(),
        static_cast<int>(ptrs.size()), nullptr,
        ptrs.empty() ? nullptr : ptrs.data(),
        nullptr, nullptr, 0);

    if (PQresultStatus(r) == PGRES_TUPLES_OK) {
        for (int i = 0; i < PQntuples(r); ++i)
            result.push_back(rowToDocument(r, i));
    }
    PQclear(r);
    return result;
}

std::vector<Document> DocumentRepository::findAll(const std::string& status) const {
    std::vector<Document> result;
    Database db;
    if (!db.isOpen()) 
        return result;

    std::string sql = "SELECT ";
    sql += FIELDS;
    sql += " FROM documents";

    PGresult* r = nullptr;
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
        for (int i = 0; i < PQntuples(r); ++i)
            result.push_back(rowToDocument(r, i));
    }
    PQclear(r);
    return result;
}

bool DocumentRepository::findById(int id, Document& result) const {
    Database db;
    if (!db.isOpen()) 
        return false;

    std::string sql = "SELECT ";
    sql += FIELDS;
    sql += " FROM documents WHERE id = $1";

    std::string idStr = std::to_string(id);
    const char* p[1] = { idStr.c_str() };
    PGresult* r = PQexecParams(db.get(), sql.c_str(), 1, nullptr, p, nullptr, nullptr, 0);

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
    if (!db.isOpen()) 
        return -1;

    const char* sql =
        "INSERT INTO documents ("
        "doc_date, author, author_position, author_email, "
        "title, department, description, published, published_where, "
        "conclusion, publisher, chairman, members, approved, export_control, status"
        ") VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16) "
        "RETURNING id";

    const char* p[16] = {
        cstr(d.doc_date), cstr(d.author), cstr(d.author_position), cstr(d.author_email),
        d.title.c_str(),
        cstr(d.department), cstr(d.description),
        d.published.empty() ? "not published" : d.published.c_str(),
        cstr(d.published_where),
        d.conclusion.empty() ? "allow" : d.conclusion.c_str(),
        cstr(d.publisher), cstr(d.chairman), cstr(d.members),
        cstr(d.approved), cstr(d.export_control),
        d.status.c_str()
    };

    PGresult* r = PQexecParams(db.get(), sql, 16, nullptr, p, nullptr, nullptr, 0);
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
    if (!db.isOpen()) 
        return false;

    const char* sql =
        "UPDATE documents SET "
        "doc_date=$1, author=$2, author_position=$3, "
        "title=$4, department=$5, description=$6, published=$7, published_where=$8, "
        "conclusion=$9, publisher=$10, chairman=$11, members=$12, approved=$13, "
        "export_control=$14, status=$15, updated_at=CURRENT_TIMESTAMP "
        "WHERE id=$16";

    std::string idStr = std::to_string(d.id);

    const char* p[16] = {
        cstr(d.doc_date), cstr(d.author), cstr(d.author_position),
        d.title.c_str(),
        cstr(d.department), cstr(d.description),
        d.published.empty() ? "not published" : d.published.c_str(),
        cstr(d.published_where),
        d.conclusion.empty() ? "allow" : d.conclusion.c_str(),
        cstr(d.publisher), cstr(d.chairman), cstr(d.members),
        cstr(d.approved), cstr(d.export_control),
        d.status.c_str(), idStr.c_str()
    };

    PGresult* r = PQexecParams(db.get(), sql, 16, nullptr, p, nullptr, nullptr, 0);
    bool ok = (PQresultStatus(r) == PGRES_COMMAND_OK);
    PQclear(r);
    return ok;
}

bool DocumentRepository::setStatus(int id, const std::string& status) {
    Database db;
    if (!db.isOpen()) 
        return false;

    const char* sql = "UPDATE documents SET status=$1, updated_at=CURRENT_TIMESTAMP WHERE id=$2";

    std::string idStr = std::to_string(id);
    const char* p[2] = { status.c_str(), idStr.c_str() };
    PGresult* r = PQexecParams(db.get(), sql, 2, nullptr, p, nullptr, nullptr, 0);
    bool ok = (PQresultStatus(r) == PGRES_COMMAND_OK);
    PQclear(r);
    return ok;
}

bool DocumentRepository::setStatusWithComment(int id, const std::string& status,
    const std::string& comment) {
    Database db;
    if (!db.isOpen()) 
        return false;

    const char* sql =
        "UPDATE documents SET status=$1, admin_comment=$2, "
        "updated_at=CURRENT_TIMESTAMP WHERE id=$3";

    std::string idStr = std::to_string(id);
    const char* p[3] = { status.c_str(), comment.c_str(), idStr.c_str() };
    PGresult* r = PQexecParams(db.get(), sql, 3, nullptr, p, nullptr, nullptr, 0);
    bool ok = (PQresultStatus(r) == PGRES_COMMAND_OK);
    PQclear(r);
    return ok;
}

std::string DocumentRepository::generateDocNumber(const std::string& doc_date) const {
    if (doc_date.empty()) 
        return "";

    Database db;
    if (!db.isOpen()) 
        return "";

    std::string year = doc_date.substr(0, 4);

    std::string sql =
        "SELECT reg_number, doc_date::text FROM documents "
        "WHERE EXTRACT(YEAR FROM doc_date) = $1 "
        "  AND reg_number IS NOT NULL AND reg_number != '' "
        "ORDER BY doc_date ASC";

    const char* params[1] = { year.c_str() };
    PGresult* r = PQexecParams(db.get(), sql.c_str(), 1, nullptr, params, nullptr, nullptr, 0);

    std::vector<std::pair<std::string, std::string>> docs;
    if (PQresultStatus(r) == PGRES_TUPLES_OK)
        for (int i = 0; i < PQntuples(r); ++i)
            docs.emplace_back(PQgetvalue(r, i, 0), PQgetvalue(r, i, 1));

    PQclear(r);

    if (docs.empty()) 
        return "EK-" + year + "-001";

    int lastIdx = -1, nextIdx = -1;
    for (size_t i = 0; i < docs.size(); ++i) {
        if (docs[i].second <= doc_date) 
            lastIdx = static_cast<int>(i);
        else { 
            nextIdx = static_cast<int>(i); 
            break; 
        }
    }

    auto makeSub = [&](int baseNum, int startSub) {
        int sub = startSub;
        while (true) {
            std::string candidate = "EK-" + year + "-" + pad3(baseNum) + "." + std::to_string(sub);
            bool taken = false;
            for (auto& d : docs) 
                if (d.first == candidate) { 
                    taken = true; 
                    break; 
                }

            if (!taken) 
                return candidate;

            ++sub;
        }
        };

    if (nextIdx == -1) {
        int base = 0, sub = 0;
        parseDocNumber(docs.back().first, base, sub);
        if (sub == 0) 
            return "EK-" + year + "-" + pad3(base + 1);

        return "EK-" + year + "-" + pad3(base) + "." + std::to_string(sub + 1);
    }

    if (lastIdx == -1) {
        int base = 0, sub = 0;
        parseDocNumber(docs.front().first, base, sub);
        return makeSub(base, 1);
    }

    int base = 0, sub = 0;
    parseDocNumber(docs[lastIdx].first, base, sub);
    if (sub > 0) 
        return "EK-" + year + "-" + pad3(base) + "." + std::to_string(sub + 1);

    return "EK-" + year + "-" + pad3(base) + ".1";
}

std::string DocumentRepository::registerDocument(int id, int userId) {
    Database db;
    if (!db.isOpen()) 
        return "";

    Document doc;
    if (!findById(id, doc)) 
        return "";
    if (!doc.reg_number.empty()) 
        return doc.reg_number;
    if (doc.doc_date.empty()) 
        return "";

    std::string newNumber = generateDocNumber(doc.doc_date);
    if (newNumber.empty()) 
        return "";

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
    PGresult* r = PQexecParams(db.get(), sql, 3, nullptr, p, nullptr, nullptr, 0);

    std::string result;
    if (PQresultStatus(r) == PGRES_TUPLES_OK && PQntuples(r) > 0) {
        result = PQgetvalue(r, 0, 0);
    }
    PQclear(r);
    return result;
}