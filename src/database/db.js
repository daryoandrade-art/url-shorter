import Database from "better-sqlite3";

const db = new Database('database.sqlite');

// Hablitar chaves estrangeiras
db.pragma("foreign_keys" = ON);

// Criar tabelas
db.exec(`
    CREATE TABLE IF NOT EXISTS urls (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        short_code TEXT UNIQUE NOT NULL,
        original_url TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        expires_at DATETIME
    );

    CREATE TABLE IF NOT EXISTS clicks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        url_id INTEGER NOT NULL,
        user_agent TEXT,
        clicked_at DATETIME DEFAULT CURRENT_TIMESTAMP,        
        FOREIGN KEY (url_id) REFERENCES urls (id)
    );
`);

export default db;