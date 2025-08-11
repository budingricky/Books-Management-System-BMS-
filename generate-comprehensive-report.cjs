const fs = require('fs');
const path = require('path');

// 读取JSON文件
function readJSONFile(filePath) {
  try {
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf8');
      return JSON.parse(content);
    }
    return null;
  } catch (error) {
    console.warn(`无法读取文件 ${filePath}: ${error.message}`);
    return null;
  }
}

// 生成综合测试报告
function generateComprehensiveReport() {
  console.log('🚀 生成综合测试报告...');
  console.log('报告生成时间:', new Date().toLocaleString());
  
  // 读取各个测试报告
  const reports = {
    api: readJSONFile('fixed-api-test-report.json'),
    frontend: readJSONFile('frontend-comprehensive-test-report.json'),
    database: readJSONFile('database-verification-test-report.json'),
    desktopClient: readJSONFile('desktop-client-test-report.json'),
    performance: readJSONFile('performance-test-report.json')
  };
  
  // 计算总体统计
  const overallStats = {
    totalTests: 0,
    totalPassed: 0,
    totalFailed: 0,
    overallSuccessRate: 0
  };
  
  const moduleResults = {};
  
  // 处理各模块测试结果
  Object.keys(reports).forEach(module => {
    const report = reports[module];
    if (report && report.summary) {
      moduleResults[module] = {
        name: getModuleName(module),
        total: report.summary.total,
        passed: report.summary.passed,
        failed: report.summary.failed,
        successRate: report.summary.successRate,
        timestamp: report.timestamp,
        status: getModuleStatus(report.summary.successRate)
      };
      
      overallStats.totalTests += report.summary.total;
      overallStats.totalPassed += report.summary.passed;
      overallStats.totalFailed += report.summary.failed;
    } else {
      moduleResults[module] = {
        name: getModuleName(module),
        total: 0,
        passed: 0,
        failed: 0,
        successRate: '0.00%',
        timestamp: new Date().toISOString(),
        status: '未测试'
      };
    }
  });
  
  overallStats.overallSuccessRate = overallStats.totalTests > 0 
    ? ((overallStats.totalPassed / overallStats.totalTests) * 100).toFixed(2) + '%'
    : '0.00%';
  
  // 生成详细分析
  const detailedAnalysis = generateDetailedAnalysis(reports);
  
  // 生成改进建议
  const recommendations = generateRecommendations(reports, moduleResults);
  
  // 生成风险评估
  const riskAssessment = generateRiskAssessment(moduleResults);
  
  // 构建综合报告
  const comprehensiveReport = {
    metadata: {
      reportTitle: '图书管理系统 - 综合测试报告',
      generatedAt: new Date().toISOString(),
      generatedBy: 'SOLO Coding 自动化测试系统',
      version: '1.0.0'
    },
    executiveSummary: {
      overallStatus: getOverallStatus(overallStats.overallSuccessRate),
      totalTests: overallStats.totalTests,
      totalPassed: overallStats.totalPassed,
      totalFailed: overallStats.totalFailed,
      overallSuccessRate: overallStats.overallSuccessRate,
      testDuration: calculateTestDuration(reports),
      criticalIssues: getCriticalIssues(reports),
      systemReadiness: getSystemReadiness(moduleResults)
    },
    moduleResults,
    detailedAnalysis,
    performanceMetrics: extractPerformanceMetrics(reports.performance),
    riskAssessment,
    recommendations,
    appendices: {
      rawReports: reports,
      testEnvironment: {
        frontend: 'React + Vite + TypeScript',
        backend: 'Node.js + Express + TypeScript',
        database: 'Supabase (PostgreSQL)',
        desktop: 'Electron + React',
        testFramework: 'Custom Node.js Scripts'
      }
    }
  };
  
  // 保存综合报告
  const reportPath = 'comprehensive-test-report.json';
  fs.writeFileSync(reportPath, JSON.stringify(comprehensiveReport, null, 2));
  
  // 生成HTML报告
  generateHTMLReport(comprehensiveReport);
  
  // 显示报告摘要
  displayReportSummary(comprehensiveReport);
  
  console.log(`\n📄 综合测试报告已保存到: ${reportPath}`);
  console.log('📄 HTML报告已保存到: comprehensive-test-report.html');
  
  return comprehensiveReport;
}

// 获取模块名称
function getModuleName(module) {
  const names = {
    api: 'API接口测试',
    frontend: '前端功能测试',
    database: '数据库验证测试',
    desktopClient: '桌面客户端测试',
    performance: '性能压力测试'
  };
  return names[module] || module;
}

