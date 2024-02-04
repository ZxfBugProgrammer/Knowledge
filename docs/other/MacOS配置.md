# MacOS配置
<br>

# Homebrew

**macOS（或 Linux）缺失的软件包的管理器**

```Bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# ZSH M1芯片添加到PATH
# echo 'export PATH="/opt/homebrew/bin:$PATH"' >> ~/.zshenv

# (echo; echo 'eval "$(/opt/homebrew/bin/brew shellenv)"') >> /Users/bytedance/.profile
# eval "$(/opt/homebrew/bin/brew shellenv)"
```

# 配置 ZShell 及 插件

`ZShell(zsh)` 是什么本文不再介绍，请自行查询相关信息。

::: tip 什么是`Oh My Zsh`？为什么不使用`Oh My Zsh`？
- `Oh My Zsh` 是基于 `zsh` 命令行的一个扩展工具集，提供了丰富的扩展功能（包括库、主题、插件等）。
- 不使用`Oh My Zsh`是因为`Oh My Zsh`太过庞大，里面包含了很多我们不需要的内容，**加载插件的速度较慢**，且**无法根据配置文件自动配置**。

因此，本文使用 `zinit` 插件管理器进行 `zsh` 插件的安装和管理([项目链接](https://github.com/zdharma-continuum/zinit))。
:::

`.zshrc`文件如下：

使用方式：

- 安装`zsh`(`MacOS`自带，不需要安装)
- 在`~`下新建`.zshrc`，拷贝下列代码块中内容至新建的`.zshrc`中。
- 重启设备或执行`source ~/.zshrc`，即可开始插件的自动下载和安装。

```Bash
### Added by Zinit's installer
if [[ ! -f $HOME/.local/share/zinit/zinit.git/zinit.zsh ]]; then
    print -P "%F{33} %F{220}Installing %F{33}ZDHARMA-CONTINUUM%F{220} Initiative Plugin Manager (%F{33}zdharma-continuum/zinit%F{220})…%f"
    command mkdir -p "$HOME/.local/share/zinit" && command chmod g-rwX "$HOME/.local/share/zinit"
    command git clone https://github.com/zdharma-continuum/zinit "$HOME/.local/share/zinit/zinit.git" && \
        print -P "%F{33} %F{34}Installation successful.%f%b" || \
        print -P "%F{160} The clone has failed.%f%b"
fi

source "$HOME/.local/share/zinit/zinit.git/zinit.zsh"
autoload -Uz _zinit
(( ${+_comps} )) && _comps[zinit]=_zinit

# Load a few important annexes, without Turbo
# (this is currently required for annexes)
zinit light-mode for \
    zdharma-continuum/zinit-annex-as-monitor \
    zdharma-continuum/zinit-annex-bin-gem-node \
    zdharma-continuum/zinit-annex-patch-dl \
    zdharma-continuum/zinit-annex-rust

### End of Zinit's installer chunk

zinit light-mode for \
    OMZL::git.zsh \
    OMZL::clipboard.zsh \
    OMZL::completion.zsh \
    OMZL::history.zsh \
    OMZL::key-bindings.zsh \
    OMZL::theme-and-appearance.zsh \
    OMZP::z \
    OMZP::colored-man-pages \
    OMZP::sudo \
    OMZP::git \
    paulirish/git-open \
    zsh-users/zsh-completions \
    zsh-users/zsh-history-substring-search \
    zdharma-continuum/fast-syntax-highlighting \
    zdharma-continuum/history-search-multi-word

zinit light-mode for \
    OMZT::robbyrussell

zinit light-mode wait='0' lucid for \
    atload='_zsh_autosuggest_start' zsh-users/zsh-autosuggestions
```

包含插件能力：（核心能力，其他请自行阅读上述`.zshrc`文件）

1. 命令高亮，正确为绿色，错误为红色(`fast-syntax-highlighting`插件)
2. 命令历史。灰色展示命令历史，按`->`键使用(`zsh-autosuggestions`插件)
3. 搜索增强。Ctrl + R 搜索命令历史时列表展示。(`history-search-multi-word`、`zsh-history-substring-search`插件)
4. Git-open. 在git仓库中输入 git-open 打开git页面(`paulirish/git-open`插件)
5. 按 ESC 两次，在命令前面添加sudo(`OMZP::sudo`插件)
6. 使用`z 目录名`命令在不输入完整路径时根据历史`cd`记录进行跳转(`OMZP::z`插件)。
7. `robbyrussell`主题

# 更改 Gatekeeper 的检查级别

正常情况下 macOS 仅允许直接执行以下类型的应用

- 来自 AppStore 或的应用
- 已经过 Apple Developer Progam 的帐号签名的应用

在早期的 macOS 版本中, 你可以在 `系统偏好设置\安全性与隐私` 中直接将 Gatekeeper 设置为允许 `所有来源` 的应用安装

但在近期的版本中, 该选项是隐藏的, 你可以在终端中输入以下代码来设置 Gatekeeper

```Bash
sudo spctl --master-disable
```

这下好了, Gatekeeper 将不会阻止任何应用运行

如果有必要, 你也可以在终端中输入如下代码恢复 Gatekeeper 的设置

```Bash
sudo spctl --master-enable
```

> ## **手动覆盖安全性设置并放行应用**
>
> 请参照官方指引 https://support.apple.com/zh-cn/guide/mac-help/mh40616/mac
>
> ## **删除文件的扩展属性以绕过** **Gatekeeper** **的检查**
>
> 在 macOS 中, 任何通过网络下载的可执行文件都会被添加一段名为 `com.apple.quarantine` 的扩展属性, 其标识了文件下载的来源以及时间等信息, 如果该条目存在, Gatekeeper 将会检查其安全性, 并可能阻止其执行
>
> 在终端中, 进入 Mos.app 所在目录, 并输入以下代码
>
> ```Plaintext
> xattr -d com.apple.quarantine Mos.app
> ```
>
> 即可移除 `Mos.app` 文件的 `com.apple.quarantine` 扩展属性, 然后双击即可直接运行应用

# Mos

一个用于在MacOS上平滑你的鼠标滚动效果的小工具, 让你的滚轮爽如触控板。

官网：http://mos.caldis.me/

```Bash
brew install mos
# 应用将被安装至 /Applications/Mos.app

# 更新
# brew update
# brew reinstall mos
```

# iTerm2

iTerm2 is a replacement for Terminal and the successor to iTerm. It works on Macs with macOS 10.14 or newer. iTerm2 brings the terminal into the modern age with features you never knew you always wanted.

官网 https://iterm2.com/

使用 https://yuqiangcoder.com/2019/07/06/iTerm2.html

使用 [silenceallat.top](http://silenceallat.top/save_html/少数派/file/macOS 最佳命令行客户端：iTerm _ 使用详解 - 少数派.html)

```Bash
brew install --cask iterm2
```

# 调整LaunchPad图标行列数

```Bash
defaults write com.apple.dock springboard-columns -int 9
defaults write com.apple.dock springboard-rows -int 6
defaults write com.apple.dock ResetLaunchPad -bool TRUE
killall Dock

# 恢复默认
# defaults write com.apple.dock springboard-rows Default
# defaults write com.apple.dock springboard-columns Default
# defaults write com.apple.dock ResetLaunchPad -bool TRUE
# killall Dock
```

# 使用TouchID输入sudo密码

```Bash
sudo sed -i ".bak" '2s/^/auth       sufficient     pam_tid.so\'$'\n/g' /etc/pam.d/sudo
# 还原
# sudo mv /etc/pam.d/sudo.bak /etc/pam.d/sudo
```

# 访达显示隐藏文件

使用如下快捷键 `Command+Shift+.`

或使用如下命令

```Bash
defaults write com.apple.finder AppleShowAllFiles -boolean true ; killall Finder

# 还原
defaults write com.apple.finder AppleShowAllFiles -boolean false ; killall Finder
```

# Node版本管理 n

仓库地址 https://github.com/tj/n

```Bash
# 使用 n-install 脚本安装
curl -L https://bit.ly/n-install | bash
n lts

# 出错使用一下命令分析原因
# n doctor
```

# VS Code

```Bash
brew install visual-studio-code
```

# 关闭桌面顺序自动排列

参考 https://blog.csdn.net/guang_s/article/details/84333857

系统设置 -> 桌面与程序坞 -> 调度中心 -> 根据自动使用情况重新排列空间

# MarkText

官网： https://github.com/marktext/marktext

中英文对照 [Typora收费，为你提供开源免费的平替竞品MarkText的中文说明书，解释所有设置项中的英文表述](https://zhuanlan.zhihu.com/p/438852089)

# hiddenbar

```Shell
brew install --cask hiddenbar
```

# TODO

- Pyenv Poetry
- Meslo Nerd Font
- systemextensionsctl list
- https://he3.app/zh/
- https://www.raycast.com/
  - https://sspai.com/post/79769
- 磁盘清理 https://www.omnigroup.com/more