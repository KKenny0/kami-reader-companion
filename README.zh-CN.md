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

下方 Showcase 仍是 `0.1.0` 在 macOS、Obsidian 1.13.4 和 Default Theme
下通过验收的 984x768 基线，包含 Editing、Reading、New Tab、较长的原生
breadcrumb 和 Reading Stage。新的表面层级与 Focus Mode 在完成并审查新的
1440x900 Default/Kami Reader 截图矩阵前，会有意让独立验收命令
`npm run check:visual` 失败。明确记录视觉限制的补丁版本不宣称已通过最终视觉验收。
该矩阵还必须覆盖双主题 Settings、Command Palette、Quick Switcher、右键菜单、
Notice、Search 和具有代表性的其他侧栏。

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
