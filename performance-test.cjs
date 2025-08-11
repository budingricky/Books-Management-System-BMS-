const fs = require('fs');
const axios = require('axios');
const { performance } = require('perf_hooks');

// 测试结果统计
let testResults = {
  total: 0,
  passed: 0,
  failed: 0,
  errors: [],
  details: [],
  performanceMetrics: {
    apiResponseTimes: {},
    loadTestResults: {},
    memoryUsage: [],
    concurrencyResults: {}
  }
};

// 测试辅助函数
function logTest(name, success, message = '', metrics = {}) {
  testResults.total++;
  if (success) {
    testResults.passed++;
    console.log(`✅ ${name}`);
  } else {
    testResults.failed++;
    console.log(`❌ ${name}: ${message}`);
    testResults.errors.push({ test: name, error: message });
  }
  
  testResults.details.push({
    test: name,
    success,
    message,
    metrics,
    timestamp: new Date().toISOString()
  });
}

// API基础URL
const API_BASE = 'http://localhost:3001/api';

// 延迟函数
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// 测量API响应时间
async function measureAPIResponseTime(endpoint, method = 'GET', data = null) {
  const startTime = performance.now();
  
  try {
    let response;
    if (method === 'GET') {
      response = await axios.get(`${API_BASE}${endpoint}`);
    } else if (method === 'POST') {
      response = await axios.post(`${API_BASE}${endpoint}`, data);
    } else if (method === 'PUT') {
      response = await axios.put(`${API_BASE}${endpoint}`, data);
    } else if (method === 'DELETE') {
      response = await axios.delete(`${API_BASE}${endpoint}`);
    }
    
    const endTime = performance.now();
    const responseTime = endTime - startTime;
    
    return {
      success: response.status === 200,
      responseTime,
      status: response.status,
      dataSize: JSON.stringify(response.data).length
    };
  } catch (error) {
    const endTime = performance.now();
    const responseTime = endTime - startTime;
    
    return {
      success: false,
      responseTime,
      error: error.message,
      status: error.response?.status || 0
    };
  }
}

// 测试API响应时间
async function testAPIResponseTimes() {
  console.log('\n=== API响应时间测试 ===');
  
  const endpoints = [
    { path: '/health', method: 'GET', name: '健康检查' },
    { path: '/books', method: 'GET', name: '获取图书列表' },
    { path: '/categories', method: 'GET', name: '获取分类列表' },
    { path: '/borrows', method: 'GET', name: '获取借阅记录' },
    { path: '/statistics/overview', method: 'GET', name: '获取概览统计' },
    { path: '/settings', method: 'GET', name: '获取设置' }
  ];
  
  for (const endpoint of endpoints) {
    const result = await measureAPIResponseTime(endpoint.path, endpoint.method);
    
    // 记录响应时间
    testResults.performanceMetrics.apiResponseTimes[endpoint.name] = {
      responseTime: result.responseTime,
      success: result.success,
      status: result.status,
      dataSize: result.dataSize || 0
    };
    
    // 判断响应时间是否合理（< 1000ms为良好，< 2000ms为可接受）
    const isGood = result.responseTime < 1000;
    const isAcceptable = result.responseTime < 2000;
    
    if (result.success) {
      if (isGood) {
        logTest(`${endpoint.name} - 响应时间优秀`, true, `${result.responseTime.toFixed(2)}ms`);
      } else if (isAcceptable) {
        logTest(`${endpoint.name} - 响应时间可接受`, true, `${result.responseTime.toFixed(2)}ms`);
      } else {
        logTest(`${endpoint.name} - 响应时间较慢`, false, `${result.responseTime.toFixed(2)}ms`);
      }
    } else {
      logTest(`${endpoint.name} - API调用`, false, result.error || '请求失败');
    }
    
    await delay(100); // 避免请求过快
  }
}

