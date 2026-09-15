#include "Config.h"

static const std::string HOST = "localhost";
static const std::string PORT = "5432";
static const std::string NAME = "expert_db";
static const std::string USER = "postgres";
static const std::string PASS = "Qwerty12345";
static const int SERV_PORT = 8080;
static const std::string FRONT = "E:/TSU/KURSOVAYA/fronted";


std::string Config::dbHost() {
    return HOST;
}

std::string Config::dbPort() {
    return PORT;
}

std::string Config::dbName() {
    return NAME;
}

std::string Config::dbUser() {
    return USER;
}

std::string Config::dbPassword() {
    return PASS;
}

int Config::serverPort() {
    return SERV_PORT;
}

std::string Config::frontendPath() {
    return FRONT;
}

std::string Config::connectionString() {
    return "host=" + HOST +
        " port=" + PORT +
        " dbname=" + NAME +
        " user=" + USER +
        " password=" + PASS;
}