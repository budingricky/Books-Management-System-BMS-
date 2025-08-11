/**
 * 数据库功能测试脚本
 * 测试SQLite数据库连接、表结构、数据操作等功能
 */

import initSqlJs from 'sql.js';
import fs from 'fs';
import path from 'path';

class DatabaseTester {
  constructor() {
    this.dbPath = path.join(process.cwd(), 'data', 'library.db');
    this.db = null;
    this.SQL = null;
    this.testResults = {
      passed: 0,
      failed: 0,
      tests: []
    };
  }

  async logTest(testName, passed, details = '') {
    const result = passed ? '✅' : '❌';
    console.log(`${result} ${testName}${details ? ': ' + details : ''}`);
    
    this.testResults.tests.push({
      name: testName,
      passed,
      details
    });
    
    if (passed) {
      this.testResults.passed++;
    } else {
      this.testResults.failed++;
    }
  }

  async testDatabaseConnection() {
    console.log('\n🔌 测试数据库连接...');
    
    try {
      // 初始化SQL.js
      this.SQL = await initSqlJs();
      await this.logTest('SQL.js初始化', true);
      
      // 检查数据库文件是否存在
      const dbExists = fs.existsSync(this.dbPath);
      await this.logTest('数据库文件存在', dbExists, this.dbPath);
      
      if (!dbExists) {
        await this.logTest('数据库连接', false, '数据库文件不存在');
        return false;
      }
      
      // 读取数据库文件
      const filebuffer = fs.readFileSync(this.dbPath);
      this.db = new this.SQL.Database(filebuffer);
      await this.logTest('数据库连接成功', true);
      
      // 测试基本查询
      const result = this.db.exec('SELECT 1 as test');
      await this.logTest('基本查询测试', result.length > 0);
      
      return true;
    } catch (error) {
      await this.logTest('数据库连接', false, error.message);
      return false;
    }
  }

  async testTableStructure() {
    console.log('\n📋 测试表结构...');
    
    if (!this.db) {
      await this.logTest('表结构测试', false, '数据库未连接');
      return;
    }
    
    const expectedTables = ['books', 'categories', 'borrows', 'settings'];
    
    try {
      // 获取所有表
      const tablesResult = this.db.exec(`
        SELECT name FROM sqlite_master 
        WHERE type='table' AND name NOT LIKE 'sqlite_%'
      `);
      const tables = tablesResult.length > 0 ? tablesResult[0].values.map(row => ({ name: row[0] })) : [];
      
      const tableNames = tables.map(t => t.name);
      await this.logTest('获取表列表', tables.length > 0, `找到${tables.length}个表`);
      
      // 检查每个预期的表
      for (const tableName of expectedTables) {
        const exists = tableNames.includes(tableName);
        await this.logTest(`表存在: ${tableName}`, exists);
        
        if (exists) {
          // 检查表结构
          const columnsResult = this.db.exec(`PRAGMA table_info(${tableName})`);
          const columns = columnsResult.length > 0 ? columnsResult[0].values : [];
          await this.logTest(`${tableName}表结构`, columns.length > 0, `${columns.length}个字段`);
        }
      }
      
    } catch (error) {
      await this.logTest('表结构测试', false, error.message);
    }
  }

  async testBooksTable() {
    console.log('\n📚 测试图书表...');
    
    if (!this.db) return;
    
    try {
      // 检查图书表结构
      const columnsResult = this.db.exec('PRAGMA table_info(books)');
      const columns = columnsResult.length > 0 ? columnsResult[0].values : [];
      const columnNames = columns.map(c => c[1]); // 第二列是字段名
      
      const requiredColumns = ['id', 'isbn', 'title', 'author', 'publisher', 'category_id', 'status'];
      for (const col of requiredColumns) {
        await this.logTest(`books表字段: ${col}`, columnNames.includes(col));
      }
      
      // 检查数据
      const bookCountResult = this.db.exec('SELECT COUNT(*) as count FROM books');
      const bookCount = bookCountResult.length > 0 ? bookCountResult[0].values[0][0] : 0;
      await this.logTest('图书数据查询', true, `共${bookCount}本图书`);
      
      // 检查状态值
      const statusesResult = this.db.exec('SELECT DISTINCT status FROM books');
      const statusValues = statusesResult.length > 0 ? statusesResult[0].values.map(row => row[0]) : [];
      await this.logTest('图书状态值', statusValues.length > 0, `状态: ${statusValues.join(', ')}`);
      
      // 检查索引
      const indexesResult = this.db.exec(`
        SELECT name FROM sqlite_master 
        WHERE type='index' AND tbl_name='books'
      `);
      const indexes = indexesResult.length > 0 ? indexesResult[0].values : [];
      await this.logTest('books表索引', indexes.length > 0, `${indexes.length}个索引`);
      
    } catch (error) {
      await this.logTest('图书表测试', false, error.message);
    }
  }