// 并发测试
async function testConcurrency() {
  console.log('\n=== 并发性能测试 ===');
  
  const concurrencyLevels = [5, 10, 20];
  const testEndpoint = '/health';
  
  for (const concurrency of concurrencyLevels) {
    console.log(`\n测试并发数: ${concurrency}`);
    
    const startTime = performance.now();
    const promises = [];
    
    // 创建并发请求
    for (let i = 0; i < concurrency; i++) {
      promises.push(measureAPIResponseTime(testEndpoint));
    }
    
    try {
      const results = await Promise.all(promises);
      const endTime = performance.now();
      const totalTime = endTime - startTime;
      
      // 分析结果
      const successCount = results.filter(r => r.success).length;
      const failureCount = results.length - successCount;
      const avgResponseTime = results.reduce((sum, r) => sum + r.responseTime, 0) / results.length;
      const maxResponseTime = Math.max(...results.map(r => r.responseTime));
      const minResponseTime = Math.min(...results.map(r => r.responseTime));
      
      // 记录并发测试结果
      testResults.performanceMetrics.concurrencyResults[`concurrency_${concurrency}`] = {
        totalTime,
        successCount,
        failureCount,
        avgResponseTime,
        maxResponseTime,
        minResponseTime,
        throughput: (successCount / (totalTime / 1000)).toFixed(2) // 每秒请求数
      };
      
      const successRate = (successCount / concurrency) * 100;
      const isGoodPerformance = avgResponseTime < 1000 && successRate >= 95;
      
      logTest(
        `并发${concurrency} - 成功率`,
        successRate >= 95,
        `${successRate.toFixed(1)}% (${successCount}/${concurrency})`
      );
      
      logTest(
        `并发${concurrency} - 平均响应时间`,
        avgResponseTime < 1000,
        `${avgResponseTime.toFixed(2)}ms`
      );
      
      logTest(
        `并发${concurrency} - 吞吐量`,
        isGoodPerformance,
        `${(successCount / (totalTime / 1000)).toFixed(2)} 请求/秒`
      );
      
    } catch (error) {
      logTest(`并发${concurrency} - 测试执行`, false, error.message);
    }
    
    await delay(1000); // 测试间隔
  }
}

// 负载测试
async function testLoad() {
  console.log('\n=== 负载测试 ===');
  
  const testDuration = 30000; // 30秒
  const requestInterval = 100; // 每100ms一个请求
  const testEndpoint = '/books';
  
  console.log(`开始负载测试，持续时间: ${testDuration/1000}秒`);
  
  const startTime = performance.now();
  const results = [];
  let requestCount = 0;
  
  const loadTestPromise = new Promise((resolve) => {
    const interval = setInterval(async () => {
      const currentTime = performance.now();
      if (currentTime - startTime >= testDuration) {
        clearInterval(interval);
        resolve();
        return;
      }
      
      requestCount++;
      const result = await measureAPIResponseTime(testEndpoint);
      results.push({
        ...result,
        timestamp: currentTime - startTime
      });
      
      // 记录内存使用情况
      const memUsage = process.memoryUsage();
      testResults.performanceMetrics.memoryUsage.push({
        timestamp: currentTime - startTime,
        heapUsed: memUsage.heapUsed,
        heapTotal: memUsage.heapTotal,
        external: memUsage.external,
        rss: memUsage.rss
      });
      
    }, requestInterval);
  });
  
  await loadTestPromise;
  
  const endTime = performance.now();
  const actualDuration = endTime - startTime;
  
  // 分析负载测试结果
  const successCount = results.filter(r => r.success).length;
  const failureCount = results.length - successCount;
  const avgResponseTime = results.reduce((sum, r) => sum + r.responseTime, 0) / results.length;
  const maxResponseTime = Math.max(...results.map(r => r.responseTime));
  const minResponseTime = Math.min(...results.map(r => r.responseTime));
  const throughput = (successCount / (actualDuration / 1000)).toFixed(2);
  
  // 记录负载测试结果
  testResults.performanceMetrics.loadTestResults = {
    duration: actualDuration,
    totalRequests: results.length,
    successCount,
    failureCount,
    successRate: ((successCount / results.length) * 100).toFixed(2),
    avgResponseTime,
    maxResponseTime,
    minResponseTime,
    throughput
  };
  
  logTest(
    '负载测试 - 成功率',
    successCount / results.length >= 0.95,
    `${((successCount / results.length) * 100).toFixed(2)}%`
  );
  
  logTest(
    '负载测试 - 平均响应时间',
    avgResponseTime < 1500,
    `${avgResponseTime.toFixed(2)}ms`
  );
  
  logTest(
    '负载测试 - 吞吐量',
    parseFloat(throughput) > 5,
    `${throughput} 请求/秒`
  );
  
  // 检查响应时间稳定性
  const responseTimeStdDev = Math.sqrt(
    results.reduce((sum, r) => sum + Math.pow(r.responseTime - avgResponseTime, 2), 0) / results.length
  );
  
  logTest(
    '负载测试 - 响应时间稳定性',
    responseTimeStdDev < avgResponseTime * 0.5,
    `标准差: ${responseTimeStdDev.toFixed(2)}ms`
  );
}

