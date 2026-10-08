#include <iostream>
#include "Config.h"
#include "Database.h"
#include "DocumentController.h"
#include "httplib.h"

int main() {
    std::cout << "Starting server..." << std::endl;

    Database db;
    if (!db.isOpen()) {
        std::cerr << "Cannot connect database" << std::endl;
        return 1;
    }

    PGresult* check = PQexec(db.get(),
        "SELECT COUNT(*) FROM information_schema.tables "
        "WHERE table_schema='public' AND table_name='documents'");

    bool tableExists = (std::string(PQgetvalue(check, 0, 0)) == "1");
    PQclear(check);

    if (!tableExists)
        return 1;

    httplib::Server server;
    server.set_payload_max_length(1024 * 1024);

    DocumentController controller;
    controller.registerRoutes(server);

    server.set_mount_point("/", Config::frontendPath().c_str());

    std::cout << "Server started at http://localhost:" << Config::serverPort() << std::endl;

    if (!server.listen("0.0.0.0", Config::serverPort())) {
        std::cerr << "Cannot start server" << std::endl;
        return 1;
    }

    return 0;
}