#include "JsonUtils.h"

using json = nlohmann::json;

 std::string safe(const std::string& s, size_t maxLen) {
    return s.size() <= maxLen ? s : s.substr(0, maxLen);
 }

Document JsonUtils::fromJson(const json& body) {
    Document d;
    d.doc_date = safe(body.value("doc_date", ""), 20);
    d.author = safe(body.value("author", ""), Document::MAX_AUTHOR);
    d.author_position = safe(body.value("author_position", ""), Document::MAX_POSITION);
    d.author_email = safe(body.value("author_email", ""), Document::MAX_EMAIL);
    d.title = safe(body.value("title", ""), Document::MAX_TITLE);
    d.department = safe(body.value("department", ""), Document::MAX_DEPARTMENT);
    d.description = safe(body.value("description", ""), Document::MAX_DESCRIPTION);
    d.published = safe(body.value("published", "not published"), 50);
    d.published_where = safe(body.value("published_where", ""), 500);
    d.conclusion = safe(body.value("conclusion", "allow"), 50);
    d.publisher = safe(body.value("publisher", ""), 500);
    d.chairman = safe(body.value("chairman", ""), Document::MAX_AUTHOR);
    d.members = safe(body.value("members", ""), Document::MAX_MEMBERS);
    d.approved = safe(body.value("approved", ""), Document::MAX_AUTHOR);
    d.export_control = safe(body.value("export_control", ""), Document::MAX_AUTHOR);
    d.status = safe(body.value("status", "draft"), Document::MAX_STATUS);
    return d;
}

json JsonUtils::toJson(const Document& d) {
    return json{
        {"id", d.id},
        {"reg_number", d.reg_number},
        {"reg_date", d.reg_date},
        {"doc_date", d.doc_date},
        {"author", d.author},
        {"author_position", d.author_position},
        {"author_email", d.author_email},
        {"title", d.title},
        {"department", d.department},
        {"description", d.description},
        {"published", d.published},
        {"published_where", d.published_where},
        {"conclusion", d.conclusion},
        {"publisher", d.publisher},
        {"chairman", d.chairman},
        {"members", d.members},
        {"approved", d.approved},
        {"export_control", d.export_control},
        {"status", d.status},
        {"admin_comment", d.admin_comment},
        {"created_at", d.created_at},
        {"updated_at", d.updated_at},
        {"registered_at", d.registered_at},
        {"registered_by", d.registered_by}
    };
}