  async testCategoriesTable() {
    console.log('\n📂 测试分类表...');
    
    if (!this.db) return;
    
    try {
      // 检查分类表结构
      const columnsResult = this.db.exec('PRAGMA table_info(categories)');
      const columns = columnsResult.length > 0 ? columnsResult[0].values : [];
      const columnNames = columns.map(c => c[1]); // 第二列是字段名
      
      const requiredColumns = ['id', 'name', 'code', 'level', 'parent_id'];
      for (const col of requiredColumns) {
        await this.logTest(`categories表字段: ${col}`, columnNames.includes(col));
      }
      
      // 检查数据
      const categoryCountResult = this.db.exec('SELECT COUNT(*) as count FROM categories');
      const categoryCount = categoryCountResult.length > 0 ? categoryCountResult[0].values[0][0] : 0;
      await this.logTest('分类数据查询', true, `共${categoryCount}个分类`);
      
      // 检查层级结构
      const levelsResult = this.db.exec('SELECT DISTINCT level FROM categories ORDER BY level');
      const levelValues = levelsResult.length > 0 ? levelsResult[0].values.map(row => row[0]) : [];
      await this.logTest('分类层级结构', levelValues.length > 0, `层级: ${levelValues.join(', ')}`);
      
      // 检查父子关系
      const parentCategoriesResult = this.db.exec('SELECT COUNT(*) as count FROM categories WHERE parent_id IS NULL');
      const childCategoriesResult = this.db.exec('SELECT COUNT(*) as count FROM categories WHERE parent_id IS NOT NULL');
      const parentCount = parentCategoriesResult.length > 0 ? parentCategoriesResult[0].values[0][0] : 0;
      const childCount = childCategoriesResult.length > 0 ? childCategoriesResult[0].values[0][0] : 0;
      await this.logTest('分类父子关系', true, `根分类: ${parentCount}, 子分类: ${childCount}`);
      
    } catch (error) {
      await this.logTest('分类表测试', false, error.message);
    }
  }

  async testBorrowsTable() {
    console.log('\n📋 测试借阅表...');
    
    if (!this.db) return;
    
    try {
      // 检查借阅表结构
      const columnsResult = this.db.exec('PRAGMA table_info(borrows)');
      const columns = columnsResult.length > 0 ? columnsResult[0].values : [];
      const columnNames = columns.map(c => c[1]); // 第二列是字段名
      
      const requiredColumns = ['id', 'book_id', 'borrower', 'due_date', 'status', 'created_at'];
      for (const col of requiredColumns) {
        await this.logTest(`borrows表字段: ${col}`, columnNames.includes(col));
      }
      
      // 检查数据
      const borrowCountResult = this.db.exec('SELECT COUNT(*) as count FROM borrows');
      const borrowCount = borrowCountResult.length > 0 ? borrowCountResult[0].values[0][0] : 0;
      await this.logTest('借阅数据查询', true, `共${borrowCount}条借阅记录`);
      
      // 检查借阅状态
      const statusesResult = this.db.exec('SELECT DISTINCT status FROM borrows');
      const statusValues = statusesResult.length > 0 ? statusesResult[0].values.map(row => row[0]) : [];
      await this.logTest('借阅状态值', statusValues.length > 0, `状态: ${statusValues.join(', ')}`);
      
      // 检查当前借阅
      const currentBorrowsResult = this.db.exec('SELECT COUNT(*) as count FROM borrows WHERE status = "borrowed"');
      const currentBorrows = currentBorrowsResult.length > 0 ? currentBorrowsResult[0].values[0][0] : 0;
      await this.logTest('当前借阅统计', true, `当前借阅: ${currentBorrows}本`);
      
      // 检查逾期借阅
      const overdueBorrowsResult = this.db.exec(`
        SELECT COUNT(*) as count FROM borrows 
        WHERE status = 'borrowed' AND due_date < date('now')
      `);
      const overdueBorrows = overdueBorrowsResult.length > 0 ? overdueBorrowsResult[0].values[0][0] : 0;
      await this.logTest('逾期借阅统计', true, `逾期: ${overdueBorrows}本`);
      
    } catch (error) {
      await this.logTest('借阅表测试', false, error.message);
    }
  }

