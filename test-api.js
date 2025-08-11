// API测试脚本
import axios from 'axios';

const API_BASE_URL = 'http://localhost:3001/api';

// 创建axios实例
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 测试结果记录
const testResults = {
  passed: 0,
  failed: 0,
  errors: []
};

// 测试函数
async function runTest(testName, testFn) {
  try {
    console.log(`\n🧪 测试: ${testName}`);
    await testFn();
    console.log(`✅ ${testName} - 通过`);
    testResults.passed++;
  } catch (error) {
    console.log(`❌ ${testName} - 失败:`, error.message);
    testResults.failed++;
    testResults.errors.push({ test: testName, error: error.message });
  }
}

// 1. 测试统计API
async function testStatisticsAPI() {
  const response = await api.get('/statistics/overview');
  if (response.status !== 200) {
    throw new Error(`期望状态码200，实际${response.status}`);
  }
  if (!response.data || typeof response.data !== 'object') {
    throw new Error('响应数据格式错误');
  }
  console.log('   统计数据:', response.data);
}

// 2. 测试分类API
async function testCategoriesAPI() {
  // 获取分类列表
  const response = await api.get('/categories');
  if (response.status !== 200) {
    throw new Error(`期望状态码200，实际${response.status}`);
  }
  const categories = response.data.success ? response.data.data : response.data;
  console.log('   分类数量:', Array.isArray(categories) ? categories.length : '数据格式错误');
}

// 3. 测试图书API
async function testBooksAPI() {
  // 获取图书列表
  const response = await api.get('/books?page=1&limit=10');
  if (response.status !== 200) {
    throw new Error(`期望状态码200，实际${response.status}`);
  }
  const data = response.data.success ? response.data.data : response.data;
  if (!data || !data.books || !Array.isArray(data.books)) {
    throw new Error('图书列表数据格式错误');
  }
  console.log('   图书数量:', data.total);
  console.log('   当前页图书:', data.books.length);
}

// 4. 测试借阅API
async function testBorrowsAPI() {
  // 获取借阅记录
  const response = await api.get('/borrows?page=1&limit=10');
  if (response.status !== 200) {
    throw new Error(`期望状态码200，实际${response.status}`);
  }
  const data = response.data.success ? response.data.data : response.data;
  if (!data || !data.borrows || !Array.isArray(data.borrows)) {
    throw new Error('借阅记录数据格式错误');
  }
  console.log('   借阅记录数量:', data.total);
}

// 5. 测试即将到期API
async function testDueSoonAPI() {
  const response = await api.get('/borrows/due-soon?days=7');
  if (response.status !== 200) {
    throw new Error(`期望状态码200，实际${response.status}`);
  }
  const data = response.data.success ? response.data.data : response.data;
  if (!Array.isArray(data)) {
    throw new Error('即将到期数据格式错误');
  }
  console.log('   即将到期数量:', data.length);
}

// 6. 测试设置API
async function testSettingsAPI() {
  const response = await api.get('/settings');
  if (response.status !== 200) {
    throw new Error(`期望状态码200，实际${response.status}`);
  }
  const data = response.data.success ? response.data.data : response.data;
  if (typeof data !== 'object' || data === null) {
    throw new Error('设置数据格式错误');
  }
  console.log('   设置项数量:', Object.keys(data).length);
}

// 7. 测试ISBN API（可能会失败，因为需要外部API）
async function testISBNAPI() {
  try {
    const response = await api.get('/isbn/9787111213826');
    if (response.status === 200) {
      console.log('   ISBN查询成功');
    }
  } catch (error) {
    if (error.response && error.response.status === 404) {
      console.log('   ISBN未找到（正常）');
    } else {
      throw error;
    }
  }
}

// 8. 测试添加图书API
async function testAddBookAPI() {
  const testBook = {
    title: '测试图书',
    author: '测试作者',
    isbn: '9999999999999',
    publisher: '测试出版社',
    publishDate: '2024-01-01',
    categoryId: 1,
    coverUrl: '',
    description: '这是一本测试图书',
    room: 'A',
    shelf: '1',
    row: '1',
    column: '1',
    number: '001'
  };
  
  try {
    const response = await api.post('/books', testBook);
    if (response.status === 201) {
      console.log('   图书添加成功，ID:', response.data.id);
      // 删除测试图书
      await api.delete(`/books/${response.data.id}`);
      console.log('   测试图书已删除');
    }
  } catch (error) {
    if (error.response && error.response.status === 400 && error.response.data.message.includes('ISBN')) {
      console.log('   ISBN重复检查正常工作');
    } else {
      throw error;
    }
  }
}

// 主测试函数
async function runAllTests() {
  console.log('🚀 开始API功能测试...');
  console.log('=' .repeat(50));
  
  await runTest('统计API测试', testStatisticsAPI);
  await runTest('分类API测试', testCategoriesAPI);
  await runTest('图书API测试', testBooksAPI);
  await runTest('借阅API测试', testBorrowsAPI);
  await runTest('即将到期API测试', testDueSoonAPI);
  await runTest('设置API测试', testSettingsAPI);
  await runTest('ISBN API测试', testISBNAPI);
  await runTest('添加图书API测试', testAddBookAPI);
  
  console.log('\n' + '=' .repeat(50));
  console.log('📊 测试结果汇总:');
  console.log(`✅ 通过: ${testResults.passed}`);
  console.log(`❌ 失败: ${testResults.failed}`);
  
  if (testResults.errors.length > 0) {
    console.log('\n❌ 失败详情:');
    testResults.errors.forEach((error, index) => {
      console.log(`${index + 1}. ${error.test}: ${error.error}`);
    });
  }
  
  if (testResults.failed === 0) {
    console.log('\n🎉 所有API测试通过！');
  } else {
    console.log('\n⚠️  部分API测试失败，请检查服务器日志');
  }
}

// 运行测试
runAllTests().catch(error => {
  console.error('测试运行失败:', error);
  process.exit(1);
});