#include "DocumentService.h"

std::vector<Document> DocumentService::getUserDocuments(
    const std::string& email, const std::string& status) {
    return repo.findByUser(email, status);
}

std::vector<Document> DocumentService::getAllDocuments(const std::string& status) {
    return repo.findAll(status);
}

bool DocumentService::getDocument(int id, Document& result) {
    if (id <= 0) {
        return false;
    }
    return repo.findById(id, result);
}

int DocumentService::createDocument(const Document& d) {
    std::string err = d.validate();
    if (!err.empty()) {
        return -1;
    }
    return repo.create(d);
}

bool DocumentService::updateDocument(const Document& d) {
    if (d.id <= 0) {
        return false;
    }

    std::string err = d.validate();
    if (!err.empty()) {
        return false;
    }

    return repo.update(d);
}

bool DocumentService::submit(int id) {
    if (id <= 0) {
        return false;
    }
    return repo.updateStatus(id, "in_review", "");
}

bool DocumentService::approve(int id) {
    if (id <= 0) {
        return false;
    }
    return repo.updateStatus(id, "ready_to_sign", "");
}

bool DocumentService::reject(int id, const std::string& why) {
    if (id <= 0) {
        return false;
    }
    if (why.length() > 1000) {
        return false;
    }
    return repo.updateStatus(id, "rejected", why);
}

std::string DocumentService::registerDocument(int id, int userId) {
    if (id <= 0 || userId <= 0) {
        return "";
    }
    return repo.registerDocument(id, userId);
}