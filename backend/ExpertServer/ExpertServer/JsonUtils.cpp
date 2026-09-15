#include "JsonUtils.h"

static std::string safe(const std::string& s, size_t maxLen) {
    if (s.length() <= maxLen) {
        return s;
    }
    return s.substr(0, maxLen);
}

Document JsonUtils::fromJson(const json& body) {
    Document d;

    d.doc_date = safe(body.value("doc_date", ""), 20);
    d.author = safe(body.value("author", ""), 300);
    d.author_position = safe(body.value("author_position", ""), 300);
    d.author_email = safe(body.value("author_email", ""), 200);
    d.title = safe(body.value("title", ""), 500);
    d.department = safe(body.value("department", ""), 500);
    d.description = safe(body.value("description", ""), 10000);
    d.published = safe(body.value("published", "not published"), 50);
    d.published_where = safe(body.value("published_where", ""), 500);
    d.conclusion = safe(body.value("conclusion", "allow"), 50);
    d.publisher = safe(body.value("publisher", ""), 500);
    d.chairman = safe(body.value("chairman", ""), 300);
    d.members = safe(body.value("members", ""), 5000);
    d.approved = safe(body.value("approved", ""), 300);
    d.export_control = safe(body.value("export_control", ""), 300);
    d.status = safe(body.value("status", "draft"), 30);

    return d;
}

json JsonUtils::toJson(const Document& d) {
    json j;

    j["id"] = d.id;
    j["reg_number"] = d.reg_number;
    j["reg_date"] = d.reg_date;
    j["doc_date"] = d.doc_date;
    j["author"] = d.author;
    j["author_position"] = d.author_position;
    j["author_email"] = d.author_email;
    j["title"] = d.title;
    j["department"] = d.department;
    j["description"] = d.description;
    j["published"] = d.published;
    j["published_where"] = d.published_where;
    j["conclusion"] = d.conclusion;
    j["publisher"] = d.publisher;
    j["chairman"] = d.chairman;
    j["members"] = d.members;
    j["approved"] = d.approved;
    j["export_control"] = d.export_control;
    j["status"] = d.status;
    j["admin_comment"] = d.admin_comment;
    j["created_at"] = d.created_at;
    j["updated_at"] = d.updated_at;
    j["registered_at"] = d.registered_at;
    j["registered_by"] = d.registered_by;

    return j;
}