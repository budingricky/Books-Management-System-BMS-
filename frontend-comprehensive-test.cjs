const fs = require('fs');
const path = require('path');
const axios = require('axios');

// 测试结果统计
let testResults = {
  total: 0,
  passed: 0,
  failed: 0,
  errors: [],
  details: []
};

// 测试辅助函数
function logTest(name, success, message = '') {
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
    timestamp: new Date().toISOString()
  });
}

// 检查文件是否存在
function fileExists(filePath) {
  try {
    return fs.existsSync(filePath);
  } catch (error) {
    return false;
  }
}

// 读取文件内容
function readFile(filePath) {
  try {
    return fs.readFileSync(filePath, 'utf8');
  } catch (error) {
    return null;
  }
}

// 测试项目结构
function testProjectStructure() {
  console.log('\n=== 项目结构测试 ===');
  
  const requiredFiles = [
    'src/App.tsx',
    'src/main.tsx',
    'src/index.css',
    'package.json',
    'tsconfig.json',
    'vite.config.ts',
    'tailwind.config.js'
  ];
  
  requiredFiles.forEach(file => {
    const exists = fileExists(path.join(process.cwd(), file));
    logTest(`文件存在: ${file}`, exists);
  });
  
  const requiredDirs = [
    'src/components',
    'src/pages',
    'src/utils',
    'src/hooks'
  ];
  
  requiredDirs.forEach(dir => {
    const exists = fileExists(path.join(process.cwd(), dir));
    logTest(`目录存在: ${dir}`, exists);
  });
}

// 测试React组件
function testReactComponents() {
  console.log('\n=== React组件测试 ===');
  
  const components = [
    'src/App.tsx',
    'src/components/Layout.tsx',
    'src/components/Empty.tsx',
    'src/pages/Home.tsx',
    'src/pages/Books.tsx',
    'src/pages/Borrows.tsx',
    'src/pages/Categories.tsx',
    'src/pages/Statistics.tsx',
    'src/pages/Settings.tsx'
  ];
  
  components.forEach(component => {
    const filePath = path.join(process.cwd(), component);
    const exists = fileExists(filePath);
    
    if (exists) {
      const content = readFile(filePath);
      if (content) {
        // 检查基本React组件结构
        const hasImportReact = content.includes('import') && (content.includes('react') || content.includes('React'));
        const hasExport = content.includes('export');
        const hasJSX = content.includes('<') && content.includes('>');
        
        logTest(`${component} - 基本结构`, hasImportReact && hasExport && hasJSX);
        
        // 检查TypeScript类型
        const hasTypeScript = content.includes(': ') || content.includes('interface') || content.includes('type ');
        logTest(`${component} - TypeScript类型`, hasTypeScript);
      } else {
        logTest(`${component} - 文件读取`, false, '无法读取文件内容');
      }
    } else {
      logTest(`${component} - 文件存在`, false, '文件不存在');
    }
  });
}

// 测试路由配置
function testRouting() {
  console.log('\n=== 路由配置测试 ===');
  
  const appPath = path.join(process.cwd(), 'src/App.tsx');
  const appContent = readFile(appPath);
  
  if (appContent) {
    // 检查路由器配置
    const hasRouter = appContent.includes('BrowserRouter') || appContent.includes('Router');
    logTest('路由器配置', hasRouter);
    
    // 检查路由定义
    const hasRoutes = appContent.includes('Route') && appContent.includes('path');
    logTest('路由定义', hasRoutes);
    
    // 检查主要路由
    const routes = ['/', '/books', '/borrows', '/categories', '/statistics', '/settings'];
    routes.forEach(route => {
      const hasRoute = appContent.includes(`path="${route}"`) || appContent.includes(`path='${route}'`);
      logTest(`路由: ${route}`, hasRoute);
    });
  } else {
    logTest('App.tsx读取', false, '无法读取App.tsx文件');
  }
}

// 测试样式配置
function testStyling() {
  console.log('\n=== 样式配置测试 ===');
  
  // 检查Tailwind配置
  const tailwindConfig = path.join(process.cwd(), 'tailwind.config.js');
  const tailwindExists = fileExists(tailwindConfig);
  logTest('Tailwind配置文件', tailwindExists);
  
  if (tailwindExists) {
    const tailwindContent = readFile(tailwindConfig);
    if (tailwindContent) {
      const hasContent = tailwindContent.includes('content') && tailwindContent.includes('./src');
      logTest('Tailwind内容配置', hasContent);
    }
  }
  
  // 检查主样式文件
  const indexCSS = path.join(process.cwd(), 'src/index.css');
  const cssExists = fileExists(indexCSS);
  logTest('主样式文件', cssExists);
  
  if (cssExists) {
    const cssContent = readFile(indexCSS);
    if (cssContent) {
      const hasTailwind = cssContent.includes('@tailwind');
      logTest('Tailwind导入', hasTailwind);
    }
  }
}

