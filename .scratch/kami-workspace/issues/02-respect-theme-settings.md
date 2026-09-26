# 02: 主题设置在 Companion 与 Stage 中持续生效

**What to build:** 用户主动调整的字体、正文宽度上限、背景和强调色，在主题独立使用、Companion 搭配主题及 Stage 中均有效；无自定义设置时仍有完整默认体验。

**Blocked by:** None (can start immediately)

**Status:** done

**范围与工作量：** 两个仓库，中等；复用现有设置和语义变量，不增加主题检测、共享包或新设置项。

- [x] Kami Reader 独立、Default + Companion、Kami Reader + Companion 三种安装组合均可用，覆盖明暗模式。
- [x] 分别改变字体、宽度、背景和强调色后，阅读与编辑、活动与非活动 pane、Stage 都遵守可用的显式设置。
- [x] 900px 等宽度值表示上限，不强行撑开窄 pane。
- [x] 白纸预览只临时覆盖当前文档配色，退出后恢复原设置，外壳保持原配色。
- [x] 无标题字体 token 时安全继承正文回退；禁用 Companion 后恢复当前主题。
- [x] 主题生成产物与设置声明同步，测试验证最终呈现而非只检查变量字符串存在。

## 验证记录

2026-09-26：完成实现与主 agent 复审。自动检查、macOS Obsidian 1.13.7 合成 Vault 实测及证据边界见 [本地复审报告](../../../docs/workspace-local-review.md)。Windows 和正式双平台发布验收仍由 07 承担；本票完成不授权提交或发布。
