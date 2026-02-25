#!/usr/bin/env node

const fs = require('fs');

// 简单的颜色工具（替代 chalk）
const colors = {
  red: text => `\x1b[31m${text}\x1b[0m`,
  green: text => `\x1b[32m${text}\x1b[0m`,
  yellow: text => `\x1b[33m${text}\x1b[0m`,
  bgRed: { white: text => `\x1b[41m\x1b[97m${text}\x1b[0m` },
};

/**
 * 移除 commit message 中的注释行
 * Git commit message 中 # 开头的行会被视为注释，需要移除
 * @param {string} msg - 原始 commit message
 * @returns {string} 移除注释后的 commit message
 */
function removeComment(msg) {
  return msg.replace(/^#.*[\n\r]*/gm, '');
}

/**
 * 获取 commit message 文件路径
 * 支持从命令行参数或环境变量获取（兼容更多 git hooks 场景）
 */
const msgPath = process.argv[2] || process.env.GIT_PARAMS;

// 如果没有提供路径，静默退出（可能是非 git hooks 场景）
if (!msgPath) {
  process.exit(0);
}

/**
 * 读取并处理 commit message
 */
let msg;
try {
  const rawContent = fs.readFileSync(msgPath, 'utf-8');
  msg = removeComment(rawContent.trim());
} catch (error) {
  const errorMessage = error instanceof Error ? error.message : String(error);
  console.error(colors.red(`Error reading commit message file: ${msgPath}`));
  console.error(colors.red(`Details: ${errorMessage}`));
  process.exit(1);
}

/**
 * 约定式提交格式: <type>(<scope>): <subject>
 * 参考: https://github.com/angular/angular/blob/master/CONTRIBUTING.md#commit-message-header
 */
const COMMIT_TYPES = [
  'feat',
  'fix',
  'docs',
  'style',
  'refactor',
  'perf',
  'test',
  'build',
  'ci',
  'chore',
  'revert',
  'workflow',
  'types',
  'wip',
  'release',
  'dep',
  'deps',
  'example',
  'examples',
  'merge',
];

const SPECIAL_COMMITS = ['Merge', 'Revert', 'Version'];

// 提交信息主题最大长度
const SUBJECT_MAX_LENGTH = 50;

/**
 * 构建 commit message 验证正则表达式
 * 支持常规格式和特殊提交（Merge, Revert, Version）
 */
const commitRE = new RegExp(
  `^((${COMMIT_TYPES.join('|')})(\\(.+\\))?:|${SPECIAL_COMMITS.join('|')}) .{1,${SUBJECT_MAX_LENGTH}}`,
  'i',
);

/**
 * 输出错误信息和使用示例
 * 当 commit message 格式不符合约定时调用
 */
function printError() {
  console.log();
  console.error(`  ${colors.bgRed.white(' ERROR ')} ${colors.red('提交信息不符合约定格式')}`);
  console.log();
  console.error(`  ${colors.red('请使用格式：')} <type>(<scope>): <subject>`);
  console.log();
  console.error(`  ${colors.yellow('type 说明：')}`);
  console.error(`    feat      新功能`);
  console.error(`    fix       bug 修复`);
  console.error(`    chore     构建/脚本/依赖`);
  console.error(`    docs      文档或注释`);
  console.error(`    style     代码格式、样式调整`);
  console.error(`    refactor  代码重构（无新特性或修复）`);
  console.error(`    perf      性能优化`);
  console.error(`    test      测试用例`);
  console.error(`    build     构建系统或外部依赖`);
  console.error(`    ci        CI/CD 配置`);
  console.error(`    revert    回滚提交`);
  console.log();
  console.error(`  ${colors.yellow('例如：')}`);
  console.error(`    ${colors.green('feat: 新增功能')}`);
  console.error(`    ${colors.green('fix(lint): 修复配置问题')}`);
  console.error(`    ${colors.green('chore: 更新依赖版本')}`);
  console.error(`    ${colors.green("Merge branch 'main' into dev")}`);
  console.log();
}

/**
 * 验证 commit message 格式
 */
if (!commitRE.test(msg)) {
  printError();
  process.exit(1);
}

process.exit(0);
