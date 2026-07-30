#!/usr/bin/env node

const fs = require('fs');
const os = require('os');
const path = require('path');
const assert = require('assert');
const { spawnSync } = require('child_process');

console.log('Running tests for @crucialy/git-hooks...\n');

const projectRoot = path.join(__dirname, '..');
let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`✓ ${name}`);
    passed++;
  } catch (error) {
    console.error(`✗ ${name}`);
    console.error(`  ${error.message}`);
    failed++;
  }
}

function verifyCommit(message) {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'crucialy-commit-'));
  const msgFile = path.join(tempDir, 'COMMIT_EDITMSG');

  try {
    fs.writeFileSync(msgFile, `${message}\n`, 'utf-8');

    return spawnSync('node', [path.join(projectRoot, 'commands/verify-commit.js'), msgFile], {
      encoding: 'utf-8',
    });
  } finally {
    fs.rmSync(tempDir, { force: true, recursive: true });
  }
}

// Test 1: 检查必需文件存在
test('Required files exist', () => {
  const files = [
    'crucialy.js',
    'commands/setup.js',
    'commands/verify-commit.js',
    'README.md',
    'LICENSE',
  ];
  files.forEach(file => {
    assert(fs.existsSync(path.join(projectRoot, file)), `${file} should exist`);
  });
});

// Test 2: 检查可执行文件有 shebang
test('Executable files have shebang', () => {
  const files = ['crucialy.js', 'commands/setup.js', 'commands/verify-commit.js'];
  files.forEach(file => {
    const content = fs.readFileSync(path.join(projectRoot, file), 'utf-8');
    assert(content.startsWith('#!/usr/bin/env node'), `${file} should have shebang`);
  });
});

// Test 3: 检查 package.json 配置
test('Package.json is valid', () => {
  const pkg = require('../package.json');
  assert(pkg.name === '@crucialy/git-hooks', 'Package name should be @crucialy/git-hooks');
  assert(pkg.bin.crucialy === './crucialy.js', 'Bin should point to crucialy.js');
  assert(pkg.peerDependencies.eslint, 'Should have eslint as peer dependency');
  assert(pkg.peerDependencies.husky, 'Should have husky as peer dependency');
  assert(pkg.peerDependencies['lint-staged'], 'Should have lint-staged as peer dependency');
  assert(pkg.peerDependencies.prettier, 'Should have prettier as peer dependency');
  assert(pkg.peerDependencies.stylelint, 'Should have stylelint as peer dependency');
  assert(
    pkg.peerDependencies['lint-staged'].includes('^17.0.0'),
    'Should support lint-staged 17',
  );
  assert(
    pkg.repository.url.includes('QDyanbing/crucialy-git-hooks'),
    'Repository should point to the current GitHub project',
  );
});

// Test 4: 检查 verify-commit 的提交类型
test('Verify-commit has valid commit types', () => {
  const content = fs.readFileSync(path.join(projectRoot, 'commands/verify-commit.js'), 'utf-8');
  assert(content.includes('COMMIT_TYPES'), 'Should define COMMIT_TYPES');
  assert(content.includes('feat'), 'Should include feat type');
  assert(content.includes('fix'), 'Should include fix type');
});

