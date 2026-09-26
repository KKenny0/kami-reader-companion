# 03、05 本地实施复审

2026-09-26。两个 gpt-6-astra / low 子 agent 并行实施，主 agent 复审与真实应用检查。未提交、推送或发布；本记录不替代 07 的 Windows/macOS 候选验收。

03 将重复扣减的正文宽度改为单一用户上限，留白随 pane 调整；标题使用容器查询并保留旧 Electron 回退，正文字号不缩小。顶层宽内容利用剩余宽度，列表和 callout 内的内容保持局部边界。主题最低版本没有改变。

05 将 Stage、Focus、白纸预览放入原生文档菜单，显示实际状态；保留命令，并提供独立退出按钮。实际菜单目标与活动 pane 分开校验，编辑态禁用 Stage。暂停 Focus 仍可直接退出。

复审发现并要求修正窄标题栏缺陷：221px pane 下按钮容器曾被挤成 0px，Tab 会将正文祖先横向滚动 29.5px。修复为标题栏显式分配空间、隐藏重复标题和模式标签；焦点仅滚动按钮容器以完整显示退出按钮。文件名仍在原生 tab 中。

Escape 改为注册 Obsidian 原生 App.scope，由前台菜单与弹窗先处理；实际退出模式才消费按键，并校验事件所属窗口，卸载时注销。源码复审没有遗留 DOM 捕获补丁。

## 验证与证据

隔离 macOS Obsidian 1.13.7，合成 Vault、双侧栏、双阅读 pane：1440px 窗口中 pane 391px，正文由修改前 122px 变为 359px；1100px 窗口中 pane 221px，正文 189px，字号仍为 16px，无 preview 横向溢出。已查看实际截图。

- [模式行为检查](../output/playwright/phase2-modes.txt)与[复跑表达式](../output/playwright/check-phase2.txt)：菜单三项、命令勾选同步、独立退出、实际目标 pane、编辑态禁用 Stage、Focus 暂停退出及 Stage 宽度恢复。
- [窄 pane 数据](../output/playwright/phase2-narrow-layout.txt)、[双阅读 pane](../output/playwright/phase2-reading.png)、[窄 pane 修复后](../output/playwright/phase2-narrow-fixed.png)。截图仅含合成数据。
- [键盘检查](../output/playwright/phase2-keyboard.txt)及[复跑表达式](../output/playwright/check-phase2-keyboard.txt)：Tab 完整露出按钮、Enter 独立退出、Escape 菜单优先；正文祖先 scrollLeft 保持 0。
- [真实弹出窗口与卸载](../output/playwright/phase2-windows.txt)及[复跑表达式](../output/playwright/check-phase2-windows.txt)：窗口 Focus 独立、退出提示同步、卸载后两窗提示清空。
- `node scripts/check-pane-layout.mjs`：24 组明暗、主题/插件组合与 240/360/720/1200px pane，运行实际 AdaptiveContent，检查嵌套溢出、延迟图片、Stage 恢复、编辑字号与清理。
- `node scripts/check-theme-settings.mjs`：12 组设置与模式回归。

真实应用菜单检查通过原生 file-menu 事件获取实际 Menu；为使 Playwright 检查可重现，测试中仅将菜单切换为 Obsidian 自带 DOM 呈现（setUseNativeMenu(false)），未修改产品设置或生产代码。该证据不声明 macOS 系统菜单像素验收。

复跑模式表达式前，在隔离合成 Vault 打开 Wide Content.md 与 Reference/Layout Contract.md 两个阅读 pane，将 leaves 保存为 window.phase2Leaves；通过 Playwright CDP eval 执行。不要对个人 Vault 执行测试准备。

最终 Companion `npm run check` 通过：66 项测试、lint、构建；主题 `npm run check` 通过：6 项测试、生成一致性。两仓库 `git diff --check` 通过。[资产 SHA-256](../output/playwright/phase2-assets.json) 已核对隔离 Vault 中实际插件资产与当前构建一致。最低支持应用版本未做实机复测，当前应用证据仅覆盖 1.13.7。

07 是唯一剩余执行项，仍需双平台真实候选证据与发布门禁。旧发布截图和指纹未被覆写。

## 维护者验收

2026-09-26，维护者在本会话明确确认“macos 验收通过”。这是维护者的真实使用验收结论；没有据此补造新截图、修改历史证据指纹或声称 Windows 通过。07 的 Windows 当前候选及正式证据门禁仍待完成。

## 0.4.0 发布例外

维护者随后明确授权“允许 macOS 验收例外，发布并明确 Windows 未验收”。本次通过 `visual-evidence/release-0.4.0.json` 记录，绑定原复审的 main.js、styles.css 和主题 SHA-256；manifest 仅提升发布版本。完整视觉矩阵检查保持独立，旧截图指纹未变，后续版本不继承此例外。

最终发布版本为 0.4.1：0.4.0 的 CI 在既有 JPEG 证据测试的 5 秒限时失败，保留失败标签、不创建该版本 Release。0.4.1 将该测试预算对齐其他完整图片检查的 30 秒；插件 main.js、styles.css 和配套主题与已验收实现完全一致，沿用同一次维护者授权，Windows 仍未验收。
