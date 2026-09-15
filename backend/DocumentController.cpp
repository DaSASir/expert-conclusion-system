#include "DocumentController.h"
#include "JsonUtils.h"
#include "Database.h"
#include <libpq-fe.h>

void DocumentController::addCors(httplib::Response& res) {
    res.set_header("Access-Control-Allow-Origin", "*");
    res.set_header("Access-Control-Allow-Methods", "GET, POST, PUT, OPTIONS");
    res.set_header("Access-Control-Allow-Headers", "Content-Type");
}

void DocumentController::sendJson(httplib::Response& res, const std::string& body) {
    res.set_content(body, "application/json; charset=utf-8");
}

void DocumentController::sendError(httplib::Response& res, int code,
    const std::string& msg) {
    res.status = code;
    json j;
    j["error"] = msg;
    sendJson(res, j.dump());
}

void DocumentController::registerRoutes(httplib::Server& svr) {

    svr.Options(".*", [this](const httplib::Request&, httplib::Response& res) {
        addCors(res);
        res.status = 204;
        });

    svr.Get("/api/documents", [this](const httplib::Request& req, httplib::Response& res) {
        addCors(res);

        std::string user = "";
        std::string status = "";

        if (req.has_param("user")) {
            user = req.get_param_value("user");
        }
        if (req.has_param("status")) {
            status = req.get_param_value("status");
        }

        auto docs = service.getUserDocuments(user, status);

        json arr = json::array();
        for (auto& d : docs) {
            arr.push_back(JsonUtils::toJson(d));
        }
        sendJson(res, arr.dump());
        });

    svr.Get("/api/all-documents", [this](const httplib::Request& req, httplib::Response& res) {
        addCors(res);

        std::string status = "";
        if (req.has_param("status")) {
            status = req.get_param_value("status");
        }

        auto docs = service.getAllDocuments(status);

        json arr = json::array();
        for (auto& d : docs) {
            // Не показываем черновики админу
            if (d.status == "draft") {
                continue;
            }
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

        json body = json::parse(req.body);
        Document d = JsonUtils::fromJson(body);

        std::string err = d.validate();
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

        json body = json::parse(req.body);
        Document d = JsonUtils::fromJson(body);
        d.id = id;

        std::string err = d.validate();
        if (!err.empty()) {
            sendError(res, 400, err);
            return;
        }

        bool ok = service.updateDocument(d);

        json result;
        result["success"] = ok;
        sendJson(res, result.dump());
        });

    svr.Post(R"(/api/documents/(\d+)/submit)", [this](const httplib::Request& req, httplib::Response& res) {
        addCors(res);

        int id = std::stoi(req.matches[1]);

        bool ok = service.submit(id);

        json j;
        j["success"] = ok;
        sendJson(res, j.dump());
        });

    svr.Post(R"(/api/documents/(\d+)/approve)", [this](const httplib::Request& req, httplib::Response& res) {
        addCors(res);

        int id = std::stoi(req.matches[1]);

        bool ok = service.approve(id);

        json j;
        j["success"] = ok;
        sendJson(res, j.dump());
        });

    svr.Post(R"(/api/documents/(\d+)/register)", [this](const httplib::Request& req, httplib::Response& res) {
        addCors(res);

        int id = std::stoi(req.matches[1]);

        int userId = 0;
        json body = json::parse(req.body);
        userId = body.value("user_id", 0);

        std::string regNumber = service.registerDocument(id, userId);

        if (regNumber.empty()) {
            json j;
            j["success"] = false;
            j["error"] = "Cannot register document";
            sendJson(res, j.dump());
            return;
        }

        json j;
        j["success"] = true;
        j["reg_number"] = regNumber;
        sendJson(res, j.dump());
        });

    svr.Post(R"(/api/documents/(\d+)/reject)", [this](const httplib::Request& req, httplib::Response& res) {
        addCors(res);

        int id = std::stoi(req.matches[1]);

        std::string comment = "";
        json body = json::parse(req.body);
        comment = body.value("comment", "");

        bool ok = service.reject(id, comment);

        json j;
        j["success"] = ok;
        sendJson(res, j.dump());
        });

    svr.Post("/api/login", [](const httplib::Request& req, httplib::Response& res) {
        res.set_header("Access-Control-Allow-Origin", "*");
        res.set_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
        res.set_header("Access-Control-Allow-Headers", "Content-Type");

        json body = json::parse(req.body);

        std::string email = body.value("email", "");
        std::string password = body.value("password", "");

        if (email.empty() || password.empty()) {
            res.status = 400;
            json j;
            j["error"] = "Email and password required";
            res.set_content(j.dump(), "application/json");
            return;
        }

        Database db;
        if (!db.isOpen()) {
            res.status = 500;
            json j;
            j["error"] = "Database error";
            res.set_content(j.dump(), "application/json");
            return;
        }

        const char* sql =
            "SELECT id, email, full_name, role FROM users "
            "WHERE email = $1 AND password_hash = $2 AND is_active = TRUE";

        const char* params[2] = { email.c_str(), password.c_str() };
        PGresult* r = PQexecParams(db.get(), sql,
            2, nullptr, params, nullptr, nullptr, 0);

        if (PQresultStatus(r) != PGRES_TUPLES_OK || PQntuples(r) == 0) {
            res.status = 401;
            json j;
            j["error"] = "Invalid email or password";
            res.set_content(j.dump(), "application/json");
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
        res.set_content(result.dump(), "application/json; charset=utf-8");
        });
}