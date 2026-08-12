---
tags:
  - fixture
  - visual-review
status: synthetic
---

# A Quiet Reading Workspace

This vault contains synthetic text created only for public visual acceptance.
No personal notes, customer data, credentials, or production paths belong here.

## Reading rhythm

Good reading software lets the document lead. The shell should remain calm,
caption controls must stay clear on Windows, and the status bar should keep its
native place unless Reading Stage deliberately turns it into an overlay.

中文段落用于确认主题字体能够穿过 Companion 正常继承。启用 Kami Reader 时，
正文应保持主题定义的中英文正文栈，标题保留独立的书卷气；切换回 Default Theme 后，Companion
不应继续施加 Kami Reader 的字体方案。

> [!note] Public fixture
> Every visible title and sentence in release screenshots must come from this
> tracked fixture vault.

> [!tip] White paper boundary
> White Page Preview changes only this active document. The dark shell remains
> dark, while this callout retains a warm parchment surface.

## Review checklist

- [x] Synthetic fixture content only
- [x] Left and right sidebars expanded
- [x] Window caption controls remain unobstructed
- [x] Reading and editing modes use the requested layout
- [x] Status bar placement matches normal or Reading Stage mode

| State         | Expected shell                            | Typography owner  |
| ------------- | ----------------------------------------- | ----------------- |
| Default Theme | Native reading/editing surface            | Obsidian          |
| Kami Reader   | Warm paper and ink-blue accents           | Kami Reader theme |
| Reading Stage | Focused document with intentional overlay | Theme + Companion |
| White Preview | White active document, unchanged dark shell | Companion command |

```css
body {
  font-family: var(--font-text-theme);
}
```

## Closing note

The visual gate binds these reviewed pixels to exact release assets. Automated
checks preserve provenance and structure; a human reviewer still verifies what
the screenshots actually show.
