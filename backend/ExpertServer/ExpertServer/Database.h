#pragma once
#include <libpq-fe.h>
#include <string>

class Database {
public:
    Database();
    ~Database();

    Database(const Database&) = delete;
    Database& operator=(const Database&) = delete;

    PGconn* get();
    bool isOpen();

private:
    PGconn* conn;
};