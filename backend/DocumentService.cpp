#include "DocumentService.h"

std::vector<Document> DocumentService::getUserDocuments(const std::string& email,
    const std::string& status) const {
    if (email.empty()) 
        return {};

    return repo.findByUser(email, status);
}

std::vector<Document> DocumentService::getAllDocuments(const std::string& status) const {
    return repo.findAll(status);
}

bool DocumentService::getDocument(int id, Document& result) const {
    if (id <= 0) 
        return false;

    return repo.findById(id, result);
}

std::string DocumentService::validate(const Document& d) const {
    if (d.title.empty())
        return "Title is required";
    if (d.title.size() > Document::MAX_TITLE)
        return "Title too long";
    if (d.author.size() > Document::MAX_AUTHOR)
        return "Author too long";
    if (d.author_position.size() > Document::MAX_POSITION)
        return "Position too long";
    if (d.author_email.size() > Document::MAX_EMAIL)
        return "Email too long";
    if (d.department.size() > Document::MAX_DEPARTMENT)
        return "Department too long";
    if (d.description.size() > Document::MAX_DESCRIPTION)
        return "Description too long";
    if (d.members.size() > Document::MAX_MEMBERS)
        return "Members too long";
    if (d.status.size() > Document::MAX_STATUS)
        return "Status too long";

    return "";
}

int DocumentService::createDocument(const Document& d) {
    if (!validate(d).empty()) 
        return -1;

    return repo.create(d);
}

bool DocumentService::updateDocument(const Document& d) {
    if (d.id <= 0) 
        return false;
    if (!validate(d).empty()) 
        return false;

    return repo.update(d);
}

bool DocumentService::canTransition(const std::string& from, const std::string& to) const {
    if (from == "draft" && to == "in_review") 
        return true;
    if (from == "in_review" && to == "ready_to_sign") 
        return true;
    if (from == "in_review" && to == "rejected") 
        return true;
    if (from == "rejected" && to == "draft") 
        return true;

    return false;
}

bool DocumentService::getStatus(int id, std::string& status) const {
    Document d;
    if (!repo.findById(id, d)) 
        return false;
    status = d.status;

    return true;
}

bool DocumentService::submit(int id) {
    if (id <= 0) 
        return false;

    std::string cur;
    if (!getStatus(id, cur)) 
        return false;
    if (!canTransition(cur, "in_review")) 
        return false;

    return repo.setStatus(id, "in_review");
}

bool DocumentService::approve(int id) {
    if (id <= 0) 
        return false;

    std::string cur;
    if (!getStatus(id, cur)) 
        return false;
    if (!canTransition(cur, "ready_to_sign")) 
        return false;

    return repo.setStatus(id, "ready_to_sign");
}

bool DocumentService::reject(int id, const std::string& comment) {
    if (id <= 0) 
        return false;
    if (comment.size() > Document::MAX_COMMENT) 
        return false;

    std::string cur;
    if (!getStatus(id, cur))
        return false;
    if (!canTransition(cur, "rejected"))
        return false;

    return repo.setStatusWithComment(id, "rejected", comment);
}

std::string DocumentService::registerDocument(int id, int userId) {
    if (id <= 0 || userId <= 0) 
        return "";

    std::string cur;
    if (!getStatus(id, cur)) 
        return "";
    if (cur != "ready_to_sign") 
        return "";

    return repo.registerDocument(id, userId);
}