# Qt D-Bus 学习笔记
<br>

# D-BUS 基础概念介绍

## 简介

D-Bus是Desktop Bus的缩写，是针对桌面环境优化的IPC(InterProcess Communication)机制，用于进程间的通信或进程与内核的通信。D-Bus使用一个快速的二进制消息传递协议，低延迟而且低开销，设计小巧且高效。D-Bus分为System Bus 和 Session Bus（系统总线在引导时就会启动，由操作系统和后台进程使用。会话总线当用户登录后启动，属于当前用户私有）。

## Messages（消息）

在 D-BUS 中有四种类型的消息：

- 方法调用（method calls）：触发对象的一个方法
- 方法返回（method returns）：返回触发后的结果
- 信号（signals）：通知，可以看作事件消息
- 错误（errors）：返回触发的错误信息

## Service Name（服务名称）

当通过总线进行通信时，应用程序会获得“服务名称”，由D-Bus的守护进程代理，作为与其他进程通信的标识。

## Object path（对象路径）

应用程序通过导出对象来向其他应用程序提供特定服务。可以简单理解为不同的模块。

![image-20240201174851176](assets/Qt%20D-Bus%20%E5%AD%A6%E4%B9%A0%E7%AC%94%E8%AE%B0/image-20240201174851176.png)

## Interface（接口）

接口概念类似于C++的抽象类，建立了方法、信号、属性的名字。

| D-Bus Concept | Analogy            | Name format                             |
| ------------- | ------------------ | --------------------------------------- |
| Service name  | Network hostnames  | Dot-separated ("looks like a hostname") |
| Object path   | URL path component | Slash-separated ("looks like a path")   |
| Interface     | Plugin identifier  | Dot-separated                           |

综上，我们可以通过Service Name、Object path、Interface确定通信的对象以及方法。

例：使用Qt D-BUS的同步方法调用

```C++
QDBusConnection bus = QDBusConnection::sessionBus();
QDBusInterface dbus_iface("org.freedesktop.FileManager1", "/MainApplication",
                          "org.freedesktop.DBus.Properties", bus);

QDBusMessage reply = dbus_iface.call("Get", "org.qtproject.Qt.QGuiApplication", "desktopFileName");
qDebug() << reply;
reply = dbus_iface.call("Get", "org.qtproject.Qt.QGuiApplication", "platformName");
qDebug() << reply;
```

## 使用d-feet工具查看和测试D-BUS

![image-20240201174858100](assets/Qt%20D-Bus%20%E5%AD%A6%E4%B9%A0%E7%AC%94%E8%AE%B0/image-20240201174858100.png)

# D-BUS类型

## 基本类型

| **D-BUS类型**                      | **类型码** |
| ---------------------------------- | ---------- |
| BYTE                               | y          |
| BOOLEAN                            | b          |
| INT16                              | n          |
| UINT16                             | q          |
| INT32                              | i          |
| UINT32                             | u          |
| INT64                              | x          |
| UINT64                             | t          |
| DOUBLE                             | d          |
| STRING                             | s          |
| VARIANT variant:\<type\>:\<value\> | v          |
| OBJECT_PATH                        | o          |
| SIGNATURE                          | SIGNATURE  |

## 复合类型

