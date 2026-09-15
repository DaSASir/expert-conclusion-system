#pragma once
#include "DocumentRepository.h"
#include <vector>
#include <string>

class DocumentService {
public:
    std::vector<Document> getUserDocuments(const std::string& email,
        const std::string& status);
    std::vector<Document> getAllDocuments(const std::string& status);

    bool getDocument(int id, Document& result);

    int createDocument(const Document& d);
    bool updateDocument(const Document& d);

    bool submit(int id);
    bool approve(int id);
    bool reject(int id, const std::string& why);

    std::string registerDocument(int id, int userId);

private:
    DocumentRepository repo;
};