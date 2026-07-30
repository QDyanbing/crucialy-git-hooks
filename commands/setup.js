#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// 项目根目录（当前工作目录）
const projectRoot = process.cwd();

// Hook 类型常量
const HOOK_TYPES = {
  PRE_COMMIT: 'pre-commit',
  COMMIT_MSG: 'commit-msg',
};

/**
 * Hook 内容模板映射
 */
const HOOK_CONTENT_MAP = {
  [HOOK_TYPES.COMMIT_MSG]: `crucialy verify-commit "$1"
`,
  [HOOK_TYPES.PRE_COMMIT]: `lint-staged --quiet
`,
};

const LEGACY_HOOK_CONTENT_MAP = {
  [HOOK_TYPES.COMMIT_MSG]: `#!/usr/bin/env sh
npx --no-install crucialy verify-commit "$1"
`,
  [HOOK_TYPES.PRE_COMMIT]: `#!/usr/bin/env sh
npx --no-install lint-staged --quiet
`,
};

/**
 * 生成 hook 文件内容
 * Husky 9.x 格式：不需要 husky.sh
 * @param {string} hook - Hook 名称（'pre-commit' 或 'commit-msg'）
 * @returns {string|null} Hook 文件内容，如果不支持的 hook 则返回 null
 */
function generateHookContent(hook) {
  return HOOK_CONTENT_MAP[hook] || null;
}

function isManagedHook(hook, content) {
  return [HOOK_CONTENT_MAP[hook], LEGACY_HOOK_CONTENT_MAP[hook]].includes(content);
}

/**
 * 解析命令行参数和环境变量
 * @returns {{ skipLint: boolean; skipCommitMsg: boolean }}
 */
function parseOptions() {
  const args = process.argv.slice(2);
  return {
    skipLint: args.includes('--skip-lint') || process.env.SKIP_LINT === 'true',
    skipCommitMsg: args.includes('--skip-commit-msg') || process.env.SKIP_COMMIT_MSG === 'true',
  };
}

/**
 * 确保目录存在
 * @param {string} dirPath - 目录路径
 */
function ensureDirectoryExists(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
    console.log(`✓ Created ${path.relative(projectRoot, dirPath)} directory`);
  }
}

function validateHook(hookDir, hook) {
  const target = path.join(hookDir, hook);

  if (!fs.existsSync(target)) {
    return;
  }

  const existingContent = fs.readFileSync(target, 'utf-8');
  if (!isManagedHook(hook, existingContent)) {
    throw new Error(`.husky/${hook} already exists and is not managed by @crucialy/git-hooks`);
  }
}

/**
 * 安装单个 hook 文件
 * @param {string} hookDir - Hook 目录路径
 * @param {string} hook - Hook 名称
 * @returns {boolean} 是否进行了更改
 */
function installHook(hookDir, hook) {
  const target = path.join(hookDir, hook);
  const expectedContent = generateHookContent(hook);

  if (!expectedContent) {
    console.warn(`⚠ Unknown hook type: ${hook}`);
    return false;
  }

  if (fs.existsSync(target)) {
    const existingContent = fs.readFileSync(target, 'utf-8');
    if (existingContent === expectedContent) {
      return false;
    }
  }

  fs.writeFileSync(target, expectedContent, 'utf-8');
  if (process.platform !== 'win32') {
    fs.chmodSync(target, '755');
  }
  console.log(`✓ Installed .husky/${hook}`);
  return true;
}

/**
 * 删除本包生成的 hook 文件
 * @param {string} hookDir - Hook 目录路径
 * @param {string} hook - Hook 名称
 * @returns {boolean} 是否进行了更改
 */
function removeHook(hookDir, hook) {
  const target = path.join(hookDir, hook);

  if (!fs.existsSync(target)) {
    return false;
  }

  const existingContent = fs.readFileSync(target, 'utf-8');
  if (!isManagedHook(hook, existingContent)) {
    return false;
  }

  fs.unlinkSync(target);
  console.log(`✓ Removed .husky/${hook}`);
  return true;
}

// 安装 husky hooks
function installHuskyHooks(options) {
  const huskyDir = path.join(projectRoot, '.husky');
  const { skipLint, skipCommitMsg } = options;

  if (!fs.existsSync(huskyDir) && skipLint && skipCommitMsg) {
    return false;
  }

  ensureDirectoryExists(huskyDir);

  const hooks = [
    [HOOK_TYPES.PRE_COMMIT, skipLint],
    [HOOK_TYPES.COMMIT_MSG, skipCommitMsg],
  ];

  for (const [hook, skip] of hooks) {
    if (!skip) {
      validateHook(huskyDir, hook);
    }
  }

  let changed = false;

  for (const [hook, skip] of hooks) {
    changed = (skip ? removeHook(huskyDir, hook) : installHook(huskyDir, hook)) || changed;
  }

  return changed;
}

/**
 * 安装 lint-staged 配置文件
 * 生成通用 .lintstagedrc 配置（支持 Vue 和 React）
 * @returns {boolean} 是否成功安装配置文件
 */
function installConfigFiles() {
  const lintstagedrcPath = path.join(projectRoot, '.lintstagedrc');

  // 如果文件已存在，跳过
  if (fs.existsSync(lintstagedrcPath)) {
    console.log('⚠ .lintstagedrc already exists, skipping');
    return false;
  }

  const lintstagedConfig = {
    '*.{js,ts,jsx,tsx}': ['eslint --max-warnings=0 --fix', 'prettier --cache --write'],
    '*.vue': ['eslint --max-warnings=0 --fix', 'stylelint --fix', 'prettier --cache --write'],
    '*.{css,scss,less}': ['stylelint --fix', 'prettier --cache --write'],
    '*.{json,md,yaml,yml}': ['prettier --cache --write'],
  };

  const configContent = JSON.stringify(lintstagedConfig, null, 2) + '\n';
  fs.writeFileSync(lintstagedrcPath, configContent, 'utf-8');
  console.log('✓ Installed .lintstagedrc');
  return true;
}

// 主函数
function main() {
  console.log('Setting up @crucialy/git-hooks...\n');

  const options = parseOptions();
  const { skipLint, skipCommitMsg } = options;

  const hooksChanged = installHuskyHooks(options);
  const configChanged = skipLint ? false : installConfigFiles();

  if (hooksChanged || configChanged) {
    console.log('\n✓ @crucialy/git-hooks setup complete!');
    if (skipLint) {
      console.log('  (lint-staged disabled)');
    }
    if (skipCommitMsg) {
      console.log('  (commit-msg verification disabled)');
    }
  } else {
    console.log('\n✓ All files are up to date.');
  }
}

try {
  main();
} catch (error) {
  const errorMessage = error instanceof Error ? error.message : String(error);
  console.error(`✗ ${errorMessage}`);
  process.exit(1);
}
