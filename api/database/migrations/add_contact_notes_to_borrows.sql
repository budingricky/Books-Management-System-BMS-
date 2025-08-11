-- 添加contact和notes字段到borrows表
ALTER TABLE borrows ADD COLUMN contact VARCHAR(100) DEFAULT '';
ALTER TABLE borrows ADD COLUMN notes TEXT DEFAULT '';