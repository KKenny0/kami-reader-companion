const { Notice, Plugin } = require("obsidian");

const sleep = (milliseconds) =>
  new Promise((resolve) => setTimeout(resolve, milliseconds));

module.exports = class KamiVisualController extends Plugin {
  async onload() {
    const configDir = this.app.vault.configDir;
    await this.app.vault.adapter.write(
      `${configDir}/kami-visual-controller-loaded.txt`,
      "loaded\n"
    );

    const states = [
      ["default-light-editing-split", "Default", "light", "source", "split", false],
      ["default-dark-reading-single", "Default", "dark", "preview", "single", false],
      ["kami-light-editing-split", "Kami Reader", "light", "source", "split", false],
      ["kami-dark-editing-split", "Kami Reader", "dark", "source", "split", false],
      ["kami-light-reading-single", "Kami Reader", "light", "preview", "single", false],
      ["kami-dark-reading-single", "Kami Reader", "dark", "preview", "single", false],
      ["kami-light-reading-stage-single", "Kami Reader", "light", "preview", "single", true]
    ];

    states.forEach(([id, theme, colorScheme, mode, layout, stage], index) => {
      this.addCommand({
        id: `capture-${id}`,
        name: `Capture state ${index + 1}: ${id}`,
        hotkeys: [{ modifiers: ["Ctrl", "Alt"], key: String(index + 1) }],
        callback: () => this.runSafely(
          () => this.applyState({ id, theme, colorScheme, mode, layout, stage })
        )
      });
    });

    this.addCommand({
      id: "capture-style-settings",
      name: "Capture state 8: Kami Reader Style Settings",
      hotkeys: [{ modifiers: ["Ctrl", "Alt"], key: "8" }],
      callback: () => this.runSafely(async () => {
        await this.applyTheme("Kami Reader", "light");
        await sleep(300);
        this.app.commands.executeCommandById(
          "obsidian-style-settings:show-style-settings-leaf"
        );
      })
    });

    this.app.workspace.onLayoutReady(() => {
      void this.runSafely(async () => {
        const statePath = `${configDir}/kami-visual-state.json`;
        if (!(await this.app.vault.adapter.exists(statePath))) return;

        const state = JSON.parse(await this.app.vault.adapter.read(statePath));
        if (state.id === "style-settings") {
          await this.applyTheme("Kami Reader", "light");
          await sleep(300);
          this.app.commands.executeCommandById(
            "obsidian-style-settings:show-style-settings-leaf"
          );
        } else {
          await this.applyState(state);
        }

        await this.app.vault.adapter.write(
          `${configDir}/kami-visual-ready.json`,
          `${JSON.stringify({ id: state.id, ready: true })}\n`
        );
      });
    });
  }

  async runSafely(callback) {
    try {
      await callback();
    } catch (error) {
      const message = error instanceof Error ? error.stack ?? error.message : String(error);
      await this.app.vault.adapter.write(
        `${this.app.vault.configDir}/kami-visual-controller.log`,
        message
      );
      new Notice(`Visual fixture failed: ${message.split("\n")[0]}`);
    }
  }

  async applyTheme(theme, colorScheme) {
    const isDark = colorScheme === "dark";
    document.body.classList.toggle("theme-dark", isDark);
    document.body.classList.toggle("theme-light", !isDark);
    this.themeStyle ??= document.head.createEl("style", {
      attr: { "data-kami-visual-theme": "fixture-controller" }
    });
    this.themeStyle.textContent = theme === "Kami Reader"
      ? await this.app.vault.adapter.read(
        `${this.app.vault.configDir}/themes/Kami Reader/theme.css`
      )
      : "";
    await sleep(250);
  }

  async applyState({ id, theme, colorScheme, mode, layout, stage }) {
    if (!this.app.plugins.enabledPlugins.has("kami-reader-companion")) {
      new Notice("Enable Kami Reader Companion before capturing evidence.");
      return;
    }

    if (document.body.classList.contains("kami-reading-stage")) {
      this.app.commands.executeCommandById(
        "kami-reader-companion:toggle-reading-stage"
      );
      await sleep(100);
    }

    await this.applyTheme(theme, colorScheme);

    const existing = this.app.workspace.getLeavesOfType("markdown");
    let primary = existing[0] ?? this.app.workspace.getLeaf("tab");
    existing.slice(1).forEach((leaf) => leaf.detach());
    await primary.setViewState({
      type: "markdown",
      active: true,
      state: { file: "Welcome.md", mode }
    });

    if (layout === "split") {
      const secondary = this.app.workspace.createLeafBySplit(primary, "vertical");
      await secondary.setViewState({
        type: "markdown",
        state: { file: "Reference/Layout Contract.md", mode }
      });
    }

    this.app.workspace.setActiveLeaf(primary, { focus: true });
    this.app.workspace.leftSplit.expand();
    this.app.workspace.rightSplit.expand();
    await sleep(250);

    if (stage) {
      this.app.commands.executeCommandById(
        "kami-reader-companion:toggle-reading-stage"
      );
      await sleep(250);
    }

    new Notice(`Visual fixture ready: ${id}`);
  }
};
