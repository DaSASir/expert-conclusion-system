#pragma once
#include <string>

class Config {
public:
    static std::string dbHost();
    static std::string dbPort();
    static std::string dbName();
    static std::string dbUser();
    static std::string dbPassword();

    static int serverPort();
    static std::string frontendPath();

    static std::string connectionString();
};