#pragma once
#include "DocumentRepository.h"
#include <vector>
#include <string>

class DocumentService {
public:
    DocumentService() = default;
    explicit DocumentService(DocumentRepository repo) : repo(std::move(repo)) {}

    std::vector<Document> getUserDocuments(const std::string& email, const std::string& status) const;
    std::vector<Document> getAllDocuments(const std::string& status) const;

    bool getDocument(int id, Document& result) const;

    int createDocument(const Document& d);
    bool updateDocument(const Document& d);

    bool submit(int id);
    bool approve(int id);
    bool reject(int id, const std::string& comment);

    std::string registerDocument(int id, int userId);

    std::string validate(const Document& d) const;

private:
    bool canTransition(const std::string& from, const std::string& to) const;
    bool getStatus(int id, std::string& status) const;

private:
    DocumentRepository repo;
};