#pragma once
#include "DocumentService.h"
#include "httplib.h"
#include "json.hpp"

class DocumentController {
public:
    void registerRoutes(httplib::Server& server);

private:
    void addCors(httplib::Response& res) const;
    void sendJson(httplib::Response& res, const std::string& body) const;
    void sendError(httplib::Response& res, int code, const std::string& msg) const;

    bool parseBody(const httplib::Request& req, nlohmann::json& out, httplib::Response& res) const;

private:
    DocumentService service;
};