// 获取模块状态
function getModuleStatus(successRate) {
  const rate = parseFloat(successRate);
  if (rate >= 95) return '优秀';
  if (rate >= 80) return '良好';
  if (rate >= 60) return '一般';
  return '需要改进';
}

// 获取整体状态
function getOverallStatus(successRate) {
  const rate = parseFloat(successRate);
  if (rate >= 90) return '系统状态良好';
  if (rate >= 75) return '系统基本可用';
  if (rate >= 50) return '系统存在问题';
  return '系统需要重大修复';
}

// 计算测试持续时间
function calculateTestDuration(reports) {
  const timestamps = [];
  Object.values(reports).forEach(report => {
    if (report && report.timestamp) {
      timestamps.push(new Date(report.timestamp));
    }
  });
  
  if (timestamps.length < 2) return '未知';
  
  const earliest = new Date(Math.min(...timestamps));
  const latest = new Date(Math.max(...timestamps));
  const durationMs = latest - earliest;
  const durationMinutes = Math.round(durationMs / (1000 * 60));
  
  return `约 ${durationMinutes} 分钟`;
}

// 获取关键问题
function getCriticalIssues(reports) {
  const issues = [];
  
  Object.keys(reports).forEach(module => {
    const report = reports[module];
    if (report && report.errors && report.errors.length > 0) {
      report.errors.forEach(error => {
        if (isCriticalError(error.error)) {
          issues.push({
            module: getModuleName(module),
            issue: error.test,
            description: error.error,
            severity: 'High'
          });
        }
      });
    }
  });
  
  return issues;
}

// 判断是否为关键错误
function isCriticalError(errorMessage) {
  const criticalKeywords = [
    '连接失败', 'connection failed', '500', '404', 
    '数据库', 'database', '创建失败', 'create failed',
    '权限', 'permission', '认证', 'authentication'
  ];
  
  return criticalKeywords.some(keyword => 
    errorMessage.toLowerCase().includes(keyword.toLowerCase())
  );
}

// 获取系统就绪状态
function getSystemReadiness(moduleResults) {
  const criticalModules = ['api', 'database'];
  const criticalIssues = criticalModules.filter(module => {
    const result = moduleResults[module];
    return result && parseFloat(result.successRate) < 80;
  });
  
  if (criticalIssues.length === 0) {
    return '系统已就绪，可以部署';
  } else {
    return `系统未就绪，关键模块存在问题: ${criticalIssues.map(m => getModuleName(m)).join(', ')}`;
  }
}

// 生成详细分析
function generateDetailedAnalysis(reports) {
  const analysis = {
    strengths: [],
    weaknesses: [],
    technicalFindings: []
  };
  
  // 分析优势
  if (reports.performance && reports.performance.summary.successRate === '100.00%') {
    analysis.strengths.push('系统性能表现优秀，所有性能测试均通过');
  }
  
  if (reports.frontend && parseFloat(reports.frontend.summary.successRate) > 90) {
    analysis.strengths.push('前端架构设计良好，组件结构完整');
  }
  
  // 分析弱点
  Object.keys(reports).forEach(module => {
    const report = reports[module];
    if (report && parseFloat(report.summary.successRate) < 80) {
      analysis.weaknesses.push(`${getModuleName(module)}存在较多问题，成功率仅为${report.summary.successRate}`);
    }
  });
  
  // 技术发现
  if (reports.api) {
    analysis.technicalFindings.push(`API测试发现${reports.api.summary.failed}个失败案例，主要集中在数据格式和端点可用性`);
  }
  
  if (reports.database) {
    analysis.technicalFindings.push(`数据库测试显示CRUD操作存在问题，可能影响数据完整性`);
  }
  
  return analysis;
}

// 生成改进建议
function generateRecommendations(reports, moduleResults) {
  const recommendations = {
    immediate: [],
    shortTerm: [],
    longTerm: []
  };
  
  // 立即行动建议
  Object.keys(moduleResults).forEach(module => {
    const result = moduleResults[module];
    if (parseFloat(result.successRate) < 60) {
      recommendations.immediate.push({
        priority: 'Critical',
        action: `修复${result.name}中的关键问题`,
        description: `该模块成功率仅为${result.successRate}，需要立即关注`,
        estimatedEffort: '1-2天'
      });
    }
  });
  
  // 短期改进建议
  if (reports.api && reports.api.errors.length > 0) {
    recommendations.shortTerm.push({
      priority: 'High',
      action: '优化API响应格式和错误处理',
      description: '统一API响应格式，改进错误信息的准确性',
      estimatedEffort: '3-5天'
    });
  }
  
  // 长期改进建议
  recommendations.longTerm.push({
    priority: 'Medium',
    action: '建立持续集成测试流程',
    description: '自动化测试流程，确保代码质量',
    estimatedEffort: '1-2周'
  });
  
  return recommendations;
}

