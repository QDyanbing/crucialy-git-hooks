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
pnpm add -D @crucialy/git-hooks husky lint-staged eslint prettier stylelint
```

也可以使用其他包管理器：

```bash
npm install -D @crucialy/git-hooks husky lint-staged eslint prettier stylelint
yarn add -D @crucialy/git-hooks husky lint-staged eslint prettier stylelint
bun add -D @crucialy/git-hooks husky lint-staged eslint prettier stylelint
```

**注意**：本包需要使用 Node.js 20.18 或更高版本。使用上述命令安装当前最新工具版本时建议使用 Node.js 24；Node.js 20 项目需要选择符合各工具 `engines` 要求的兼容版本，其中 lint-staged 应使用 16。

本包负责安装 Git Hooks 和生成 lint-staged 配置，不提供 ESLint、Prettier、Stylelint 的规则配置。使用方需要根据项目技术栈维护对应配置。

### 2. 配置 `package.json`

在项目的 `package.json` 中添加以下脚本：

```json
{
  "scripts": {
    "hooks:setup": "crucialy setup",
    "prepare": "husky && crucialy setup"
  }
}
```

### 3. 自动安装

安装依赖时，`prepare` 会先初始化 Husky，再运行 `crucialy setup` 生成并更新项目的 Hook 文件。

如需手动运行，可以使用以下命令：

```bash
pnpm run prepare
```

### 4. 命令行使用示例

```bash
# 在当前项目根目录安装 hooks 和配置
pnpm run hooks:setup

# 仅安装提交信息验证（关闭代码检查）
pnpm run hooks:setup --skip-lint

# 仅安装代码检查（关闭提交信息验证）
pnpm run hooks:setup --skip-commit-msg
```

`--skip-lint` 和 `--skip-commit-msg` 会删除此前由本包生成的对应 Hook，不会删除自行维护的 Hook。

如果 `.husky` 中已经存在自行维护的同名 Hook，setup 会停止并保留原文件，避免静默覆盖已有逻辑。确认不再需要原 Hook 后，删除对应文件并重新执行 setup。

也可以通过环境变量配置：

```bash
SKIP_LINT=true pnpm run hooks:setup
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
<type>(<scope>)!: <subject>
```

`scope` 和 `!` 为可选内容，`type` 必须使用小写，`subject` 长度不能超过 50 个字符。

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

```bash
HUSKY=0 SKIP_LINT=true SKIP_COMMIT_MSG=true pnpm install
```

## License

MIT
