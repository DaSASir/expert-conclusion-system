#pragma once
#include "Document.h"
#include <vector>
#include <string>

class DocumentRepository {
public:
    std::vector<Document> findByUser(const std::string& email,
        const std::string& status);

    std::vector<Document> findAll(const std::string& status);

    bool findById(int id, Document& result);

    int create(const Document& d);

    bool update(const Document& d);

    bool updateStatus(int id, const std::string& status,
        const std::string& comment);

    std::string registerDocument(int id, int userId);

    std::string generateDocNumber(const std::string& doc_date);
};