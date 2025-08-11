const axios = require('axios');
const fs = require('fs');

const BASE_URL = 'http://localhost:3001';
const API_URL = `${BASE_URL}/api`;

// 测试结果统计
let testResults = {
  total: 0,
  passed: 0,
  failed: 0,
  errors: [],
  details: []
};

// 测试辅助函数
function logTest(name, success, message = '', response = null) {
  testResults.total++;
  if (success) {
    testResults.passed++;
    console.log(`✅ ${name}`);
  } else {
    testResults.failed++;
    console.log(`❌ ${name}: ${message}`);
    testResults.errors.push({ test: name, error: message, response });
  }
  
  testResults.details.push({
    test: name,
    success,
    message,
    timestamp: new Date().toISOString()
  });
}

// 延迟函数
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// 测试健康检查
async function testHealthCheck() {
  console.log('\n=== 健康检查测试 ===');
  try {
    const response = await axios.get(`${API_URL}/health`);
    logTest('健康检查', response.status === 200 && response.data.status === 'ok');
  } catch (error) {
    logTest('健康检查', false, error.message);
  }
}

// 测试图书相关API
async function testBooksAPI() {
  console.log('\n=== 图书API测试 ===');
  let bookId = null;
  
  // 获取图书列表
  try {
    const response = await axios.get(`${API_URL}/books`);
    logTest('获取图书列表', response.status === 200 && Array.isArray(response.data));
  } catch (error) {
    logTest('获取图书列表', false, error.message);
  }
  
  // 添加图书
  try {
    const newBook = {
      title: '测试图书' + Date.now(),
      author: '测试作者',
      isbn: '9780000000000',
      category_id: 1,
      location: '测试位置',
      total_copies: 5,
      available_copies: 5
    };
    
    const response = await axios.post(`${API_URL}/books`, newBook);
    if (response.status === 201 && response.data.id) {
      bookId = response.data.id;
      logTest('添加图书', true);
    } else {
      logTest('添加图书', false, '响应格式不正确');
    }
  } catch (error) {
    logTest('添加图书', false, error.message);
  }
  
  // 获取单本图书详情
  if (bookId) {
    try {
      const response = await axios.get(`${API_URL}/books/${bookId}`);
      logTest('获取图书详情', response.status === 200 && response.data.id === bookId);
    } catch (error) {
      logTest('获取图书详情', false, error.message);
    }
    
    // 更新图书
    try {
      const updateData = {
        title: '更新后的测试图书',
        author: '更新后的作者'
      };
      const response = await axios.put(`${API_URL}/books/${bookId}`, updateData);
      logTest('更新图书', response.status === 200);
    } catch (error) {
      logTest('更新图书', false, error.message);
    }
    
    // 删除图书
    try {
      const response = await axios.delete(`${API_URL}/books/${bookId}`);
      logTest('删除图书', response.status === 200);
    } catch (error) {
      logTest('删除图书', false, error.message);
    }
  }
  
  // 搜索图书
  try {
    const response = await axios.get(`${API_URL}/books/search?q=测试`);
    logTest('搜索图书', response.status === 200 && Array.isArray(response.data));
  } catch (error) {
    logTest('搜索图书', false, error.message);
  }
}

// 测试分类相关API
async function testCategoriesAPI() {
  console.log('\n=== 分类API测试 ===');
  let categoryId = null;
  
  // 获取分类列表
  try {
    const response = await axios.get(`${API_URL}/categories`);
    logTest('获取分类列表', response.status === 200 && Array.isArray(response.data));
  } catch (error) {
    logTest('获取分类列表', false, error.message);
  }
  
  // 添加分类
  try {
    const newCategory = {
      name: '测试分类' + Date.now(),
      description: '测试分类描述'
    };
    
    const response = await axios.post(`${API_URL}/categories`, newCategory);
    if (response.status === 201 && response.data.id) {
      categoryId = response.data.id;
      logTest('添加分类', true);
    } else {
      logTest('添加分类', false, '响应格式不正确');
    }
  } catch (error) {
    logTest('添加分类', false, error.message);
  }
  
  // 更新分类
  if (categoryId) {
    try {
      const updateData = {
        name: '更新后的测试分类',
        description: '更新后的描述'
      };
      const response = await axios.put(`${API_URL}/categories/${categoryId}`, updateData);
      logTest('更新分类', response.status === 200);
    } catch (error) {
      logTest('更新分类', false, error.message);
    }
    
    // 删除分类
    try {
      const response = await axios.delete(`${API_URL}/categories/${categoryId}`);
      logTest('删除分类', response.status === 200);
    } catch (error) {
      logTest('删除分类', false, error.message);
    }
  }
}

