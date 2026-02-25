# 参与贡献

感谢你对 `@crucialy/git-hooks` 的关注。以下约定有助于保持分支清晰、版本可追溯。

## 1. 分支与提交

- 默认分支为 `master`，请勿直接在该分支上提交或 force-push。
- 基于最新 `master` 新建分支，命名建议：`feature/<topic>`、`fix/<issue>`、`docs/<scope>`。
- 提交信息请遵循约定式提交（见 README），如：`feat: 支持 xxx`、`fix: 修复 xxx`。
- 提交前在仓库根目录执行 `node test/test.js`，确保测试通过。

## 2. Changesets 与版本

- 所有会影响发布内容的改动都需要运行 `pnpm changeset`：
  1. 选择版本类型（patch/minor/major）；
  2. 写一句简短描述；
  3. 将生成的 `.changeset/*.md` 与代码一并提交。
- 仅文档或注释类改动可选用 patch 并注明「docs only」。纯 CI/配置类修改在维护者确认后可省略 changeset。

## 3. Pull Request

- 一个 PR 尽量只做一件事，避免混入无关修改。
- 在描述中写清：背景与动机、主要改动、如何验证。
- 修 bug 时请尽量提供复现步骤或环境说明。
- CI 通过后再申请 Review；合并与发布由维护者在合入后统一处理。

## 4. Issue

- 报 bug 或提需求请使用 [Issue 模板](.github/ISSUE_TEMPLATE/)（Bug 报告 / 功能建议），便于快速定位与跟进。
- 有疑问可在对应 Issue 或 PR 下讨论，或通过 README 中的联系方式联系维护者。

遵循以上约定可以让我们更高效地协作，感谢你的贡献。
