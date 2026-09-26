# Kami 工作空间执行项

七项拆分与依赖已获用户确认，已发布为本地 tickets；01–06 已完成本地实施与复审；07 的行为项阻塞已解除，尚未开始。`ready-for-agent` 表示任务描述已准备好，只有阻塞票全部完成才可开始。

| 任务 | 阻塞 |
| --- | --- |
| [01：切换 pane 时保持文档排版与语义稳定](issues/01-stable-documents.md) | 无 |
| [02：主题设置在 Companion 与 Stage 中持续生效](issues/02-respect-theme-settings.md) | 无 |
| [03：窄 pane 保持读写密度，宽内容局部展开](issues/03-pane-responsive-content.md) | 01、02 |
| [04：Focus 跟随窗口工作过程，参考文档保持可读](issues/04-window-focus.md) | 无 |
| [05：在原生文档菜单发现、查看和退出模式](issues/05-mode-controls.md) | 04 |
| [06：滚动定位不重复测量未变化的宽内容](issues/06-scroll-measurement.md) | 无 |
| [07：完成双平台候选验收并落实发布门禁](issues/07-cross-platform-acceptance.md) | 01、02、03、04、05、06 |

当前可开始：07。03、05 的证据见 [第二轮复审报告](../../docs/workspace-phase2-review.md)。01、02、04、06 的证据见 [本地复审报告](../../docs/workspace-local-review.md)。文件重叠的任务须协调落地，逻辑上无阻塞不代表可以同时编辑同一文件。

设计依据：[设计收敛文档](../../docs/workspace-design-review.md)。检查命令、风险与回退：[执行说明](../../docs/workspace-execution-draft.md)。

这里只记录和跟踪工作；不授权自动提交、推送或发布。
