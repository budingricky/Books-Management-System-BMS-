import initSqlJs, { type Database as SqlJsDatabase, type SqlJsStatic } from 'sql.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class Database {
  private db: SqlJsDatabase | null = null;
  private SQL: SqlJsStatic | null = null;
  private dbPath: string;

  constructor() {
    this.dbPath = path.join(process.cwd(), 'api', 'data', 'library.db');
  }

  async init() {
    try {
      // 初始化 SQL.js
      this.SQL = await initSqlJs();
      
      // 确保数据目录存在
      const dataDir = path.dirname(this.dbPath);
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }

      // 加载或创建数据库
      if (fs.existsSync(this.dbPath)) {
        const filebuffer = fs.readFileSync(this.dbPath);
        this.db = new this.SQL.Database(filebuffer);
        // 对现有数据库执行迁移
        await this.runMigrations();
      } else {
        this.db = new this.SQL.Database();
        await this.initTables();
        this.saveDatabase();
      }

      console.log('数据库初始化成功');
    } catch (error) {
      console.error('数据库初始化失败:', error);
      throw error;
    }
  }

  private async initTables() {
    try {
      const initSqlPath = path.join(__dirname, 'init.sql');
      const initSql = fs.readFileSync(initSqlPath, 'utf8');
      
      // 分割SQL语句并执行
      const statements = initSql.split(';').filter(stmt => stmt.trim());
      for (const statement of statements) {
        if (statement.trim()) {
          this.db.run(statement);
        }
      }
      
      console.log('数据库表初始化完成');
    } catch (error) {
      console.error('初始化数据库表失败:', error);
      throw error;
    }
  }

  async runMigrations() {
    try {
      const migrationsDir = path.join(__dirname, 'migrations');
      if (!fs.existsSync(migrationsDir)) {
        return;
      }

      const migrationFiles = fs.readdirSync(migrationsDir)
        .filter(file => file.endsWith('.sql'))
        .sort();

      for (const file of migrationFiles) {
        try {
          const migrationPath = path.join(migrationsDir, file);
          const migrationSql = fs.readFileSync(migrationPath, 'utf8');
          
          // 分割SQL语句并执行
          const statements = migrationSql.split(';').filter(stmt => stmt.trim());
          for (const statement of statements) {
            if (statement.trim()) {
              this.db.run(statement);
            }
          }
          
          console.log(`迁移文件 ${file} 执行完成`);
        } catch (error: unknown) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          console.warn(`迁移文件 ${file} 执行失败:`, errorMessage);
          // 继续执行其他迁移文件
        }
      }
      
      this.saveDatabase();
      console.log('数据库迁移完成');
    } catch (error) {
      console.error('执行数据库迁移失败:', error);
    }
  }

  saveDatabase() {
    try {
      const data = this.db.export();
      fs.writeFileSync(this.dbPath, data);
    } catch (error) {
      console.error('保存数据库失败:', error);
    }
  }

  query(sql: string, params: any[] = []) {
    try {
      if (!this.db) throw new Error('Database not initialized');
      const stmt = this.db.prepare(sql);
      stmt.bind(params);
      if (stmt.step()) {
        const result = stmt.getAsObject();
        stmt.free();
        return result;
      }
      stmt.free();
      return null;
    } catch (error) {
      console.error('查询失败:', error);
      throw error;
    }
  }

  queryAll(sql: string, params: any[] = []) {
    try {
      if (!this.db) throw new Error('Database not initialized');
      const stmt = this.db.prepare(sql);
      stmt.bind(params);
      const results = [];
      while (stmt.step()) {
        results.push(stmt.getAsObject());
      }
      stmt.free();
      return results;
    } catch (error) {
      console.error('查询失败:', error);
      throw error;
    }
  }

  run(sql: string, params: any[] = []) {
    try {
      if (!this.db) throw new Error('Database not initialized');
      // 过滤掉undefined值，替换为null
      const filteredParams = params.map(param => param === undefined ? null : param);
      
      const stmt = this.db.prepare(sql);
      stmt.bind(filteredParams);
      stmt.step();
      const changes = this.db.getRowsModified();
      stmt.free();
      this.saveDatabase();
      return { changes };
    } catch (error) {
      console.error('执行SQL失败:', error);
      throw error;
    }
  }

  close() {
    if (this.db) {
      this.saveDatabase();
      this.db.close();
    }
  }
}

// 创建单例实例
const database = new Database();

export default database;