  async testSettingsTable() {
    console.log('\n⚙️ 测试设置表...');
    
    if (!this.db) return;
    
    try {
      // 检查设置表结构
      const columnsResult = this.db.exec('PRAGMA table_info(settings)');
      const columns = columnsResult.length > 0 ? columnsResult[0].values : [];
      const columnNames = columns.map(c => c[1]); // 第二列是字段名
      
      const requiredColumns = ['key', 'value', 'description', 'type'];
      for (const col of requiredColumns) {
        await this.logTest(`settings表字段: ${col}`, columnNames.includes(col));
      }
      
      // 检查数据
      const settingCountResult = this.db.exec('SELECT COUNT(*) as count FROM settings');
      const settingCount = settingCountResult.length > 0 ? settingCountResult[0].values[0][0] : 0;
      await this.logTest('设置数据查询', true, `共${settingCount}个设置项`);
      
      // 检查关键设置项
      const keySettings = ['default_borrow_days', 'max_borrow_books', 'isbn_api_key'];
      for (const key of keySettings) {
        const settingResult = this.db.exec('SELECT * FROM settings WHERE key = ?', [key]);
        const setting = settingResult.length > 0 && settingResult[0].values.length > 0 ? settingResult[0].values[0] : null;
        await this.logTest(`设置项: ${key}`, !!setting, setting ? `值: ${setting[1]}` : '不存在');
      }
      
    } catch (error) {
      await this.logTest('设置表测试', false, error.message);
    }
  }

  async testDataIntegrity() {
    console.log('\n🔍 测试数据完整性...');
    
    if (!this.db) return;
    
    try {
      // 检查图书和分类的关联
      const booksWithoutCategoryResult = this.db.exec(`
        SELECT COUNT(*) as count FROM books 
        WHERE category_id NOT IN (SELECT id FROM categories)
      `);
      const booksWithoutCategory = booksWithoutCategoryResult.length > 0 ? booksWithoutCategoryResult[0].values[0][0] : 0;
      await this.logTest('图书分类关联', booksWithoutCategory === 0, 
        booksWithoutCategory > 0 ? `${booksWithoutCategory}本图书分类不存在` : '所有图书分类正常');
      
      // 检查借阅和图书的关联
      const borrowsWithoutBookResult = this.db.exec(`
        SELECT COUNT(*) as count FROM borrows 
        WHERE book_id NOT IN (SELECT id FROM books)
      `);
      const borrowsWithoutBook = borrowsWithoutBookResult.length > 0 ? borrowsWithoutBookResult[0].values[0][0] : 0;
      await this.logTest('借阅图书关联', borrowsWithoutBook === 0,
        borrowsWithoutBook > 0 ? `${borrowsWithoutBook}条借阅记录图书不存在` : '所有借阅记录正常');
      
      // 检查图书状态一致性
      const inconsistentStatusResult = this.db.exec(`
        SELECT COUNT(*) as count FROM books b
        WHERE (b.status = 'borrowed' AND NOT EXISTS (
          SELECT 1 FROM borrows br WHERE br.book_id = b.id AND br.status = 'borrowed'
        )) OR (b.status = 'available' AND EXISTS (
          SELECT 1 FROM borrows br WHERE br.book_id = b.id AND br.status = 'borrowed'
        ))
      `);
      const inconsistentStatus = inconsistentStatusResult.length > 0 ? inconsistentStatusResult[0].values[0][0] : 0;
      await this.logTest('图书状态一致性', inconsistentStatus === 0,
        inconsistentStatus > 0 ? `${inconsistentStatus}本图书状态不一致` : '图书状态一致');
      
    } catch (error) {
      await this.logTest('数据完整性测试', false, error.message);
    }
  }

