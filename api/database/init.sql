-- 图书管理系统数据库初始化脚本
-- 创建分类表
CREATE TABLE IF NOT EXISTS categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name VARCHAR(100) NOT NULL,
    code VARCHAR(50) UNIQUE NOT NULL,
    parent_id INTEGER,
    level INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (parent_id) REFERENCES categories(id)
);

-- 创建图书表
CREATE TABLE IF NOT EXISTS books (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    isbn VARCHAR(20) UNIQUE NOT NULL,
    title VARCHAR(255) NOT NULL,
    author VARCHAR(255) NOT NULL,
    publisher VARCHAR(255),
    publish_date VARCHAR(20),
    category_id INTEGER,
    cover_url TEXT,
    description TEXT,
    price DECIMAL(10,2) DEFAULT 0.00,
    room VARCHAR(50) DEFAULT '',
    shelf VARCHAR(50) DEFAULT '',
    row VARCHAR(10) DEFAULT '',
    column VARCHAR(10) DEFAULT '',
    number VARCHAR(10) DEFAULT '',
    status VARCHAR(20) DEFAULT 'available',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES categories(id)
);

-- 创建借阅表
CREATE TABLE IF NOT EXISTS borrows (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    book_id INTEGER NOT NULL,
    borrower VARCHAR(100) NOT NULL,
    borrow_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    due_date DATETIME,
    return_date DATETIME,
    status VARCHAR(20) DEFAULT 'borrowed',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (book_id) REFERENCES books(id)
);

-- 创建系统配置表
CREATE TABLE IF NOT EXISTS settings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    key VARCHAR(100) UNIQUE NOT NULL,
    value TEXT,
    type VARCHAR(50) DEFAULT 'string',
    description TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_books_isbn ON books(isbn);
CREATE INDEX IF NOT EXISTS idx_books_title ON books(title);
CREATE INDEX IF NOT EXISTS idx_books_author ON books(author);
CREATE INDEX IF NOT EXISTS idx_books_category ON books(category_id);
CREATE INDEX IF NOT EXISTS idx_books_status ON books(status);
CREATE INDEX IF NOT EXISTS idx_categories_code ON categories(code);
CREATE INDEX IF NOT EXISTS idx_categories_parent ON categories(parent_id);
CREATE INDEX IF NOT EXISTS idx_borrows_book_id ON borrows(book_id);
CREATE INDEX IF NOT EXISTS idx_borrows_borrower ON borrows(borrower);
CREATE INDEX IF NOT EXISTS idx_borrows_status ON borrows(status);
CREATE INDEX IF NOT EXISTS idx_borrows_due_date ON borrows(due_date);

-- 初始化分类数据
INSERT OR IGNORE INTO categories (name, code, parent_id, level) VALUES
('文学', 'I', NULL, 1),
('小说', 'I2', 1, 2),
('诗歌', 'I22', 1, 2),
('历史', 'K', NULL, 1),
('中国历史', 'K2', 4, 2),
('世界历史', 'K9', 4, 2),
('科学技术', 'T', NULL, 1),
('计算机', 'TP', 7, 2),
('电子技术', 'TN', 7, 2),
('哲学', 'B', NULL, 1);

-- 初始化系统配置
INSERT OR IGNORE INTO settings (key, value, type, description) VALUES
('isbn_api_key', '17e871ea05cd4396b5ce985308fa113f', 'string', 'ISBN API密钥'),
('default_borrow_days', '30', 'number', '默认借阅天数'),
('reminder_hours', '24', 'number', '到期提醒提前小时数'),
('system_name', '图书管理系统', 'string', '系统名称'),
('max_borrow_books', '5', 'number', '最大借阅图书数量');