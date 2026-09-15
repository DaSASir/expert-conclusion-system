#include "Database.h"
#include "Config.h"
#include <iostream>

Database::Database() {
    conn = PQconnectdb(Config::connectionString().c_str());

    if (PQstatus(conn) != CONNECTION_OK) {
        std::cerr << "[DB] Connection failed" << std::endl;
        PQfinish(conn);
        conn = nullptr;
    }
}

Database::~Database() {
    if (conn) {
        PQfinish(conn);
        conn = nullptr;
    }
}

PGconn* Database::get() {
    return conn;
}

bool Database::isOpen() {
    return conn != nullptr;
}