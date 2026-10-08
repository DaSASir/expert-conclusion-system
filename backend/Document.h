#pragma once
#include <string>

struct Document {
    static constexpr size_t MAX_TITLE = 500;
    static constexpr size_t MAX_AUTHOR = 300;
    static constexpr size_t MAX_POSITION = 300;
    static constexpr size_t MAX_EMAIL = 200;
    static constexpr size_t MAX_DEPARTMENT = 500;
    static constexpr size_t MAX_DESCRIPTION = 10000;
    static constexpr size_t MAX_MEMBERS = 5000;
    static constexpr size_t MAX_STATUS = 30;
    static constexpr size_t MAX_COMMENT = 1000;

    int id = 0;

    std::string reg_number;
    std::string reg_date;
    std::string doc_date;

    std::string author;
    std::string author_position;
    std::string author_email;
    std::string title;
    std::string department;
    std::string description;
    std::string published;
    std::string published_where;
    std::string conclusion;
    std::string publisher;
    std::string chairman;
    std::string members;
    std::string approved;
    std::string export_control;

    std::string status = "draft";
    std::string admin_comment;
    std::string created_at;
    std::string updated_at;
    std::string registered_at;
    int registered_by = 0;
};