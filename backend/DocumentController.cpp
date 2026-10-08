#include "DocumentController.h"
#include "JsonUtils.h"
#include "Database.h"
#include <libpq-fe.h>

using json = nlohmann::json;

void DocumentController::addCors(httplib::Response& res) const {
    res.set_header("Access-Control-Allow-Origin", "*");
    res.set_header("Access-Control-Allow-Methods", "GET, POST, PUT, OPTIONS");
    res.set_header("Access-Control-Allow-Headers", "Content-Type");
}

void DocumentController::sendJson(httplib::Response& res, const std::string& body) const {
    res.set_content(body, "application/json; charset=utf-8");
}

void DocumentController::sendError(httplib::Response& res, int code, const std::string& msg) const {
    res.status = code;
    json j;
    j["error"] = msg;
    sendJson(res, j.dump());
}

bool DocumentController::parseBody(const httplib::Request& req, json& out, httplib::Response& res) const {
    try {
        out = json::parse(req.body);
        return true;
    }
    catch (...) {
        sendError(res, 400, "Invalid JSON");
        return false;
    }
}

void DocumentController::registerRoutes(httplib::Server& svr) {

    svr.Options(".*", [this](const httplib::Request&, httplib::Response& res) {
        addCors(res);
        res.status = 204;
        });

    svr.Get("/api/documents", [this](const httplib::Request& req, httplib::Response& res) {
        addCors(res);

        std::string user = req.has_param("user") ? req.get_param_value("user") : "";
        std::string status = req.has_param("status") ? req.get_param_value("status") : "";

        auto docs = service.getUserDocuments(user, status);

        json arr = json::array();
        for (auto& d : docs) 
            arr.push_back(JsonUtils::toJson(d));

        sendJson(res, arr.dump());
        });

    svr.Get("/api/all-documents", [this](const httplib::Request& req, httplib::Response& res) {
        addCors(res);

        std::string status = req.has_param("status") ? req.get_param_value("status") : "";
        auto docs = service.getAllDocuments(status);

        json arr = json::array();
        for (auto& d : docs) {
            if (d.status == "draft") 
                continue;
            arr.push_back(JsonUtils::toJson(d));
        }
        sendJson(res, arr.dump());
        });

    svr.Get(R"(/api/documents/(\d+))", [this](const httplib::Request& req, httplib::Response& res) {
        addCors(res);

        int id = std::stoi(req.matches[1]);
        Document d;
        if (!service.getDocument(id, d)) {
            sendError(res, 404, "Not found");
            return;
        }
        sendJson(res, JsonUtils::toJson(d).dump());
        });

    svr.Post("/api/documents", [this](const httplib::Request& req, httplib::Response& res) {
        addCors(res);

        json body;
        if (!parseBody(req, body, res)) 
            return;

        Document d = JsonUtils::fromJson(body);
        std::string err = service.validate(d);
        if (!err.empty()) { 
            sendError(res, 400, err); 
            return; 
        }

        int newId = service.createDocument(d);
        if (newId < 0) { 
            sendError(res, 500, "Cannot save document"); 
            return; 
        }

        json result;
        result["success"] = true;
        result["id"] = newId;
        sendJson(res, result.dump());
        });

    svr.Put(R"(/api/documents/(\d+))", [this](const httplib::Request& req, httplib::Response& res) {
        addCors(res);

        int id = std::stoi(req.matches[1]);

        json body;
        if (!parseBody(req, body, res)) 
            return;

        Document d = JsonUtils::fromJson(body);
        d.id = id;

        std::string err = service.validate(d);
        if (!err.empty()) { 
            sendError(res, 400, err); 
            return; 
        }

        json result;
        result["success"] = service.updateDocument(d);
        sendJson(res, result.dump());
        });

    svr.Post(R"(/api/documents/(\d+)/submit)", [this](const httplib::Request& req, httplib::Response& res) {
        addCors(res);
        int id = std::stoi(req.matches[1]);
        json j;
        j["success"] = service.submit(id);
        sendJson(res, j.dump());
        });

    svr.Post(R"(/api/documents/(\d+)/approve)", [this](const httplib::Request& req, httplib::Response& res) {
        addCors(res);
        int id = std::stoi(req.matches[1]);
        json j;
        j["success"] = service.approve(id);
        sendJson(res, j.dump());
        });

    svr.Post(R"(/api/documents/(\d+)/reject)", [this](const httplib::Request& req, httplib::Response& res) {
        addCors(res);

        int id = std::stoi(req.matches[1]);

        json body;
        if (!parseBody(req, body, res)) 
            return;

        std::string comment = body.value("comment", "");
        json j;
        j["success"] = service.reject(id, comment);
        sendJson(res, j.dump());
        });

    svr.Post(R"(/api/documents/(\d+)/register)", [this](const httplib::Request& req, httplib::Response& res) {
        addCors(res);

        int id = std::stoi(req.matches[1]);

        json body;
        if (!parseBody(req, body, res)) 
            return;

        int userId = body.value("user_id", 0);
        std::string regNumber = service.registerDocument(id, userId);

        json j;
        if (regNumber.empty()) {
            j["success"] = false;
            j["error"] = "Cannot register document";
        }
        else {
            j["success"] = true;
            j["reg_number"] = regNumber;
        }
        sendJson(res, j.dump());
        });

    svr.Post("/api/login", [this](const httplib::Request& req, httplib::Response& res) {
        addCors(res);

        json body;
        if (!parseBody(req, body, res)) 
            return;

        std::string email = body.value("email", "");
        std::string password = body.value("password", "");

        if (email.empty() || password.empty()) {
            sendError(res, 400, "Email and password required");
            return;
        }

        Database db;
        if (!db.isOpen()) {
            sendError(res, 500, "Database error");
            return;
        }

        const char* sql =
            "SELECT id, email, full_name, role FROM users "
            "WHERE email = $1 AND password_hash = $2 AND is_active = TRUE";

        const char* params[2] = { email.c_str(), password.c_str() };
        PGresult* r = PQexecParams(db.get(), sql, 2, nullptr, params, nullptr, nullptr, 0);

        if (PQresultStatus(r) != PGRES_TUPLES_OK || PQntuples(r) == 0) {
            sendError(res, 401, "Invalid email or password");
            PQclear(r);
            return;
        }

        json user;
        user["id"] = std::stoi(PQgetvalue(r, 0, 0));
        user["email"] = PQgetvalue(r, 0, 1);
        user["name"] = PQgetvalue(r, 0, 2);
        user["role"] = PQgetvalue(r, 0, 3);
        PQclear(r);

        json result;
        result["success"] = true;
        result["user"] = user;
        sendJson(res, result.dump());
        });
}