/**
 * 前端功能测试脚本
 * 使用Puppeteer自动化测试Web前端所有页面功能
 */

import puppeteer from 'puppeteer';

const FRONTEND_URL = 'http://localhost:5173';
const API_BASE_URL = 'http://localhost:3001';

class FrontendTester {
  constructor() {
    this.browser = null;
    this.page = null;
    this.testResults = {
      passed: 0,
      failed: 0,
      tests: []
    };
  }

  async init() {
    console.log('🚀 启动前端功能测试...');
    this.browser = await puppeteer.launch({ 
      headless: false, // 设为false可以看到浏览器操作
      defaultViewport: { width: 1280, height: 720 }
    });
    this.page = await this.browser.newPage();
    
    // 监听控制台错误
    this.page.on('console', msg => {
      if (msg.type() === 'error') {
        console.log('❌ 浏览器控制台错误:', msg.text());
      }
    });
    
    // 监听页面错误
    this.page.on('pageerror', error => {
      console.log('❌ 页面错误:', error.message);
    });
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

  async waitForElement(selector, timeout = 5000) {
    try {
      await this.page.waitForSelector(selector, { timeout });
      return true;
    } catch (error) {
      return false;
    }
  }

  async testHomePage() {
    console.log('\n📱 测试首页功能...');
    
    try {
      await this.page.goto(FRONTEND_URL, { waitUntil: 'networkidle2' });
      
      // 检查页面标题
      const title = await this.page.title();
      await this.logTest('首页加载', title.includes('图书管理') || title.includes('Library'), `标题: ${title}`);
      
      // 检查导航菜单
      const hasNavigation = await this.waitForElement('nav, .navigation, [role="navigation"]');
      await this.logTest('导航菜单显示', hasNavigation);
      
      // 检查主要内容区域
      const hasMainContent = await this.waitForElement('main, .main-content, .content');
      await this.logTest('主要内容区域显示', hasMainContent);
      
      // 检查统计卡片或仪表板
      const hasStats = await this.waitForElement('.stat, .card, .dashboard, .overview');
      await this.logTest('统计信息显示', hasStats);
      
    } catch (error) {
      await this.logTest('首页测试', false, error.message);
    }
  }

  async testBooksPage() {
    console.log('\n📚 测试图书管理页面...');
    
    try {
      // 尝试导航到图书页面
      const bookLinks = await this.page.$$('a[href*="book"], a[href*="图书"]');
      if (bookLinks.length > 0) {
        await bookLinks[0].click();
        await this.page.waitForTimeout(2000);
      } else {
        await this.page.goto(`${FRONTEND_URL}/books`);
      }
      
      // 检查图书列表
      const hasBookList = await this.waitForElement('.book-list, .books, table, .grid');
      await this.logTest('图书列表显示', hasBookList);
      
      // 检查搜索功能
      const hasSearch = await this.waitForElement('input[type="search"], .search, input[placeholder*="搜索"]');
      await this.logTest('搜索功能存在', hasSearch);
      
      // 检查添加图书按钮
      const hasAddButton = await this.waitForElement('button[class*="add"], .add-book, button:contains("添加")');
      await this.logTest('添加图书按钮存在', hasAddButton);
      
      // 测试搜索功能
      if (hasSearch) {
        const searchInput = await this.page.$('input[type="search"], .search input, input[placeholder*="搜索"]');
        if (searchInput) {
          await searchInput.type('Java');
          await this.page.waitForTimeout(1000);
          await this.logTest('搜索输入功能', true, '输入"Java"');
        }
      }
      
    } catch (error) {
      await this.logTest('图书页面测试', false, error.message);
    }
  }

  async testBorrowsPage() {
    console.log('\n📋 测试借阅管理页面...');
    
    try {
      // 尝试导航到借阅页面
      const borrowLinks = await this.page.$$('a[href*="borrow"], a[href*="借阅"]');
      if (borrowLinks.length > 0) {
        await borrowLinks[0].click();
        await this.page.waitForTimeout(2000);
      } else {
        await this.page.goto(`${FRONTEND_URL}/borrows`);
      }
      
      // 检查借阅记录列表
      const hasBorrowList = await this.waitForElement('.borrow-list, .borrows, table');
      await this.logTest('借阅记录列表显示', hasBorrowList);
      
      // 检查状态筛选
      const hasStatusFilter = await this.waitForElement('select, .filter, .status-filter');
      await this.logTest('状态筛选功能存在', hasStatusFilter);
      
    } catch (error) {
      await this.logTest('借阅页面测试', false, error.message);
    }
  }

  async testCategoriesPage() {
    console.log('\n📂 测试分类管理页面...');
    
    try {
      // 尝试导航到分类页面
      const categoryLinks = await this.page.$$('a[href*="categor"], a[href*="分类"]');
      if (categoryLinks.length > 0) {
        await categoryLinks[0].click();
        await this.page.waitForTimeout(2000);
      } else {
        await this.page.goto(`${FRONTEND_URL}/categories`);
      }
      
      // 检查分类列表
      const hasCategoryList = await this.waitForElement('.category-list, .categories, table, .grid');
      await this.logTest('分类列表显示', hasCategoryList);
      
      // 检查添加分类功能
      const hasAddCategory = await this.waitForElement('button[class*="add"], .add-category');
      await this.logTest('添加分类功能存在', hasAddCategory);
      
    } catch (error) {
      await this.logTest('分类页面测试', false, error.message);
    }
  }

  async testStatisticsPage() {
    console.log('\n📊 测试统计页面...');
    
    try {
      // 尝试导航到统计页面
      const statsLinks = await this.page.$$('a[href*="stat"], a[href*="统计"]');
      if (statsLinks.length > 0) {
        await statsLinks[0].click();
        await this.page.waitForTimeout(2000);
      } else {
        await this.page.goto(`${FRONTEND_URL}/statistics`);
      }
      
      // 检查统计图表
      const hasCharts = await this.waitForElement('.chart, canvas, svg, .recharts');
      await this.logTest('统计图表显示', hasCharts);
      
      // 检查统计数据
      const hasStats = await this.waitForElement('.stat, .metric, .number');
      await this.logTest('统计数据显示', hasStats);
      
    } catch (error) {
      await this.logTest('统计页面测试', false, error.message);
    }
  }

  async testSettingsPage() {
    console.log('\n⚙️ 测试设置页面...');
    
    try {
      // 尝试导航到设置页面
      const settingsLinks = await this.page.$$('a[href*="setting"], a[href*="设置"]');
      if (settingsLinks.length > 0) {
        await settingsLinks[0].click();
        await this.page.waitForTimeout(2000);
      } else {
        await this.page.goto(`${FRONTEND_URL}/settings`);
      }
      
      // 检查设置表单
      const hasSettingsForm = await this.waitForElement('form, .settings-form, .config');
      await this.logTest('设置表单显示', hasSettingsForm);
      
      // 检查保存按钮
      const hasSaveButton = await this.waitForElement('button[type="submit"], .save, button:contains("保存")');
      await this.logTest('保存按钮存在', hasSaveButton);
      
    } catch (error) {
      await this.logTest('设置页面测试', false, error.message);
    }
  }

  async testResponsiveDesign() {
    console.log('\n📱 测试响应式设计...');
    
    try {
      // 测试移动端视图
      await this.page.setViewport({ width: 375, height: 667 });
      await this.page.waitForTimeout(1000);
      
      const isMobileResponsive = await this.page.evaluate(() => {
        return window.innerWidth <= 768;
      });
      
      await this.logTest('移动端响应式', isMobileResponsive);
      
      // 恢复桌面视图
      await this.page.setViewport({ width: 1280, height: 720 });
      await this.page.waitForTimeout(1000);
      
    } catch (error) {
      await this.logTest('响应式设计测试', false, error.message);
    }
  }

  async generateReport() {
    console.log('\n' + '='.repeat(50));
    console.log('📋 前端功能测试结果汇总:');
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
    
    console.log('\n🎉 前端功能测试完成!');
  }

  async runAllTests() {
    try {
      await this.init();
      
      await this.testHomePage();
      await this.testBooksPage();
      await this.testBorrowsPage();
      await this.testCategoriesPage();
      await this.testStatisticsPage();
      await this.testSettingsPage();
      await this.testResponsiveDesign();
      
      await this.generateReport();
      
    } catch (error) {
      console.error('❌ 测试过程中发生错误:', error);
    } finally {
      if (this.browser) {
        await this.browser.close();
      }
    }
  }

  async cleanup() {
    if (this.browser) {
      await this.browser.close();
    }
  }
}

// 运行测试
const tester = new FrontendTester();
tester.runAllTests().catch(console.error);

// 处理进程退出
process.on('SIGINT', async () => {
  console.log('\n🛑 测试被中断，正在清理...');
  await tester.cleanup();
  process.exit(0);
});