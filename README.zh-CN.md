# Kami Reader Companion

[English](./README.md) | 简体中文

一个桌面优先、面向 Obsidian 1.13+ 的插件。它让 New Tab、Reading、Editing、
Graph、Canvas 以及其他根视图共享同一套受 Kami 启发的连续 Folio Shell。
当前 Markdown 视图还会获得：

- 连贯一致的 Reading 与 Editing 呈现；
- 当 Outline 可唯一映射到笔记标题时精确高亮当前标题；无法可靠映射时安全退回
  原生高亮；
- 自适应利用 pane 的剩余宽度，容纳宽图、表格、代码和嵌入内容；
- 显式的 **Toggle reading stage** 命令，用于进入深度 Reading View；
- 可选的 **Toggle focus mode** 命令，在 Editing View 跟随当前编辑行，
  在 Reading View 通过指针或键盘焦点突出当前内容块。

本插件仅支持桌面端，适用于 Obsidian 1.13+，并兼容 Obsidian Default Theme。
它不依赖 [Kami Reader](https://github.com/KKenny0/obsidian-kami)。Kami Reader
是可选搭配，可进一步统一 callout、表格、代码、编辑器语法、菜单、设置面板，
以及 Companion 文档处理范围之外的其他组件。无需主题检测或额外的集成设置。

Companion 不会写入笔记内容，也不会保存工作区状态；禁用后会恢复当前主题。

## Reading Stage 与 Focus Mode

打开 Command Palette，执行 **Kami Reader Companion: Toggle focus mode**，
即可在 Editing 或 Reading View 进入可选的专注模式。Editing View 会跟随
CodeMirror 当前编辑行；Reading View 会突出指针或键盘焦点所在的内容块及其
相邻内容，并可通过 `Arrow Up`、`Arrow Down` 在内容块之间移动。侧栏、Ribbon、
标签栏和状态栏始终保持安全对比度；hover、激活或键盘聚焦的控件会成为组内最强层级。

**Toggle reading stage** 仍然只作用于 Reading View，负责改变工作区的空间呈现。
两种模式可以组合：Reading Stage 管理空间，Focus Mode 管理注意力。按下
`Escape` 会先退出 Reading Stage，再退出 Focus Mode。两种模式均不会持久化。

视觉基线是在 macOS 的 Obsidian 1.13.4 中，以 1440x900 逻辑视口
（Retina 2x）真实捕获并逐张审查的矩阵。22 个独立状态覆盖 Default 与
Kami Reader 主题、明暗配色、Reading 与 Editing、单双 pane、Focus Mode、
Reading Stage、New Tab、Settings、Command Palette、Quick Switcher、
右键菜单、Notice、Search 和其他代表性侧栏。`npm run check:visual`
只负责确保已审截图与本次发布资产精确绑定，不能代替人工位图验收。

## 效果展示

### Reading 与 Editing 共享同一种视觉语言

| Reading View · 深色 | Editing View · 深色 · 双 pane |
|---|---|
| ![深色 Reading View](./visual-evidence/kami-dark-reading-single.jpg) | ![深色双 pane Editing View](./visual-evidence/kami-dark-editing-split.jpg) |

### 离开正文后，Workspace 外壳仍然连续

| New Tab · 浅色 | Reading Stage · 浅色 |
|---|---|
| ![浅色 New Tab](./visual-evidence/kami-light-new-tab.jpg) | ![浅色 Reading Stage](./visual-evidence/kami-light-reading-stage.jpg) |

### 前景浮层与设置界面仍属于同一个 Workspace

| Command Palette · 浅色 | Settings · 深色 |
|---|---|
| ![浅色 Command Palette](./visual-evidence/kami-light-command-palette.jpg) | ![深色 Settings](./visual-evidence/kami-dark-settings.jpg) |

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
