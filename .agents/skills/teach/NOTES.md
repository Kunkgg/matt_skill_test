# Teaching Notes — Yazi

## 用户偏好
- 追求"不复杂"的配置：先掌握核心与常用，再按需扩展。课程设计避免一上来堆插件/复杂 Lua。
- 跨平台一致性是硬需求：WSL / Windows / Mac / Linux 共用一套配置。涉及路径差异（`~/.config/yazi/` vs `%APPDATA%\yazi\config\`）时要点明。
- 交流用中文。
- 编辑器偏好 **vim**（明确拒绝过 nano 默认）——熟 vim 基本操作，涉及编辑器时默认 vim；`EDITOR/VISUAL=vim` 已写入 .zshrc。

## 环境备忘
- WSL: Ubuntu 22.04, GLIBC 2.35, zsh。
- **重要模式：这台机器 apt 源里的工具普遍严重过时，宁可下官方二进制也别用 apt。** 已踩坑：yazi（GLIBC 不够 → 用 musl）、fzf（apt 0.29，yazi 要 ≥0.53 → 升到 0.73.1）、zoxide（apt 0.4.3 → 升到 0.9.9）。统一做法：官方 release 二进制装到 `~/.local/bin`（`.zshrc` 已把它排 PATH 最前，自动盖住 `/usr/bin` 旧版）。
- 当前 `~/.local/bin` 里 yazi 工具链：yazi 26.5.6 (musl)、ya 26.5.6、fzf 0.73.1、zoxide 0.9.9。rg / fdfind 走系统，暂够用。
- **`s` 搜索在本机开箱可用（第 4 课已实测）**：PATH 上没有真正的 `fd` 二进制（只有 `fdfind` + zsh alias），但 yazi 二进制里含 `fd/fdfind` 回退逻辑 → 找不到 `fd` 时自动用 `fdfind`，所以 `s` 正常。**无需建软链**（推翻了我早先"很可能报错"的预测，见 [[0003-lesson4-s-search-fdfind-fallback]]）。`S`（ripgrep）用真二进制 `/usr/bin/rg`，也没问题。跨平台注意（第 6 课验证）：目标机器需装 `fd` 或 `fdfind` 之一，`s` 才能用。
- zoxide 已接进 shell（`.zshrc` 有 `zoxide init zsh`），db 在 `~/.local/share/zoxide/db.zo`，已积累若干历史目录。
- 剪贴板：`xsel` 经 WSLg **能同步到 Windows 剪贴板**（已实测 `c`⇒`c` 拷的路径可在 Windows 里 Ctrl+V），无需 wl-clipboard。
- **第 5 课配置事实（simple-tag 插件，待用户实测）**：
  - 安装：`ya pkg add boydaihungst/simple-tag`（v25+ 命令，本地 `ya pkg --help` 已核实有 `add` 子命令；旧的 `ya pack -a` 已废弃）。
  - `~/.config/yazi/` 此前**不存在**，第 5 课首次创建。需写 3 文件：`init.lua`（`require("simple-tag"):setup({})`，**必需**）、`yazi.toml`（`[plugin]` 下 `prepend_fetchers`，用 prepend 不覆盖自带 fetcher）、`keymap.toml`（`[mgr]` **不是** `[manager]`，新格式 `on=["x","y"]` 数组 + `prepend_keymap = [...]`）。
  - **按键冲突设计（关键决策）**：simple-tag README 把所有标签动作绑 `t` 前缀，但 `t t` 是建 tab（第 4 课已验证）→ README 的 `t t k`（切换标签）会与 `t t` **撞键**（yazi 等 timeout 才决断）。故课程把切换标签改绑 **`t g`**（避开 `t t`），筛选 `t f`、清除 `t c`、显示 `t u`，全 2 键、互不冲突。`toggle-ui` 也从 README 的 `t u s` 简化成 `t u`。课程里向用户说明了与 README 的偏差。
  - **跨平台**：simple-tag README 明确声明支持 Linux/Windows/macOS（不走 mactag）→ RESOURCES 里"标签跨平台可用性"的 gap **已消除**。标签**存储位置**未知（README 未述），留待第 6 课 dotfiles 同步时实测确认能否跨机器带走。
- Windows 侧与 Mac/Linux 侧的安装/配置尚未触碰，后续课程再覆盖。

## 当前进度（下次会话的 resume 点）
- **已交付并经用户验证**：第 0 课（安装 + `y` wrapper）、第 1 课（导航 `hjkl`/`gg`/`G`/`z`/`Z`）、第 2 课（选择与文件操作 `y`/`x`/`p`/`r`/`a`/`d`）、第 3 课（批量改名 + 拷路径；`c`⇒`c` 拷路径经 xsel/WSLg 成功同步 Windows 剪贴板）。
- **第 4 课（多 tab 与查找）已交付并经用户验证通过**：tab（`t`⇒`t` / `1`-`9` / `[` `]` / `{` `}` / `Ctrl+c`）+ 跨 tab `y`/`x`/`p` 正常；三种找文件 `f`(过滤) / `/` `?` `n` `N`(查找) / `s` `S`(搜索) 均可用。按键按官方 Quick Start v26.5.6 核对。`s` 在本机开箱可用（yazi 有 fdfind 回退，见环境备忘与 [[0003-lesson4-s-search-fdfind-fallback]]），无需软链。沙盒 `~/yazi-practice/sub/buried_report.md` 供 `s`/`S` 演示。
- **第 5 课（文件标签 · simple-tag 插件）已交付，待用户验证**：装插件 + 建 `~/.config/yazi/` 写 3 配置（`init.lua`/`yazi.toml`/`keymap.toml`）+ `t g` 打标 + `t f` 筛选。按键刻意避开 `t t`（建 tab），用 `t g`/`t f`/`t c`/`t u`。**用户确认徽章出现、筛选生效后**，下一会话写 learning record 并推进。
- **下一课**：第 6 课 · 配置与跨平台同步（把 `yazi.toml`/`keymap.toml`/`init.lua` 讲透 + git/symlink dotfiles 让四平台共用 + 实测标签存储位置）。
- **剩余路线**：第 7 课（自定义命令/快捷键）。
- **页脚计数**：共 8 节（第 0-7 课），现有 6 个课程的页脚已统一刷成「/ 8 课」。
- **建议**：每课开新会话（teach 的设计用法），从本文件 resume。
