#!/usr/bin/env node

const path = require('path');

// 命令映射表
const COMMANDS = {
  setup: 'setup.js',
  'verify-commit': 'verify-commit.js',
};

// 获取命令参数
const command = process.argv[2];

// 显示帮助信息
function showHelp(exitCode = 0) {
  const prefix = exitCode === 0 ? 'Usage' : 'Available commands';
  const output = exitCode === 0 ? console.log : console.error;

  output(`${prefix}: crucialy <command>`);
  output('\nAvailable commands:');
  output('  setup         - Setup git hooks');
  output('  verify-commit - Verify commit message format');
  process.exit(exitCode);
}

// 执行命令
if (!command) {
  showHelp(0);
} else if (command in COMMANDS) {
  const scriptPath = path.join(__dirname, 'commands', COMMANDS[command]);

  if (command === 'verify-commit') {
    // 修改 process.argv，让 verify-commit.js 能正确获取文件路径
    process.argv = [process.argv[0], scriptPath, process.argv[3]];
  }

  require(scriptPath);
} else {
  console.error(`Unknown command: ${command}`);
  showHelp(1);
}
