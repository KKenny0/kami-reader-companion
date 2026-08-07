# Kami Reader Companion

[English](./README.md) | 简体中文

一个桌面优先、面向 Obsidian 1.13+ 的插件。它让 New Tab、Reading、Editing、
Graph、Canvas 以及其他根视图共享同一套受 Kami 启发的连续 Folio Shell。
当前 Markdown 视图还会获得：

- 连贯一致的 Reading 与 Editing 呈现；
- 在 Obsidian 核心 Outline 中精确高亮当前标题；
- 自适应利用 pane 的剩余宽度，容纳宽图、表格、代码和嵌入内容；
- 显式的 **Toggle reading stage** 命令，用于进入深度 Reading View。

本插件仅支持桌面端，适用于 Obsidian 1.13+，并兼容 Obsidian Default Theme。
它不依赖 [Kami Reader](https://github.com/KKenny0/obsidian-kami)。Kami Reader
是可选搭配，可进一步统一 callout、表格、代码、编辑器语法、菜单、设置面板，
以及 Companion 文档处理范围之外的其他组件。无需主题检测或额外的集成设置。

Companion 不会写入笔记内容，也不会保存工作区状态；禁用后会恢复当前主题。

`0.1.0` release 已在 macOS、Obsidian 1.13.4 和 Default Theme 下完成验证，
覆盖 984x768 的深色与浅色模式。现有证据包含 Editing、Reading、New Tab、
较长的原生 breadcrumb，以及 Reading Stage。独立的 1440x900 release 矩阵
仍待补充。

## 效果展示

### Editing 与 Reading 共享同一种视觉语言

| Editing View · 深色 | Reading View · 深色 |
|---|---|
| ![深色 Editing View](./visual-evidence/01-default-dark-editing-984x768.jpg) | ![深色 Reading View](./visual-evidence/02-default-dark-reading-984x768.jpg) |

### 离开正文后，Workspace 外壳仍然连续

| New Tab | Reading Stage |
|---|---|
| ![深色 New Tab](./visual-evidence/04-default-dark-new-tab-984x768.jpg) | ![深色 Reading Stage](./visual-evidence/05-default-dark-reading-stage-984x768.jpg) |

### 浅色模式保留同样的层级

| Editing View · 浅色 | Reading View · 浅色 |
|---|---|
| ![浅色 Editing View](./visual-evidence/06-default-light-editing-984x768.jpg) | ![浅色 Reading View](./visual-evidence/07-default-light-reading-984x768.jpg) |

## 本地开发

```sh
npm ci
npm run check
npm run check:visual
npm run dev:injector
```

将 `.dev/inject-kami-reader-companion.js` 粘贴到 Obsidian DevTools，然后在
Settings → Community plugins 中启用 **Kami Reader Companion**。

注入脚本会有意拒绝更新已经存在的插件目录。注入新构建前，请先删除之前的
本地安装。
