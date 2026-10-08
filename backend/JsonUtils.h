#pragma once
#include "Document.h"
#include "json.hpp"

class JsonUtils {
public:
    static Document fromJson(const nlohmann::json& body);
    static nlohmann::json toJson(const Document& d);
};