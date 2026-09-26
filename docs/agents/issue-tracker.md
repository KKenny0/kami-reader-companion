# 任务跟踪约定

本轮用户已接受本地 Markdown 方案。Kami Reader Companion 作为 Kami 工作空间改进的跨仓库任务入口；涉及 Kami Reader 的工作在同一票中说明，不重复建票。

每项任务保存在 `.scratch/<feature-slug>/issues/<NN>-<slug>.md`，编号按依赖顺序排列。当前工作索引为 [Kami 工作空间执行项](../../.scratch/kami-workspace/README.md)。每票包含 What to build、Blocked by、Status 和可勾选验收条件；Blocked by 使用票号与标题。

当前使用的 triage 标识为 `ready-for-agent`，表示描述可供执行，不表示阻塞已解除或任务已完成。执行者只领取所有阻塞票均已完成的任务；完成时须记录验证证据再更新状态。其他 triage 标签尚未配置，本轮无需添加。

执行前阅读项目根目录 CONTEXT.md、docs/adr 中相关决策和已确认的设计收敛文档。票据正文描述用户行为和验收，避免冻结易失效的代码路径。需要命令与技术背景时参考执行说明。

不创建远程 Issues，不因票据已准备好而自动实施、提交、推送或发布。