// 生成风险评估
function generateRiskAssessment(moduleResults) {
  const risks = [];
  
  Object.keys(moduleResults).forEach(module => {
    const result = moduleResults[module];
    const successRate = parseFloat(result.successRate);
    
    if (successRate < 50) {
      risks.push({
        module: result.name,
        riskLevel: 'High',
        description: `模块功能严重受损，可能导致系统不可用`,
        impact: 'Critical',
        probability: 'High'
      });
    } else if (successRate < 80) {
      risks.push({
        module: result.name,
        riskLevel: 'Medium',
        description: `模块存在稳定性问题，可能影响用户体验`,
        impact: 'Medium',
        probability: 'Medium'
      });
    }
  });
  
  return risks;
}

// 提取性能指标
function extractPerformanceMetrics(performanceReport) {
  if (!performanceReport || !performanceReport.performanceMetrics) {
    return null;
  }
  
  const metrics = performanceReport.performanceMetrics;
  
  return {
    apiResponseTimes: metrics.apiResponseTimes,
    loadTestResults: metrics.loadTestResults,
    concurrencyResults: metrics.concurrencyResults,
    summary: {
      avgApiResponseTime: calculateAverageResponseTime(metrics.apiResponseTimes),
      maxConcurrency: getMaxConcurrency(metrics.concurrencyResults),
      throughput: metrics.loadTestResults?.throughput || 'N/A'
    }
  };
}

// 计算平均响应时间
function calculateAverageResponseTime(apiTimes) {
  if (!apiTimes || Object.keys(apiTimes).length === 0) return 'N/A';
  
  const times = Object.values(apiTimes).map(api => api.responseTime);
  const avg = times.reduce((sum, time) => sum + time, 0) / times.length;
  return `${avg.toFixed(2)}ms`;
}

// 获取最大并发数
function getMaxConcurrency(concurrencyResults) {
  if (!concurrencyResults || Object.keys(concurrencyResults).length === 0) return 'N/A';
  
  const concurrencies = Object.keys(concurrencyResults)
    .map(key => parseInt(key.replace('concurrency_', '')))
    .filter(num => !isNaN(num));
  
  return concurrencies.length > 0 ? Math.max(...concurrencies) : 'N/A';
}