// 测试TypeScript配置
function testTypeScript() {
  console.log('\n=== TypeScript配置测试 ===');
  
  const tsconfigPath = path.join(process.cwd(), 'tsconfig.json');
  const tsconfigExists = fileExists(tsconfigPath);
  logTest('TypeScript配置文件', tsconfigExists);
  
  if (tsconfigExists) {
    try {
      const tsconfigContent = readFile(tsconfigPath);
      const tsconfig = JSON.parse(tsconfigContent);
      
      const hasCompilerOptions = tsconfig.compilerOptions !== undefined;
      logTest('编译选项配置', hasCompilerOptions);
      
      if (hasCompilerOptions) {
        const hasJSX = tsconfig.compilerOptions.jsx !== undefined;
        logTest('JSX配置', hasJSX);
        
        const hasModuleResolution = tsconfig.compilerOptions.moduleResolution !== undefined;
        logTest('模块解析配置', hasModuleResolution);
      }
    } catch (error) {
      logTest('TypeScript配置解析', false, error.message);
    }
  }
}

// 测试Vite配置
function testViteConfig() {
  console.log('\n=== Vite配置测试 ===');
  
  const viteConfigPath = path.join(process.cwd(), 'vite.config.ts');
  const viteConfigExists = fileExists(viteConfigPath);
  logTest('Vite配置文件', viteConfigExists);
  
  if (viteConfigExists) {
    const viteContent = readFile(viteConfigPath);
    if (viteContent) {
      const hasReactPlugin = viteContent.includes('@vitejs/plugin-react');
      logTest('React插件配置', hasReactPlugin);
      
      const hasServerConfig = viteContent.includes('server') || viteContent.includes('proxy');
      logTest('服务器配置', hasServerConfig);
    }
  }
}

// 测试API集成
async function testAPIIntegration() {
  console.log('\n=== API集成测试 ===');
  
  // 检查API工具文件
  const apiUtilPath = path.join(process.cwd(), 'src/utils/api.ts');
  const apiUtilExists = fileExists(apiUtilPath);
  logTest('API工具文件', apiUtilExists);
  
  if (apiUtilExists) {
    const apiContent = readFile(apiUtilPath);
    if (apiContent) {
      const hasAxios = apiContent.includes('axios');
      logTest('Axios集成', hasAxios);
      
      const hasAPIEndpoints = apiContent.includes('booksAPI') || apiContent.includes('categoriesAPI');
      logTest('API端点定义', hasAPIEndpoints);
    }
  }
  
  // 测试API连接
  try {
    const response = await axios.get('http://localhost:3001/api/health');
    logTest('API服务连接', response.status === 200);
  } catch (error) {
    logTest('API服务连接', false, error.message);
  }
}

// 测试包依赖
function testDependencies() {
  console.log('\n=== 包依赖测试 ===');
  
  const packagePath = path.join(process.cwd(), 'package.json');
  const packageExists = fileExists(packagePath);
  logTest('package.json文件', packageExists);
  
  if (packageExists) {
    try {
      const packageContent = readFile(packagePath);
      const packageJson = JSON.parse(packageContent);
      
      const requiredDeps = [
        'react',
        'react-dom',
        'react-router-dom',
        'axios',
        'tailwindcss',
        'typescript',
        'vite'
      ];
      
      const allDeps = {
        ...packageJson.dependencies,
        ...packageJson.devDependencies
      };
      
      requiredDeps.forEach(dep => {
        const hasDepencency = allDeps[dep] !== undefined;
        logTest(`依赖: ${dep}`, hasDepencency);
      });
      
      // 检查脚本
      const hasDevScript = packageJson.scripts && packageJson.scripts.dev;
      logTest('开发脚本', hasDevScript !== undefined);
      
      const hasBuildScript = packageJson.scripts && packageJson.scripts.build;
      logTest('构建脚本', hasBuildScript !== undefined);
      
    } catch (error) {
      logTest('package.json解析', false, error.message);
    }
  }
}

// 测试构建配置
function testBuildConfig() {
  console.log('\n=== 构建配置测试 ===');
  
  // 检查构建输出目录
  const distExists = fileExists(path.join(process.cwd(), 'dist'));
  logTest('构建输出目录', distExists);
  
  if (distExists) {
    const indexHtmlExists = fileExists(path.join(process.cwd(), 'dist/index.html'));
    logTest('构建HTML文件', indexHtmlExists);
    
    const assetsExists = fileExists(path.join(process.cwd(), 'dist/assets'));
    logTest('构建资源目录', assetsExists);
  }
}

// 主测试函数
async function runAllTests() {
  console.log('🚀 开始前端综合测试...');
  console.log('测试时间:', new Date().toLocaleString());
  
  testProjectStructure();
  testReactComponents();
  testRouting();
  testStyling();
  testTypeScript();
  testViteConfig();
  await testAPIIntegration();
  testDependencies();
  testBuildConfig();
  
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
  
  console.log('\n📊 前端测试结果汇总:');
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
  fs.writeFileSync('frontend-comprehensive-test-report.json', JSON.stringify(report, null, 2));
  console.log('\n📄 前端测试报告已保存到: frontend-comprehensive-test-report.json');
  
  return report;
}

// 运行测试
if (require.main === module) {
  runAllTests().catch(console.error);
}

module.exports = { runAllTests };