// 内存使用分析
function analyzeMemoryUsage() {
  console.log('\n=== 内存使用分析 ===');
  
  const memoryData = testResults.performanceMetrics.memoryUsage;
  
  if (memoryData.length === 0) {
    logTest('内存使用数据', false, '没有收集到内存使用数据');
    return;
  }
  
  const initialMemory = memoryData[0];
  const finalMemory = memoryData[memoryData.length - 1];
  const maxMemory = memoryData.reduce((max, current) => 
    current.heapUsed > max.heapUsed ? current : max
  );
  
  const memoryGrowth = finalMemory.heapUsed - initialMemory.heapUsed;
  const memoryGrowthMB = memoryGrowth / (1024 * 1024);
  const maxMemoryMB = maxMemory.heapUsed / (1024 * 1024);
  
  logTest(
    '内存使用 - 增长控制',
    Math.abs(memoryGrowthMB) < 50,
    `增长: ${memoryGrowthMB.toFixed(2)}MB`
  );
  
  logTest(
    '内存使用 - 峰值控制',
    maxMemoryMB < 200,
    `峰值: ${maxMemoryMB.toFixed(2)}MB`
  );
  
  // 检查内存泄漏迹象
  const memoryTrend = memoryData.slice(-10).reduce((sum, data) => sum + data.heapUsed, 0) / 10 -
                     memoryData.slice(0, 10).reduce((sum, data) => sum + data.heapUsed, 0) / 10;
  const memoryTrendMB = memoryTrend / (1024 * 1024);
  
  logTest(
    '内存使用 - 泄漏检测',
    Math.abs(memoryTrendMB) < 20,
    `趋势: ${memoryTrendMB.toFixed(2)}MB`
  );
}

// 数据库性能测试
async function testDatabasePerformance() {
  console.log('\n=== 数据库性能测试 ===');
  
  // 测试大量数据查询
  const largeDataEndpoints = [
    { path: '/books', name: '图书列表查询' },
    { path: '/borrows', name: '借阅记录查询' },
    { path: '/statistics/overview', name: '统计数据查询' }
  ];
  
  for (const endpoint of largeDataEndpoints) {
    const result = await measureAPIResponseTime(endpoint.path);
    
    if (result.success) {
      const isGoodDBPerformance = result.responseTime < 500;
      logTest(
        `${endpoint.name} - 数据库响应`,
        isGoodDBPerformance,
        `${result.responseTime.toFixed(2)}ms, 数据大小: ${(result.dataSize / 1024).toFixed(2)}KB`
      );
    } else {
      logTest(`${endpoint.name} - 数据库查询`, false, result.error);
    }
    
    await delay(200);
  }
}

// 主测试函数
async function runAllTests() {
  console.log('🚀 开始性能测试...');
  console.log('测试时间:', new Date().toLocaleString());
  
  await testAPIResponseTimes();
  await testConcurrency();
  await testDatabasePerformance();
  await testLoad();
  analyzeMemoryUsage();
  
  // 生成测试报告
  const report = {
    summary: {
      total: testResults.total,
      passed: testResults.passed,
      failed: testResults.failed,
      successRate: ((testResults.passed / testResults.total) * 100).toFixed(2) + '%'
    },
    performanceMetrics: testResults.performanceMetrics,
    timestamp: new Date().toISOString(),
    details: testResults.details,
    errors: testResults.errors,
    recommendations: generateRecommendations()
  };
  
  console.log('\n📊 性能测试结果汇总:');
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
  
  // 显示性能指标摘要
  console.log('\n📈 性能指标摘要:');
  const apiTimes = testResults.performanceMetrics.apiResponseTimes;
  Object.keys(apiTimes).forEach(api => {
    console.log(`- ${api}: ${apiTimes[api].responseTime.toFixed(2)}ms`);
  });
  
  if (testResults.performanceMetrics.loadTestResults.throughput) {
    console.log(`- 负载测试吞吐量: ${testResults.performanceMetrics.loadTestResults.throughput} 请求/秒`);
  }
  
  // 保存测试报告
  fs.writeFileSync('performance-test-report.json', JSON.stringify(report, null, 2));
  console.log('\n📄 性能测试报告已保存到: performance-test-report.json');
  
  return report;
}

// 生成性能优化建议
function generateRecommendations() {
  const recommendations = [];
  
  // 分析API响应时间
  const apiTimes = testResults.performanceMetrics.apiResponseTimes;
  Object.keys(apiTimes).forEach(api => {
    if (apiTimes[api].responseTime > 1000) {
      recommendations.push(`${api}响应时间较慢(${apiTimes[api].responseTime.toFixed(2)}ms)，建议优化数据库查询或添加缓存`);
    }
  });
  
  // 分析并发性能
  const concurrencyResults = testResults.performanceMetrics.concurrencyResults;
  Object.keys(concurrencyResults).forEach(test => {
    const result = concurrencyResults[test];
    if (result.avgResponseTime > 1000) {
      recommendations.push(`${test}平均响应时间较慢，建议优化服务器配置或增加负载均衡`);
    }
  });
  
  // 分析内存使用
  const memoryData = testResults.performanceMetrics.memoryUsage;
  if (memoryData.length > 0) {
    const maxMemoryMB = Math.max(...memoryData.map(m => m.heapUsed)) / (1024 * 1024);
    if (maxMemoryMB > 150) {
      recommendations.push(`内存使用峰值较高(${maxMemoryMB.toFixed(2)}MB)，建议检查内存泄漏或优化数据处理`);
    }
  }
  
  return recommendations;
}

// 运行测试
if (require.main === module) {
  runAllTests().catch(console.error);
}

module.exports = { runAllTests };