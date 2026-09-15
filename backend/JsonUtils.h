#pragma once
#include "Document.h"
#include "json.hpp"

using json = nlohmann::json;

class JsonUtils {
public:
    static Document fromJson(const json& body);
    static json toJson(const Document& d);
};