# D-Bus 调试工具小结
<br>

D-Bus 是 Linux 中非常常用的进程间通信机制，下面列举了几种常用的D-Bus调试工具。

附：D-Bus 类型表

![image-20240201175839482](assets/D-Bus%20%E8%B0%83%E8%AF%95%E5%B7%A5%E5%85%B7%E5%B0%8F%E7%BB%93/image-20240201175839482.png)

附：D-Bus基础概念详见：[DBus 学习](./DBus%20%E5%AD%A6%E4%B9%A0) 

# D-Feet

D-Bus GUI 调试工具，由`GNOME`开发维护。主要用来调试D-Bus方法调用。

## 安装

```Bash
sudo apt install d-feet
```

## 指定D-Bus ServiceName、ObjectPath、Interface、Method

通过**图形界面**，选择`session bus`、`system bus`及需要调试的服务。

## 数据类型

- 参数之间使用 `,` 分隔
- 基本类型采用`python`语法
  - `8`、`8.0`、`"String"`
- 数组、字典、结构采用`python`语法
  - `[8,8]`、`{"key":8}`、`(8,8.0,"string")`
- `Variant`
  - `GLib.Variant('t',25602751)`
  - 第一个参数填写D-Bus基本类型表的ASCII Code，第二个按照上述`python`类型填写

## 例

方法调用参数类型为：

```Plain
Arg1: Array of {Dict of {string, variant}}
Arg2: Struct of {int, variant}
Arg3: String
# Variant 中的内容根据需要填写
[{"key1":GLib.Variant('i',8),"key2":GLib.Variant('s',"value2")},{"key3":GLib.Variant('u',1)}],(8,GLib.Variant('i',8)),"string"
```

# gdbus/dbus-send

`gdbus/dbus-send`可以通过命令行发送D-Bus消息，包括方法调用、信号等。

`dbus-send`不支持`struct`类型，所以下面只介绍`gdbus`的使用方式。（`dbus-send`可查看man page，写的比较清楚）

`gdbus`基础使用方式见下图

![image-20240201175848517](assets/D-Bus%20%E8%B0%83%E8%AF%95%E5%B7%A5%E5%85%B7%E5%B0%8F%E7%BB%93/image-20240201175848517.png)

## 安装

```Plain
# 一般已经预装
sudo apt install libglib2.0-bin
```

## 指定D-Bus ServiceName、ObjectPath、Interface、Method

```Plain
--system/--session 指定 system bus 或 session bus
--dest 指定ServiceName
--object-path 指定ObjectPath
--method 指定Interface和Method
```

## 数据类型

- 参数之间使用空格分隔
- 基本类型、数组、字典、结构写法与D-Feet相同
  - `8`、`8.0`、`"String"`
  - `[8,8]`、`{"key":8}`、`(8,8.0,"string")`
- `Variant`
  - `<@i 888>`
  - 第一个参数填写D-Bus基本类型表的ASCII Code，第二个按照上述类型填写

## 例

方法调用参数类型为：

```Plain
Arg1: Array of {Dict of {string, variant}}
Arg2: Struct of {int, variant}
Arg3: String
# Variant 中的内容根据需要填写

gdbus call --system \
    --dest ServiceName \
    --object-path ObjectPath \
    --method Interface.Method \
    '[{"key1":<@i 8>,"key2":<@s "value2"},{"key3":<@u 1>}]' \
    '(8,<@i 8>)' \ 
    '"string"'
```

# dbus-monitor

详见：[dbus-monitor](https://dbus.freedesktop.org/doc/dbus-monitor.1.html)

使用方式：

```Bash
dbus-monitor [ --system | --session | --address ADDRESS ] [ --profile | --monitor | --pcap | --binary ] [ watch expressions ]
```

`watch expressions`可以指定：

- type
- sender
- interface
- member
- path
- destination

例：

```Bash
dbus-monitor --session "type='signal',sender='org.gnome.TypingMonitor',interface='org.gnome.TypingMonitor'"
```

注：system bus 返回信息monitor可参考：

https://wiki.ubuntu.com/DebuggingDBus

# 参考链接

- [gdbus: GIO Reference Manual](https://libsoup.org/gio/gdbus.html)
- [dbus-monitor](https://dbus.freedesktop.org/doc/dbus-monitor.1.html)
- https://wiki.ubuntu.com/DebuggingDBus
