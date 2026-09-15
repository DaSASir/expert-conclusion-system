#pragma once
#include <string>

struct Document {
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

    std::string validate() const {
        if (title.empty()) {
            return "Title is required";
        }
        if (title.length() > 500) {
            return "Title too long (max 500)";
        }
        if (author.length() > 300) {
            return "Author too long (max 300)";
        }
        if (author_position.length() > 300) {
            return "Position too long (max 300)";
        }
        if (author_email.length() > 200) {
            return "Email too long (max 200)";
        }
        if (department.length() > 500) {
            return "Department too long (max 500)";
        }
        if (description.length() > 10000) {
            return "Description too long (max 10000)";
        }
        if (members.length() > 5000) {
            return "Members too long (max 5000)";
        }
        if (status.length() > 30) {
            return "Status too long (max 30)";
        }
        return "";
    }
};