// Test 5: 首次 setup 完整生成两个 Hook 和 lint-staged 配置
test('Setup generates all files on first run', () => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'crucialy-setup-'));

  try {
    const result = spawnSync('node', [path.join(projectRoot, 'crucialy.js'), 'setup'], {
      cwd: tempDir,
      encoding: 'utf-8',
    });

    assert.strictEqual(result.status, 0, result.stderr);
    assert(fs.existsSync(path.join(tempDir, '.husky/pre-commit')), 'Should create pre-commit');
    assert(fs.existsSync(path.join(tempDir, '.husky/commit-msg')), 'Should create commit-msg');
    assert(fs.existsSync(path.join(tempDir, '.lintstagedrc')), 'Should create .lintstagedrc');

    const preCommit = fs.readFileSync(path.join(tempDir, '.husky/pre-commit'), 'utf-8');
    const commitMsg = fs.readFileSync(path.join(tempDir, '.husky/commit-msg'), 'utf-8');

    assert.strictEqual(preCommit, 'lint-staged --quiet\n');
    assert.strictEqual(commitMsg, 'crucialy verify-commit "$1"\n');

    const skipResult = spawnSync(
      'node',
      [path.join(projectRoot, 'crucialy.js'), 'setup', '--skip-commit-msg'],
      {
        cwd: tempDir,
        encoding: 'utf-8',
      },
    );

    assert.strictEqual(skipResult.status, 0, skipResult.stderr);
    assert(fs.existsSync(path.join(tempDir, '.husky/pre-commit')), 'Should preserve pre-commit');
    assert(!fs.existsSync(path.join(tempDir, '.husky/commit-msg')), 'Should remove commit-msg');

    fs.writeFileSync(path.join(tempDir, '.husky/commit-msg'), 'custom-commit-check "$1"\n', 'utf-8');

    const customResult = spawnSync(
      'node',
      [path.join(projectRoot, 'crucialy.js'), 'setup', '--skip-commit-msg'],
      {
        cwd: tempDir,
        encoding: 'utf-8',
      },
    );

    assert.strictEqual(customResult.status, 0, customResult.stderr);
    assert.strictEqual(
      fs.readFileSync(path.join(tempDir, '.husky/commit-msg'), 'utf-8'),
      'custom-commit-check "$1"\n',
    );

    fs.unlinkSync(path.join(tempDir, '.husky/pre-commit'));

    const conflictResult = spawnSync(
      'node',
      [path.join(projectRoot, 'crucialy.js'), 'setup'],
      {
        cwd: tempDir,
        encoding: 'utf-8',
      },
    );

    assert.notStrictEqual(conflictResult.status, 0, 'Should reject an existing custom hook');
    assert(
      !fs.existsSync(path.join(tempDir, '.husky/pre-commit')),
      'Should not partially install hooks',
    );
    assert.strictEqual(
      fs.readFileSync(path.join(tempDir, '.husky/commit-msg'), 'utf-8'),
      'custom-commit-check "$1"\n',
    );
  } finally {
    fs.rmSync(tempDir, { force: true, recursive: true });
  }
});

// Test 6: 检查 crucialy.js 的命令路由
test('Crucialy.js routes commands', () => {
  const content = fs.readFileSync(path.join(projectRoot, 'crucialy.js'), 'utf-8');
  assert(content.includes('setup'), 'Should route setup command');
  assert(content.includes('verify-commit'), 'Should route verify-commit command');
});

// Test 7: verify-commit 接受合法的提交信息
test('verify-commit accepts valid commit message', () => {
  const result = verifyCommit('feat: valid commit message');
  assert.strictEqual(result.status, 0, 'Expected exit code 0 for valid commit message');
});

// Test 8: verify-commit 拒绝不合法的提交信息
test('verify-commit rejects invalid commit message', () => {
  const result = verifyCommit('invalid commit message without type');
  assert.notStrictEqual(result.status, 0, 'Expected non-zero exit code for invalid commit message');
});

// Test 9: verify-commit 支持 Scope、Breaking Change 和正文
test('verify-commit accepts scope, breaking change and body', () => {
  const result = verifyCommit('feat(router)!: change route config\n\nBREAKING CHANGE: update routes');
  assert.strictEqual(result.status, 0, 'Expected complex conventional commit to pass');
});

// Test 10: verify-commit 拒绝大写 Type
test('verify-commit rejects uppercase type', () => {
  const result = verifyCommit('FEAT: invalid uppercase type');
  assert.notStrictEqual(result.status, 0, 'Expected uppercase type to fail');
});

// Test 11: verify-commit 拒绝超过 50 个字符的 Subject
test('verify-commit rejects long subject', () => {
  const result = verifyCommit(`feat: ${'a'.repeat(51)}`);
  assert.notStrictEqual(result.status, 0, 'Expected long subject to fail');
});

// Test 12: verify-commit 支持包含前置注释的 Commit Template
test('verify-commit accepts a message after template comments', () => {
  const result = verifyCommit('# Commit template\n\nfeat: valid commit message');
  assert.strictEqual(result.status, 0, 'Expected template comments to be ignored');
});

// Test 13: verify-commit 不限制 Git 自动生成的特殊提交信息长度
test('verify-commit accepts long special commit message', () => {
  const result = verifyCommit(`Merge ${'a'.repeat(80)}`);
  assert.strictEqual(result.status, 0, 'Expected long merge message to pass');
});

// Test 14: verify-commit 缺少 Commit 信息文件时返回失败
test('verify-commit requires a commit message file', () => {
  const result = spawnSync('node', [path.join(projectRoot, 'commands/verify-commit.js')], {
    encoding: 'utf-8',
  });
  assert.notStrictEqual(result.status, 0, 'Expected missing message file to fail');
});

// 输出结果
console.log(`\n${passed} passed, ${failed} failed`);

if (failed > 0) {
  process.exit(1);
}

console.log('\n✓ All tests passed!');
