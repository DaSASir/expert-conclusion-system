#pragma once
#include "Document.h"
#include <vector>
#include <string>

class DocumentRepository {
public:
    std::vector<Document> findByUser(const std::string& email, const std::string& status) const;
    std::vector<Document> findAll(const std::string& status) const;

    bool findById(int id, Document& result) const;

    int create(const Document& d);
    bool update(const Document& d);

    bool setStatus(int id, const std::string& status);
    bool setStatusWithComment(int id, const std::string& status, const std::string& comment);

    std::string registerDocument(int id, int userId);

private:
    std::string generateDocNumber(const std::string& doc_date) const;
};