  async testDatabasePerformance() {
    console.log('\n⚡ 测试数据库性能...');
    
    if (!this.db) return;
    
    try {
      // 测试查询性能
      const startTime = Date.now();
      
      // 复杂查询测试
      const complexQueryResult = this.db.exec(`
        SELECT 
          b.id, b.title, b.author, b.status,
          c.name as category_name,
          COUNT(br.id) as borrow_count
        FROM books b
        LEFT JOIN categories c ON b.category_id = c.id
        LEFT JOIN borrows br ON b.id = br.book_id
        GROUP BY b.id, b.title, b.author, b.status, c.name
        ORDER BY borrow_count DESC
        LIMIT 10
      `);
      
      const results = complexQueryResult.length > 0 ? complexQueryResult[0].values : [];
      const queryTime = Date.now() - startTime;
      
      await this.logTest('复杂查询性能', queryTime < 1000, `查询时间: ${queryTime}ms, 结果: ${results.length}条`);
      
      // 测试索引效果
      const indexTestStart = Date.now();
      const indexQueryResult = this.db.exec('SELECT * FROM books WHERE isbn = ?', ['9787111213826']);
      const indexTime = Date.now() - indexTestStart;
      
      await this.logTest('索引查询性能', indexTime < 100, `查询时间: ${indexTime}ms`);
      
    } catch (error) {
      await this.logTest('数据库性能测试', false, error.message);
    }
  }

  async testDatabaseSize() {
    console.log('\n📊 测试数据库大小...');
    
    try {
      const stats = fs.statSync(this.dbPath);
      const sizeInMB = (stats.size / (1024 * 1024)).toFixed(2);
      
      await this.logTest('数据库文件大小', true, `${sizeInMB} MB`);
      
      // 检查是否需要优化
      const needsOptimization = stats.size > 100 * 1024 * 1024; // 100MB
      await this.logTest('数据库大小合理', !needsOptimization, 
        needsOptimization ? '数据库较大，建议优化' : '数据库大小正常');
      
    } catch (error) {
      await this.logTest('数据库大小检查', false, error.message);
    }
  }

  async generateReport() {
    console.log('\n' + '='.repeat(50));
    console.log('📋 数据库功能测试结果汇总:');
    console.log(`✅ 通过: ${this.testResults.passed}`);
    console.log(`❌ 失败: ${this.testResults.failed}`);
    console.log(`📊 成功率: ${((this.testResults.passed / (this.testResults.passed + this.testResults.failed)) * 100).toFixed(1)}%`);
    
    const failedTests = this.testResults.tests.filter(test => !test.passed);
    if (failedTests.length > 0) {
      console.log('\n❌ 失败的测试:');
      failedTests.forEach(test => {
        console.log(`   - ${test.name}: ${test.details}`);
      });
    }
    
    console.log('\n🎉 数据库功能测试完成!');
    
    // 生成测试报告文件
    const report = {
      timestamp: new Date().toISOString(),
      database: this.dbPath,
      summary: {
        total: this.testResults.passed + this.testResults.failed,
        passed: this.testResults.passed,
        failed: this.testResults.failed,
        successRate: ((this.testResults.passed / (this.testResults.passed + this.testResults.failed)) * 100).toFixed(1)
      },
      tests: this.testResults.tests
    };
    
    fs.writeFileSync('database-test-report.json', JSON.stringify(report, null, 2));
    console.log('\n📄 数据库测试报告已保存到: database-test-report.json');
  }

  async runAllTests() {
    console.log('🚀 开始数据库功能测试...');
    console.log('='.repeat(50));
    
    try {
      const connected = await this.testDatabaseConnection();
      
      if (connected) {
        await this.testTableStructure();
        await this.testBooksTable();
        await this.testCategoriesTable();
        await this.testBorrowsTable();
        await this.testSettingsTable();
        await this.testDataIntegrity();
        await this.testDatabasePerformance();
        await this.testDatabaseSize();
      }
      
      await this.generateReport();
      
    } catch (error) {
      console.error('❌ 测试过程中发生错误:', error);
    } finally {
      if (this.db) {
        this.db.close();
      }
    }
  }
}

// 运行测试
const tester = new DatabaseTester();
tester.runAllTests().catch(console.error);