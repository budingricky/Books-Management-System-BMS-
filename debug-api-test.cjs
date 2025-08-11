const axios = require('axios');

const BASE_URL = 'http://localhost:3001';

// 测试添加图书API
async function testAddBook() {
  console.log('=== 测试添加图书API ===');
  
  const newBook = {
    title: '测试图书',
    author: '测试作者',
    isbn: '9787111111111',
    categoryId: 1,
    publisher: '测试出版社',
    publishDate: '2024-01-01',
    room: '101',
    shelf: 'A',
    row: '1',
    column: '1',
    number: '001',
    price: 29.99,
    status: 'available'
  };
  
  try {
    const response = await axios.post(`${BASE_URL}/api/books`, newBook);
    console.log('✓ 添加图书成功:', response.data);
    return response.data;
  } catch (error) {
    console.log('✗ 添加图书失败:');
    console.log('状态码:', error.response?.status);
    console.log('错误信息:', error.response?.data);
    console.log('请求数据:', newBook);
    return null;
  }
}

// 测试添加分类API
async function testAddCategory() {
  console.log('\n=== 测试添加分类API ===');
  
  const newCategory = {
    name: '测试分类',
    code: 'TEST_CAT'
  };
  
  try {
    const response = await axios.post(`${BASE_URL}/api/categories`, newCategory);
    console.log('✓ 添加分类成功:', response.data);
    return response.data;
  } catch (error) {
    console.log('✗ 添加分类失败:');
    console.log('状态码:', error.response?.status);
    console.log('错误信息:', error.response?.data);
    console.log('请求数据:', newCategory);
    return null;
  }
}

// 测试ISBN查询API
async function testISBNQuery() {
  console.log('\n=== 测试ISBN查询API ===');
  
  const isbn = '9787111111111';
  
  try {
    const response = await axios.get(`${BASE_URL}/api/isbn/${isbn}`);
    console.log('✓ ISBN查询成功:', response.data);
    return response.data;
  } catch (error) {
    console.log('✗ ISBN查询失败:');
    console.log('状态码:', error.response?.status);
    console.log('错误信息:', error.response?.data);
    console.log('查询ISBN:', isbn);
    return null;
  }
}

// 运行所有测试
async function runTests() {
  await testAddBook();
  await testAddCategory();
  await testISBNQuery();
}

runTests().catch(console.error);