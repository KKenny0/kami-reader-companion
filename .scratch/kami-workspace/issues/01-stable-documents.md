# 01: 切换 pane 时保持文档排版与语义稳定

**What to build:** 所有 Markdown pane 保持稳定的文档排版，活动焦点只改变当前文档标识与定位；普通模式和 Reading Stage 均不自动生成文章导语或日期标签。

**Blocked by:** None (can start immediately)

**Status:** done

**范围与工作量：** Companion 为主，中等；保留 One Field、原生文件名与 H1 关系及阅读／编辑必要差异。

- [x] 双 pane 在阅读／阅读、编辑／编辑、阅读／编辑组合下交替激活，原 pane 不因焦点转移改变字号、宽度、间距、换行或阅读位置。
- [x] 初次打开、文件切换、虚拟化滚动和重新渲染均不插入自动导语、READING NOTE 或修改日期装饰。
- [x] 有无 H1、隐藏原生 inline title、属性密集笔记均保留原生内容关系。
- [x] Outline 仍跟随当前阅读文档，映射不可靠时退回原生行为；Stage 进入和退出仍有效。
- [x] 增加能捕获焦点切换重排与装饰回归的最小检查，并提供合成笔记的双 pane 操作证据。

## 验证记录

2026-09-26：完成实现与主 agent 复审。自动检查、macOS Obsidian 1.13.7 合成 Vault 实测及证据边界见 [本地复审报告](../../../docs/workspace-local-review.md)。Windows 和正式双平台发布验收仍由 07 承担；本票完成不授权提交或发布。
