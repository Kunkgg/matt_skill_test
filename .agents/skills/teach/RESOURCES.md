# Yazi Resources

> 知识来自下列高可信来源（已逐条核实 URL 与内容）。社区用于获取真实世界的使用 wisdom。
> 跨平台一致性是本 mission 的硬约束（WSL/Windows/Mac/Linux 同步配置），所有"安装/配置"类资源都按这个约束筛选。

## Knowledge

- [Official Docs — Installation](https://yazi-rs.github.io/docs/installation/)
  各平台官方安装方式总表。**已核实**：明确提供 GNU 与 **Musl** 两套 Linux 构建；列出全部可选依赖（ffmpeg/7zip/jq/poppler/fd/rg/fzf/zoxide/resvg/imagemagick/nerd-fonts/剪贴板工具）。用于：任何平台的首装、依赖排错。
- [Official Docs — Quick Start](https://yazi-rs.github.io/docs/quick-start/)
  官方按键速查 + `y` shell wrapper 源码。**已核实**：含导航/选择/文件操作/复制路径(`c`⇒`c`/`d`/`f`/`n`)/过滤/查找/搜索/排序/多 tab 的权威按键表。用于：所有"核心操作"课程的事实依据、`y` wrapper 的安装。
- [Official Docs — Configuration](https://yazi-rs.github.io/docs/configuration/)
  `yazi.toml` / `theme.toml` 全配置项权威说明。用于：跨平台同步、行为微调。（URL 为同站 sibling 页，待首次使用时复核。）
- [Official Docs — Keymap](https://yazi-rs.github.io/docs/configuration/keymap/)
  `keymap.toml` 权威结构与所有默认动作名。**第 5 课已部分核实**：v25+ 文件列表层改名 `[mgr]`（旧 `[manager]`），按键 `on=[...]` 为数组、`prepend_keymap=[...]` 为数组。用于：自定义快捷键、把 ranger/lf 肌肉记忆映射过来。（完整默认表待复核——第三方源对"建 tab 是 `t` 还是 `t t`"说法不一；本机第 4 课实测为 `t t`，以此为准。）
- [Official Docs — Plugins](https://yazi-rs.github.io/docs/plugins/)
  插件机制与包管理器。**已核实命令名**：v25+ 用 `ya pkg add <repo>`（旧的 `ya pack -a` 已废弃，本地 `ya pkg --help` 确认有 `add/delete/install/list/upgrade`）。用于：装 tags/预览等扩展、写自定义命令。
- [Official Docs — Resources](https://yazi-rs.github.io/docs/resources/)
  官方维护的插件/主题索引。**已核实**：tagging 能力靠插件实现。
- [Plugin: boydaihungst/simple-tag.yazi](https://github.com/boydaihungst/simple-tag.yazi)
  跨平台文件标签插件，第 5 课主源。**已核实 README**：① 一个标签 = 一个字符，可多标签；② **明确声明支持 Linux/Windows/macOS**（不走 mactag），消除跨平台顾虑；③ **无默认快捷键**——插件提供 add/remove/toggle/filter/clear/edit/toggle-ui/toggle-select 等动作，键位全靠用户在 `keymap.toml` 绑；④ 必需 `init.lua` 写 `require("simple-tag"):setup({})`；⑤ fetcher 配置（`yazi.toml` 的 `[plugin]`）控制徽章显示。用于：mission 中的"文件标签"需求。标签**存储位置 README 未述**，待第 6 课 dotfiles 同步时实测。
- [GitHub: sxyazi/yazi](https://github.com/sxyazi/yazi)
  上游仓库（36k+ stars）。Releases 提供 GNU/Musl/nightly 二进制；Discussions 是高频问答区。用于：版本/Glibc 问题排错、musl 下载链接。
- [GitHub: AnirudhG07/awesome-yazi](https://github.com/AnirudhG07/awesome-yazi)
  社区精选插件/主题/教程清单。用于：按需求挑插件（标签、模糊跳转、预览增强）。
- [Video: "How To Use Yazi" — Josean Martinez (YouTube)](https://www.youtube.com/watch?v=iKb3cHDD9hw)
  高质量引导视频，章节化（安装→wrapper→配置→预览→重命名→路径复制→搜索→排序）。用于：跟做式入门，补官方文档没有的"实战顺序"。
- [Guide: "How To Use The Amazing & Fast Yazi" — josean.com](https://www.josean.com/posts/how-to-use-yazi-file-manager)
  上述视频的图文版，含 `cd on quit` wrapper 配置截图。用于：不动手只看时的速读。

## Wisdom (Communities)

- [GitHub Discussions — sxyazi/yazi](https://github.com/sxyazi/yazi/discussions)
  官方问答区，维护者亲自回复。用于：配置疑难、跨平台差异、插件兼容性提问。
- [r/yazi (Reddit)](https://www.reddit.com/r/yazi/)
  用户社区。用于：工作流灵感、配置晒单、踩坑交流。（信号密度低于官方 Discussions，按需查阅。）

## Gaps

- **跨平台配置同步方案**：yazi 配置在 Unix 是 `~/.config/yazi/`、Windows 是 `%APPDATA%\yazi\config\`。如何用一套 dotfiles/symlink 在四类机器同步，官方无专门文档 —— 需结合用户实际（是否用 git 管 dotfiles）单独设计一节课（第 6 课）。
- **~~标签功能的跨平台可用性~~**（已解决）：`simple-tag.yazi` 的 README 明确声明支持 Linux/Windows/macOS（第 5 课核实）。**剩余未知**：标签数据存在哪个文件、能否随 dotfiles 跨机器带走 —— 第 6 课实测。
