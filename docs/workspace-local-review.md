# 01、02、04、06 本地实施复审

日期：2026-09-26。四项已实现，完成源码复审、自动检查及 macOS Obsidian 1.13.7 关键流程检查；没有提交、推送或发布。该记录不替代 07 的双平台正式验收。

执行使用 gpt-6-astra / low。环境限制只能建立三个子 agent，因此 01、02、04 先并行，01 完成后由同一 agent 接手 06；主 agent 负责复审、集成和真实应用验证。

## 改动与检查

| 执行项 | 实现 | 复审证据 |
| --- | --- | --- |
| 01 | 普通文档样式覆盖所有 Markdown pane；移除自动导语、READING NOTE、修改日期与标题身份装饰，保留模式标签 | 真实应用阅读／阅读、编辑／编辑、阅读／编辑三组切换前后，宽度、字号、标题位置及滚动位置一致；没有残留内容装饰 |
| 02 | Companion 继承原生字体及主题语义变量；正文宽度为用户上限；白纸预览局部重置并恢复。主题同步正文原生字体与 CTA 强调色，重新生成 snippet | Chrome 12 组计算样式检查通过；真实应用 Default/Kami Reader × 明暗 × 普通/Stage 的字体、配色、宽度和白纸恢复检查通过 |
| 04 | 按 Document 保存窗口临时 Focus 意图；非 Markdown 暂停、返回恢复；参考 pane 和周边文字保持完整透明度 | 真实窗口与弹出窗口独立开关；跨文件／模式／pane 延续；New Tab 暂停恢复；Escape 先 Stage 后 Focus；真实命令面板关闭不退出 Focus |
| 06 | 分离布局、Outline 与内容失效调度；媒体、内容变更及 preview/sizer resize 只触发相关 pane；取消卸载后的待处理回调 | 静止内容的 90 次滚动事件不再刷新宽内容；实际滚动中的虚拟化仍触发测量；生命周期回归测试通过 |

自动检查：Companion `npm run check` 通过，63 项测试、lint 和构建通过；主题 `npm run check` 通过，6 项测试及生成文件一致性通过。`node scripts/check-theme-settings.mjs` 通过 12 组浏览器计算样式检查，可传 Chrome 可执行文件作为首个参数。

主题 token 在 body 上解析后继承，避免与子元素原生变量回写形成循环；白纸预览明确重置链接色，退出恢复自定义强调色。窗口识别使用公共 View API，而不是已废弃的 activeLeaf 属性。

## 滚动对比的含义

隔离合成 Vault 中创建 120 节长文，每六节包含宽代码块，固定 1024×800 视口。主线程补测确认页面可见后重启隔离实例执行，剔除了隐藏页面导致动画帧暂停的无效样本。对未修改的基线和当前构建各执行同一段脚本：先派发 90 次不改变内容的 scroll 事件，再执行 90 步、每步 80px 的移动滚动。先测量 AdaptiveContent.refresh；补测通过 Chromium Performance 指标读取整个操作窗口的主线程任务时间。它不是帧率或长任务分析。

| 场景 | 修改前刷新次数 / 测量耗时 | 修改后刷新次数 / 测量耗时 |
| --- | --- | --- |
| 内容不变的滚动事件 | 90 / 16.5ms | 0 / 0ms |
| 移动滚动、可能触发虚拟化 | 2 / 0.6ms | 11 / 1.5ms |

这是单次本地样本，不是总体提速百分比。旧调度的回调取消会大量合并移动滚动请求；新调度在实际内容改变时执行必要测量。可确认无变化路径不再重复测量，不能据此声称所有滚动更快。页面可见的补测中，整个操作窗口的主线程 TaskDuration 为修改前 167.87ms、修改后 221.392ms；ScriptDuration 为 82.229ms / 88.447ms，LayoutDuration 为 5.237ms / 9.288ms。这一单次样本未显示总主线程耗时下降，符合新调度执行更多必要内容测量的现象，不作为性能加速承诺。静置一秒的重复刷新检查另行验证无自激测量循环。

## 证据与复跑

证据位于 [output/playwright](../output/playwright/review-assets.json)：资产清单记录插件与配套主题 SHA-256，已核对真实测试 Vault 中插件资产与当前构建逐字节一致。

- [双 pane 编辑截图](../output/playwright/review-editing-split.png)：已查看实际像素，仅包含合成内容。
- [行为检查结果](../output/playwright/live-behavior.txt)及[复跑表达式](../output/playwright/check-live.txt)。
- [设置检查结果](../output/playwright/live-settings.txt)及[复跑表达式](../output/playwright/check-settings-live.txt)：将 THEME_CSS 替换为配套主题文本的 JSON 字符串。
- [真实多窗口结果](../output/playwright/live-windows.txt)及[复跑表达式](../output/playwright/check-windows-live.txt)。
- [主线程基线](../output/playwright/baseline-main-thread.txt)、[主线程修改后](../output/playwright/current-main-thread.txt)及[CDP 测量表达式](../output/playwright/measure-main-thread.txt)：将 MEASUREMENT_EXPRESSION 替换为滚动测量表达式，通过 CLI run-code 执行。
- [中段阅读位置检查](../output/playwright/live-mid-scroll.txt)及[复跑表达式](../output/playwright/check-mid-scroll.txt)。
- [基线滚动](../output/playwright/baseline-scroll.txt)、[修改后滚动](../output/playwright/after-scroll.txt)及[测量表达式](../output/playwright/measure-scroll.txt)。

复跑使用隔离 Obsidian 1.13.7、仓库合成 visual-vault 和当前构建，启用插件后通过 Playwright CLI 的 CDP attach 连接；对表达式文件内容调用 eval。先执行行为检查建立双 pane，再运行设置与多窗口检查。滚动表达式要求当前活动 pane 为含宽代码块的长文阅读态，右侧打开 Outline；前后使用同一文档、视口和应用版本。不得对个人或生产 Vault 执行这些准备与检查操作。

## 尚未完成的验收

四项票据完成本地实施、回归与 macOS 关键流程复审，状态为 done；这不等于通过发布验收。本轮没有 Windows 实机证据或长任务／掉帧分析；跨平台候选验收属于 07，不能用这些本地结果替代。当时 03、05、07 尚未实施；03、05 的后续实施见 [第二轮复审](workspace-phase2-review.md)。

已确认的后续问题：1440px 窗口、双侧栏和双阅读 pane 下，正文宽度约 122px，虽已稳定但留白过大。该问题属于 03；本轮没有提前扩展其实施范围。模式菜单属于 05，现有命令仍可使用。

旧截图指纹与新代码不一致是预期状态，本轮没有改写旧证据或绕过发布门禁；07 必须重新绑定并人工审查两平台候选资产。
