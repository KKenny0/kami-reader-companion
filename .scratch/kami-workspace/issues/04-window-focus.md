# 04: Focus 跟随窗口工作过程，参考文档保持可读

**What to build:** 用户开启一次 Focus 后可以连续读写、换文档与查资料；每个窗口独立保存临时专注意图，参考 pane 不被整体淡化。

**Blocked by:** None (can start immediately)

**Status:** done

**范围与工作量：** Companion，中等偏高；在现有生命周期内区分窗口意图与当前文档目标，相关局部整理随本项完成。

- [x] 同窗口切换文件、pane 或阅读／编辑模式，Focus 保持；进入 Graph、Canvas 或 New Tab 暂停文档强调，回到 Markdown 恢复。
- [x] 新窗口默认未开启 Focus；窗口间切换或移动文档不转移 Focus 意图，不保留旧目标强调。
- [x] 参考 pane 不整体降低透明度；当前文档的周边正文、代码、链接及交互内容保持可读。
- [x] 明确关闭、Escape、窗口关闭和插件卸载清理对应状态；重启不恢复，未开启 Focus 时不改变原生键盘行为。
- [x] Stage 与白纸预览继续绑定当前文档，保持既有目标变化清理行为；Escape 优先交给前景菜单／弹窗，再先退出 Stage、后退出 Focus。
- [x] 生命周期与键盘回归检查覆盖暂停恢复、多窗口、关闭和卸载，真实应用验证编辑行与阅读块强调。

## 验证记录

2026-09-26：完成实现与主 agent 复审。自动检查、macOS Obsidian 1.13.7 合成 Vault 实测及证据边界见 [本地复审报告](../../../docs/workspace-local-review.md)。Windows 和正式双平台发布验收仍由 07 承担；本票完成不授权提交或发布。
