# @crucialy/git-hooks

开箱即用的 Git hooks 配置包，提供统一的代码质量检查和提交规范。

## 功能

- **Husky 9.x**: Git hooks 管理
- **lint-staged**: 提交前自动 lint 和格式化代码
- **提交信息验证**: 约定式提交格式验证（无需 commitlint）
- **支持 Vue 和 React**: 统一配置，自动处理 `.vue` 文件

## 安装

### 1. 安装包和依赖

```bash
pnpm add -D @crucialy/git-hooks husky lint-staged
```

**注意**：需要同时安装 `husky` 和 `lint-staged` 作为 peerDependencies。

### 2. 配置 package.json

在项目的 `package.json` 中添加以下脚本：

```json
{
  "scripts": {
    "postinstall": "crucialy setup",
    "prepare": "husky"
  }
}
```

**说明**：

- `postinstall`: 每次 `pnpm install` 后自动运行 setup，确保 git hooks 文件是最新的
- `prepare`: husky 初始化命令（Husky 9.x）

**注意**：本包仅支持 Husky 9.x，如果你使用的是 Husky 8.x，请升级到 9.x：

```bash
pnpm add -D husky@^9.0.0
```

### 3. 自动安装

`postinstall` 脚本会自动运行 `crucialy setup`，在项目根目录生成以下文件：

如需手动运行，可以使用以下命令：

```bash
# 使用 pnpm
pnpm exec crucialy setup

# 使用 npx
npx crucialy setup

# 如果已全局安装
crucialy setup
```

### 4. 命令行使用示例

```bash
# 在当前项目根目录安装 hooks 和配置
npx crucialy setup

# 仅安装提交信息验证（关闭代码检查）
npx crucialy setup --skip-lint

# 仅安装代码检查（关闭提交信息验证）
npx crucialy setup --skip-commit-msg
```

### 可用命令

```bash
# 安装 git hooks 和配置文件（默认：两个都启用）
pnpm exec crucialy setup

# 只启用提交信息验证，跳过代码检查
pnpm exec crucialy setup --skip-lint

# 只启用代码检查，跳过提交信息验证
pnpm exec crucialy setup --skip-commit-msg
```

也可以通过环境变量配置：

```json
{
  "scripts": {
    "postinstall": "SKIP_LINT=true crucialy setup"
  }
}
```

### 生成的文件

- `.husky/pre-commit` - 提交前运行 lint-staged
- `.husky/commit-msg` - 提交时验证提交信息格式
- `.lintstagedrc` - lint-staged 配置文件（支持 Vue 和 React）

**`.lintstagedrc` 默认配置**：

```json
{
  "*.{js,ts,jsx,tsx}": ["eslint --max-warnings=0 --fix", "prettier --cache --write"],
  "*.vue": ["eslint --max-warnings=0 --fix", "stylelint --fix", "prettier --cache --write"],
  "*.{css,scss,less}": ["stylelint --fix", "prettier --cache --write"],
  "*.{json,md,yaml,yml}": ["prettier --cache --write"]
}
```

## 使用

安装后，工具会自动工作：

- **提交前**: 自动运行 lint-staged，修复代码格式
- **提交时**: 检查提交信息格式，必须符合约定式提交规范

## 提交信息格式

提交信息必须符合以下格式：

```
<type>(<scope>): <subject>
```

**type 类型**：

- `feat`: 新功能
- `fix`: bug 修复
- `chore`: 构建/脚本/依赖
- `docs`: 文档或注释
- `style`: 代码格式、样式调整
- `refactor`: 代码重构
- `perf`: 性能优化
- `test`: 测试用例
- `build`: 构建系统或外部依赖
- `ci`: CI/CD 配置
- `revert`: 回滚提交

**示例**：

```
feat: 新增拖拽功能
fix(lint): 修复配置问题
chore: 更新依赖版本
```

## 自定义配置

### 修改 lint-staged 配置

直接编辑项目根目录下的 `.lintstagedrc` 文件：

```json
{
  "*.{js,ts}": ["eslint --fix", "prettier --write"],
  "*.css": ["stylelint --fix"]
}
```

### 自定义提交信息规则

如需自定义提交信息验证规则，可以：

1. 不使用本包的 commit-msg hook：`crucialy setup --skip-commit-msg`
2. 手动配置 commitlint 或其他工具

## 常见问题

### 如何跳过 hook？

```bash
# 跳过 pre-commit（不推荐）
git commit --no-verify

# 临时禁用某个 hook
rm .husky/pre-commit  # 删除后重新运行 crucialy setup 恢复
```

### 如何在 CI 中使用？

CI 环境通常不需要 git hooks，可以在 CI 配置中跳过：

```json
{
  "scripts": {
    "postinstall": "[ -n \"$CI\" ] || crucialy setup"
  }
}
```

## License

MIT
