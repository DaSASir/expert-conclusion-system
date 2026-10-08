# Expert Conclusion System

WEB-приложение для формирования и учёта документов на примере документа «Экспертное заключение».

## Требования

Перед запуском убедитесь, что у вас установлено:

- **PostgreSQL** — [скачать](https://www.postgresql.org/download/)
- **Visual Studio**
- **Браузер**

## Запуск программы

### Шаг 1. Скачать проект

### Шаг 2. Создать базу данных

Имя базы: `expert_db`

### Шаг 3. Применить SQL-схему

Выберите файл `database/schema.sql`

В базе появятся две таблицы: `users` и `documents` с тестовыми пользователями.

### Шаг 4. Настроить подключение к базе

Откройте файл `backend/Config.cpp` и укажите свой пароль от PostgreSQL:

```cpp
static const std::string PASS = "Qwerty12345";   // ← замените на свой пароль
```

Также укажите **свой путь** к папке `frontend`:

```cpp
static const std::string FRONT = "E:/TSU/KURSOVAYA/fronted";   // ← замените на свой путь
```

### Шаг 5. Скопировать DLL

Из папки `C:\Program Files\PostgreSQL\16\bin` скопируйте **все файлы `.dll`** в папку, где будет находиться `.exe`:

```
backend/x64/Debug/
```

### Шаг 6. Собрать и запустить сервер

В консоли должно появиться:

```
Starting server...
Server started at http://localhost:8080
```

### Шаг 7. Открыть сайт

Откройте браузер и введите:

```
http://localhost:8080/index.html
```

## Тестовые пользователи

Для входа в систему используйте:

| Роль | Email | Пароль |
|------|-------|--------|
| Пользователь | user@example.com | user123 |
| Администратор | admin@example.com | admin123 |