// 测试借阅相关API
async function testBorrowsAPI() {
  console.log('\n=== 借阅API测试 ===');
  
  // 获取借阅记录
  try {
    const response = await axios.get(`${API_URL}/borrows`);
    logTest('获取借阅记录', response.status === 200 && Array.isArray(response.data));
  } catch (error) {
    logTest('获取借阅记录', false, error.message);
  }
  
  // 获取即将到期的借阅
  try {
    const response = await axios.get(`${API_URL}/borrows/due-soon?days=7`);
    logTest('获取即将到期借阅', response.status === 200 && Array.isArray(response.data));
  } catch (error) {
    logTest('获取即将到期借阅', false, error.message);
  }
  
  // 获取最近活动
  try {
    const response = await axios.get(`${API_URL}/borrows/recent-activities?limit=5`);
    logTest('获取最近活动', response.status === 200 && Array.isArray(response.data));
  } catch (error) {
    logTest('获取最近活动', false, error.message);
  }
}

// 测试统计相关API
async function testStatisticsAPI() {
  console.log('\n=== 统计API测试 ===');
  
  // 获取概览统计
  try {
    const response = await axios.get(`${API_URL}/statistics/overview`);
    logTest('获取概览统计', response.status === 200 && typeof response.data === 'object');
  } catch (error) {
    logTest('获取概览统计', false, error.message);
  }
  
  // 获取月度统计
  try {
    const response = await axios.get(`${API_URL}/statistics/monthly-stats`);
    logTest('获取月度统计', response.status === 200 && Array.isArray(response.data));
  } catch (error) {
    logTest('获取月度统计', false, error.message);
  }
  
  // 获取分类统计
  try {
    const response = await axios.get(`${API_URL}/statistics/category-stats`);
    logTest('获取分类统计', response.status === 200 && Array.isArray(response.data));
  } catch (error) {
    logTest('获取分类统计', false, error.message);
  }
}

// 测试设置相关API
async function testSettingsAPI() {
  console.log('\n=== 设置API测试 ===');
  
  // 获取设置
  try {
    const response = await axios.get(`${API_URL}/settings`);
    logTest('获取设置', response.status === 200 && Array.isArray(response.data));
  } catch (error) {
    logTest('获取设置', false, error.message);
  }
  
  // 更新设置
  try {
    const settings = [
      { key: 'library_name', value: '测试图书馆' },
      { key: 'max_borrow_days', value: '30' }
    ];
    const response = await axios.put(`${API_URL}/settings`, { settings });
    logTest('更新设置', response.status === 200);
  } catch (error) {
    logTest('更新设置', false, error.message);
  }
}

// 测试ISBN相关API
async function testISBNAPI() {
  console.log('\n=== ISBN API测试 ===');
  
  // 测试ISBN查询
  try {
    const response = await axios.get(`${API_URL}/isbn/9787111213826`);
    logTest('ISBN查询', response.status === 200 || response.status === 404);
  } catch (error) {
    logTest('ISBN查询', false, error.message);
  }
}

// 主测试函数
async function runAllTests() {
  console.log('🚀 开始API综合测试...');
  console.log('测试时间:', new Date().toLocaleString());
  
  await testHealthCheck();
  await delay(500);
  
  await testBooksAPI();
  await delay(500);
  
  await testCategoriesAPI();
  await delay(500);
  
  await testBorrowsAPI();
  await delay(500);
  
  await testStatisticsAPI();
  await delay(500);
  
  await testSettingsAPI();
  await delay(500);
  
  await testISBNAPI();
  
  // 生成测试报告
  const report = {
    summary: {
      total: testResults.total,
      passed: testResults.passed,
      failed: testResults.failed,
      successRate: ((testResults.passed / testResults.total) * 100).toFixed(2) + '%'
    },
    timestamp: new Date().toISOString(),
    details: testResults.details,
    errors: testResults.errors
  };
  
  console.log('\n📊 测试结果汇总:');
  console.log(`总测试数: ${report.summary.total}`);
  console.log(`通过: ${report.summary.passed}`);
  console.log(`失败: ${report.summary.failed}`);
  console.log(`成功率: ${report.summary.successRate}`);
  
  if (testResults.errors.length > 0) {
    console.log('\n❌ 失败的测试:');
    testResults.errors.forEach(error => {
      console.log(`- ${error.test}: ${error.error}`);
    });
  }
  
  // 保存测试报告
  fs.writeFileSync('api-test-report-2024.json', JSON.stringify(report, null, 2));
  console.log('\n📄 测试报告已保存到: api-test-report-2024.json');
  
  return report;
}

// 运行测试
if (require.main === module) {
  runAllTests().catch(console.error);
}

module.exports = { runAllTests };