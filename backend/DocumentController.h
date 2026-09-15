#pragma once
#include "DocumentService.h"
#include "httplib.h"

class DocumentController {
public:
    void registerRoutes(httplib::Server& server);

private:
    DocumentService service;

    void addCors(httplib::Response& res);
    void sendJson(httplib::Response& res, const std::string& body);
    void sendError(httplib::Response& res, int code, const std::string& msg);
};