| **D-BUS类型** | **类型码** | **说明**                                                     |
| ------------- | ---------- | ------------------------------------------------------------ |
| ARRAY         | a          | 数组类型码必须跟随一个单个完整类型，如：ai、a(ii)、aai       |
| STRUCT        | ()         | ASCII字符‘(’和')' 用于标记STRUCT的开始和结束，STRUCT可以被嵌套，不允许为空。如：(i(ii)) |
| DICT_ENTRY    | {}         | DICT_ENTRY只能作为数组元素类型出现，不能单独的定义变量。字典的条目必须是2个(key、value)，key必须为基本类型。如：a{sv} |

# Qt D-Bus 类型系统

## 简介

D-Bus有一种基于几种原生与在数组和结构中的原生类型组成的复合类型的扩展类型系统。

Qt D-Bus 模块通过 QDBusArgument 类实现了类型系统，允许用户通过总线发送和接收每一种C++类型。

## 原生类型

Qt D-Bus 通过 QDBusArgument 支持原生类型，不需要特殊的定制。

| Qt type                                                      | D-Bus equivalent type |
| ------------------------------------------------------------ | --------------------- |
| uchar                                                        | BYTE                  |
| bool                                                         | BOOLEAN               |
| short                                                        | INT16                 |
| ushort                                                       | UINT16                |
| int                                                          | INT32                 |
| uint                                                         | UINT32                |
| qlonglong                                                    | INT64                 |
| qulonglong                                                   | UINT64                |
| double                                                       | DOUBLE                |
| [QString](https://doc.qt.io/qt-5/qstring.html)               | STRING                |
| [QDBusVariant](https://doc.qt.io/qt-5/qdbusvariant.html)     | VARIANT               |
| [QDBusObjectPath](https://doc.qt.io/qt-5/qdbusobjectpath.html) | OBJECT_PATH           |
| [QDBusSignature](https://doc.qt.io/qt-5/qdbussignature.html) | SIGNATURE             |

除了原生类型，QDBusArgument 也支持在 Qt 应用中广泛使用的两种非原生类型，QStringList 和 QByteArray。

## 复合类型

D-Bus 支持由原生类型聚合而成的三种复合类型：ARRAY、STRUCT 和 maps/dictionaries。ARRAY 是零个或多个相同元素的集合，STRUCT 是由不同类型的固定数量的元素组成的集合，maps/dictionaries 是元素对的**数组（如：a{sv}）**，一个 maps/dictionaries 中可以有零个或多个元素。

## 扩展类型系统

为了在 Qt D-Bus 模块使用自定义类型，自定义类型必须使用 Q_DECLARE_METATYPE() 声明为 Qt 元类型，并使用 qDBusRegisterMetaType() 函数进行注册（在这个过程中流操作符会被注册系统自动识别进行注册）。

Qt D-Bus 模块为 Qt 容器类使用数组和 map 提供了模板特化，例如 QMap 和 QList，不必实现流操作符函数。对于其它的类型，必须**显示实现流操作符（<< 操作符 和 >> 操作符）**。

具体使用见 DBUSTEST

## 类型系统使用

所有的 Qt D-Bus 类型（原生类型 和 用户扩展类型）都可以用来在总线上发送和接收所有类型的消息。

# 参考资料

- [The Qt D-Bus Type System | Qt D-Bus](https://doc.qt.io/qt-5/qdbustypesystem.html)
- [dbus](https://www.freedesktop.org/wiki/Software/dbus/)
- [Linux专属跨进程通信——D-Bus介绍](https://zhuanlan.zhihu.com/p/33391044)
- [一、从零认识D-Bus_老菜鸟的每一天的博客-CSDN博客_d-bus](https://blog.csdn.net/u011942101/article/details/123383195)
- [DBUS容器类型(译)_霍宏鹏的博客-CSDN博客_dbus variant](https://blog.csdn.net/huohongpeng/article/details/114968333)
- [Qt高级--QtDBus快速入门_生命不息，奋斗不止的技术博客_51CTO博客](https://blog.51cto.com/quantfabric/2118468)
- [D-Bus API Design Guidelines](https://dbus.freedesktop.org/doc/dbus-api-design.html#annotations)
- [使用qdbusxml2cpp工具简化你的QtDBus应用设计 - 酷享Qt](http://sites.cuteqt.com/cuteqt/Home/qtblog/shi-yongqdbusxml2cpp-gong-ju-jian-hua-ni-deqtdbus-ying-yong-she-ji)
- [How to generate synchronous interface class with qdbusxml2cpp?](https://stackoverflow.com/questions/39739945/how-to-generate-synchronous-interface-class-with-qdbusxml2cpp)
- [QT DBUS的各种数据类型的XML书写格式 - qushaohui - 博客园](https://www.cnblogs.com/xiao-huihui/articles/8793759.html)
- [Using Custom Types with D-Bus](https://develop.kde.org/docs/use/d-bus/using_custom_types_with_dbus/)
- [Development/Tutorials/D-Bus/Creating Interfaces - KDE TechBase](https://techbase.kde.org/Development/Tutorials/D-Bus/Creating_Interfaces)
- [Development/Tutorials/D-Bus - KDE TechBase](https://techbase.kde.org/Development/Tutorials/D-Bus)