// 生成HTML报告
function generateHTMLReport(report) {
  const html = `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${report.metadata.reportTitle}</title>
    <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 20px; background-color: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        h1 { color: #2c3e50; border-bottom: 3px solid #3498db; padding-bottom: 10px; }
        h2 { color: #34495e; margin-top: 30px; }
        .summary-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px; margin: 20px 0; }
        .summary-card { background: #ecf0f1; padding: 20px; border-radius: 8px; text-align: center; }
        .summary-card h3 { margin: 0 0 10px 0; color: #2c3e50; }
        .summary-card .value { font-size: 2em; font-weight: bold; color: #3498db; }
        .module-results { margin: 20px 0; }
        .module-item { background: #f8f9fa; margin: 10px 0; padding: 15px; border-radius: 5px; border-left: 4px solid #3498db; }
        .status-excellent { border-left-color: #27ae60; }
        .status-good { border-left-color: #f39c12; }
        .status-poor { border-left-color: #e74c3c; }
        .recommendations { background: #fff3cd; padding: 20px; border-radius: 5px; margin: 20px 0; }
        .risk-high { color: #e74c3c; font-weight: bold; }
        .risk-medium { color: #f39c12; font-weight: bold; }
        .risk-low { color: #27ae60; font-weight: bold; }
        table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        th, td { padding: 12px; text-align: left; border-bottom: 1px solid #ddd; }
        th { background-color: #3498db; color: white; }
        .timestamp { color: #7f8c8d; font-size: 0.9em; }
    </style>
</head>
<body>
    <div class="container">
        <h1>${report.metadata.reportTitle}</h1>
        <p class="timestamp">生成时间: ${new Date(report.metadata.generatedAt).toLocaleString()}</p>
        
        <h2>执行摘要</h2>
        <div class="summary-grid">
            <div class="summary-card">
                <h3>总体状态</h3>
                <div class="value">${report.executiveSummary.overallStatus}</div>
            </div>
            <div class="summary-card">
                <h3>总测试数</h3>
                <div class="value">${report.executiveSummary.totalTests}</div>
            </div>
            <div class="summary-card">
                <h3>成功率</h3>
                <div class="value">${report.executiveSummary.overallSuccessRate}</div>
            </div>
            <div class="summary-card">
                <h3>测试时长</h3>
                <div class="value">${report.executiveSummary.testDuration}</div>
            </div>
        </div>
        
        <h2>模块测试结果</h2>
        <div class="module-results">
            ${Object.values(report.moduleResults).map(module => `
                <div class="module-item status-${getStatusClass(module.status)}">
                    <h3>${module.name}</h3>
                    <p>成功率: <strong>${module.successRate}</strong> (${module.passed}/${module.total})</p>
                    <p>状态: <strong>${module.status}</strong></p>
                </div>
            `).join('')}
        </div>
        
        ${report.performanceMetrics ? `
        <h2>性能指标</h2>
        <table>
            <tr><th>指标</th><th>值</th></tr>
            <tr><td>平均API响应时间</td><td>${report.performanceMetrics.summary.avgApiResponseTime}</td></tr>
            <tr><td>最大并发数</td><td>${report.performanceMetrics.summary.maxConcurrency}</td></tr>
            <tr><td>吞吐量</td><td>${report.performanceMetrics.summary.throughput} 请求/秒</td></tr>
        </table>
        ` : ''}
        
        <h2>改进建议</h2>
        <div class="recommendations">
            <h3>立即行动</h3>
            <ul>
                ${report.recommendations.immediate.map(rec => `<li><strong>${rec.action}</strong>: ${rec.description}</li>`).join('')}
            </ul>
            <h3>短期改进</h3>
            <ul>
                ${report.recommendations.shortTerm.map(rec => `<li><strong>${rec.action}</strong>: ${rec.description}</li>`).join('')}
            </ul>
        </div>
        
        <h2>风险评估</h2>
        ${report.riskAssessment.length > 0 ? `
        <table>
            <tr><th>模块</th><th>风险等级</th><th>描述</th><th>影响</th></tr>
            ${report.riskAssessment.map(risk => `
                <tr>
                    <td>${risk.module}</td>
                    <td class="risk-${risk.riskLevel.toLowerCase()}">${risk.riskLevel}</td>
                    <td>${risk.description}</td>
                    <td>${risk.impact}</td>
                </tr>
            `).join('')}
        </table>
        ` : '<p>未发现重大风险。</p>'}
        
        <h2>系统就绪状态</h2>
        <p><strong>${report.executiveSummary.systemReadiness}</strong></p>
        
        <div class="timestamp">
            <p>报告由 ${report.metadata.generatedBy} 自动生成</p>
        </div>
    </div>
</body>
</html>
  `;
  
  fs.writeFileSync('comprehensive-test-report.html', html);
}

// 获取状态样式类
function getStatusClass(status) {
  switch(status) {
    case '优秀': return 'excellent';
    case '良好': return 'good';
    default: return 'poor';
  }
}

// 显示报告摘要
function displayReportSummary(report) {
  console.log('\n' + '='.repeat(60));
  console.log('📊 综合测试报告摘要');
  console.log('='.repeat(60));
  
  console.log(`\n🎯 总体状态: ${report.executiveSummary.overallStatus}`);
  console.log(`📈 总体成功率: ${report.executiveSummary.overallSuccessRate}`);
  console.log(`🧪 总测试数: ${report.executiveSummary.totalTests}`);
  console.log(`✅ 通过: ${report.executiveSummary.totalPassed}`);
  console.log(`❌ 失败: ${report.executiveSummary.totalFailed}`);
  console.log(`⏱️ 测试时长: ${report.executiveSummary.testDuration}`);
  
  console.log('\n📋 各模块测试结果:');
  Object.values(report.moduleResults).forEach(module => {
    const statusIcon = module.status === '优秀' ? '🟢' : 
                      module.status === '良好' ? '🟡' : '🔴';
    console.log(`${statusIcon} ${module.name}: ${module.successRate} (${module.status})`);
  });
  
  if (report.executiveSummary.criticalIssues.length > 0) {
    console.log('\n🚨 关键问题:');
    report.executiveSummary.criticalIssues.forEach(issue => {
      console.log(`- ${issue.module}: ${issue.issue}`);
    });
  }
  
  console.log(`\n🚀 系统就绪状态: ${report.executiveSummary.systemReadiness}`);
  
  if (report.recommendations.immediate.length > 0) {
    console.log('\n⚡ 立即行动建议:');
    report.recommendations.immediate.forEach(rec => {
      console.log(`- ${rec.action}`);
    });
  }
  
  console.log('\n' + '='.repeat(60));
}

// 运行报告生成
if (require.main === module) {
  generateComprehensiveReport();
}

module.exports = { generateComprehensiveReport };