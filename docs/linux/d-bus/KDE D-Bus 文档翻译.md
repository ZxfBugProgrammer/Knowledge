# KDE D-Bus文档翻译
<br>

::: tip
原文链接：[Introduction to D-Bus](https://develop.kde.org/docs/use/d-bus/introduction_to_dbus/)

部分翻译可能与原文有出入
:::

# D-Bus简介

从应用开发者的角度出发介绍了D-Bus的核心概念。

## 摘要

D-Bus是一个免费/开源的进程间通信（IPC）机制，是freedesktop.org项目的一部分。它被广泛用于各种应用程序和其他freedesktop.org标准之上，如桌面通知、媒体播放器控制和XDG portals。

"IPC"表示进程间的通信，包括数据交换、方法调用和事件监听。

在Desktop的范畴上，IPC的使用相当广泛，包括脚本（执行脚本与各种正在运行的应用程序进行交互、控制）、集中式服务以及应用程序的多个实例之间的协调等。

freedesktop.org的通知规范是使用D-Bus的一个好例子。应用程序将通知发送到一个中央服务器（例如Plasma），然后中央服务器显示通知并通过D-Bus发回事件（如通知被关闭或通知中的一个Action被调用）。

IPC使用的另一个例子是应用的进程单例。当应用程序启动时，它首先检查同一应用程序的其他实例是是否存在，如果存在，则通过IPC向运行的实例发送消息，并终止运行。

D-Bus与语言和工具包无关，因此允许所有的应用程序以及服务之间进行交互。Qt提供了一套与D-Bus交互的类和工具。本文档介绍了D-Bus的高级概念以及它们在Qt和KDE软件中的实现。

## 总线

D-Bus提供了多个消息总线，供应用程序在相互通信时使用。每条总线都提供自己的连接设施，相互隔离：在一条总线上发送的消息不能从另一条总线上访问，但连接到同一条总线的应用程序之间都可以相互通信。多个应用程序可以在任何时候连接到任何给定的总线，一个应用程序也可以同时连接到多个总线上。这允许将不同的安全策略应用于不同的总线，同时也允许全局和局部消息的有效共享。

D-Bus提供了两个预定义的总线，涵盖了大多数的D-Bus应用场景。

系统总线（System Bus）用于系统的全局服务，如硬件管理等。它在用户之间共享，通常带有严格的安全策略。

每个桌面会话（例如，每个登录的用户）都有一个额外的会话总线，这是桌面应用程序最常使用的总线。

此外，如果有必要，一个应用程序也可以创建任何数量的自己的总线。

## 消息

消息是总线上通信的基本单位。在总线上传递的所有信息都是以消息的形式进行，就像通过TCP/IP传输的所有信息都是通过数据包进行的一样。然而，与网络数据包不同的是，每个D-Bus消息都保证包含正在发送或接收的整个数据集。除了正在发送的数据外，消息还记录了发送者和接收者的身份，以便进行适当的路由。

消息可以是方法调用、信号发射或方法返回值，并可能包含错误信息。

## 命名空间和地址 

由于同一总线上可能会有多个应用程序，同时一个应用程序也可以提供多个对象。而D-Bus消息可以被发送任何一个对象上，因此需要一种方式来唯一标识给定总线上的给定对象（类似于使用街道地址可以唯一标识任何一座给定的住宅或办公室）。在D-Bus的体系中，使用接口、服务以及对象名称的组合作为上述对象的唯一标识。

### 接口（Interfaces）

接口是一组在总线上公布的可调用的方法和信号。接口在传递信息的应用程序之间提供了一个 "契约"，定义了方法的名称、参数（如果有）和返回值（如果有）。这些方法不一定会以一对一的方式直接映射到实现该接口的应用程序中的方法或API，尽管通常如此。这允许多个应用程序提供类似或相同的接口，而不考虑内部实现，同时允许应用程序使用这些接口而不担心其内部设计。

出于对文档编写和代码重用的考虑，可以用XML来描述接口。用户和程序员不仅可以直接阅读并参考接口的XML描述，还可以借助工具从XML中自动生成的对应的类，这使得使用D-Bus变得更容易，且更少出错（例如，编译器可以在编译时检查消息的语法）。

### 服务（Services）

服务代表应用程序与总线的连接。这里的服务对应于D-Bus规范术语中的“总线名称"。术语 "总线名称 "容易让人产生混淆。不管它听起来如何，总线名称是总线上的**连接**的名称，而不是**总线**的名称。所以这里将使用术语服务（Service）（正如Qt文档所称）。

就像其他许多需要为多个组件提供命名空间的系统一样，D-Bus服务通过使用"反向域名"的命名方式来确保唯一性。大多数KDE的应用程序提供的服务使用`org.kde`作为服务名称的前缀。所以你可能会在会话总线上发现`org.kde.screensaver`。

在注册D-Bus服务时，应该使用组织域名加应用程序名作为服务名称。例如，如果你的组织域名是`awesomeapps.org`，应用程序名是`wickedwidget`，则应该使用`org.awesomeapps.wickedwidget`作为总线上的服务名称。

如果一个应用程序在总线上有多个链接，或者应用程序可能会运行多个实例，那么需要为每个连接使用不同的唯一的服务名称。通常可以通过将进程ID附加到服务名称中来实现。

### 对象（Objects）

当然，一个应用程序有可能会在总线上注册一个以上的对象。对象和服务之间的这种多对一关系是通过为地址提供一个路径组件来实现的。每个与服务相关的路径代表一个不同的、唯一的对象。例如: `/MainInterface或/Documents/Doc1`。实际上，路径结构可以是完全任意的，这将由提供服务的应用程序来决定路径到底应该是什么。这些路径只是为了给发送消息的应用程序提供一种识别和分组对象的方法。

一些库在确定对象路径时，会将其 "反向域 "前置，以便对其对象进行适当的命名。这对于可能加入任意服务的库和插件来说很常见，因为必须要避免与其他应用程序或组件所导出的对象发生冲突。然而，这种做法在KDE的应用程序和库中是不使用的。

对象提供对接口的访问。事实上，一个特定的对象可以同时提供对多个接口的访问。

### Putting it all together

一个D-Bus消息包含一个由上述所有组件组成的地址，这样它就可以被路由到正确的应用程序、对象和方法调用。这样一个地址可能看起来像：

```undefined
org.kde.krunner /App org.kde.krunner.App.display
```

在这种情况下，`org.kde.krunner`是服务，`/App`是对象的路径，`org.kde.krunner.App`是对象输出的接口，`display`是接口中的一个方法。如果`/App`对象只提供`org.kde.krunner.App`接口（或者`display`方法在该服务中是唯一的），那么如下写法也可以作为地址：

```undefined
org.kde.krunner /App display
```

这样一来，所有可能的目的地址都是唯一的、可靠的地址。

## 调用与被调用

现在我们已经有了一种方法来确定总线上的任何给定的端点，那么接下来我们将研究如何发送或接收消息。

### 方法

方法是被发送的消息，最终使得代码在接收消息的应用程序中被执行。如果该方法不可用，例如，地址不对或者所请求的应用程序没有运行，那么将向调用方法的应用程序返回一个错误。如果该方法被成功调用，一个可选的返回值将被返回给调用的应用程序。即使方法没有提供返回值，也将返回一个成功信息。这个往返过程确实有开销，对于需要关注性能的代码来说，必须要牢记这一点。

方法调用是由调用方法的应用程序发起并会产生一个包含了源地址和目标地址信息的消息。

### 信号

信号就像方法调用类似，除了它们发生的方向不同，并且不与单一的目的地址相联系。信号是由注册接口的应用程序发出的，并且对同一总线上的任何应用程序来说均是可见的。这将允许一个应用程序自发地将状态的变化或其他事件公布给任何可能对跟踪这些变化感兴趣的应用程序。

这听起来很像Qt中的信号和槽的机制。就所有的意图和目的而言，它确实是具有相同的功能。

## 有用的工具

在学习D-Bus总线以及开发使用D-Bus的应用程序时，有几个的工具对我们很有帮助。现在我们先简要的介绍一下这些工具，在后面的文章中会更详细地介绍这些工具。

### qdbus

`qdbus`是一个命令行工具，可以用来列出特定总线上的服务、对象和接口，以及向总线上的特定地址发送消息。它可以用来研究系统总线和默认会话总线。如果添加`--system`参数，`qdbus`将连接到系统总线，否则将连接会话总线。

`qdbus`使用命令中提供的其余参数作为地址，并将参数传递给指定的对象（如果有的话）。如果没有提供完整的地址，那么它会列出总线上的所有可用对象。例如，如果没有提供地址，就会列出可用的服务列表。如果提供了服务名称，将提供对象的路径。如果还提供了路径，所有接口中的所有方法都将被列出。通过这种方式，人们可以很容易地与总线上的对象进行交互，这使得`qdbus`对于测试、脚本编写甚至是研究学习都非常有用。

### qdbusviewer

`qdbusviewer`是一个Qt应用程序，它为qdbus的功能提供了一个图形界面，从而提供了一个更友好的使用体验。

# Qt D-Bus

本节介绍如何使用Qt中的DBus库调用D-Bus方法和监听D-Bus信号。

## 摘要

D-Bus允许应用程序将其内部API暴露给外部世界。这些API可以在运行时被其他应用程序通过D-Bus协议进行访问。

## 使用QDBusMessage

`QDBusMessage`表示D-Bus消息，该消息可以通过一个给定的总线发送或被接收。每个消息都属于以下四种类型中的一种，具体类型取决于该消息的目的。

- 方法调用
- 信号
- 回复
- 错误

`QDBusMessage`定义了一个枚举来表示D-Bus消息的类型，我们可以使用`QDBusMessage::type`方法获取当前`QDBusMessage`对象的类型。

### 调用D-Bus方法

我们可以使用`QDBusMessage`中的`createMethodCall`静态成员函数直接调用D-Bus服务中的方法：

```C++
QDBusMessage::createMethodCall(const QString &service, const QString &path, const QString &interface, const QString &method)
```

上述方法返回一个`QDBusMessage`对象，该对象可以使用`QDBusConnection::call()`来发送。

上述方法中**`interface`**参数是可选的，只有当要需要调用的方法在与路径对应的对象中不唯一时才需要填写。如果该对象实现了多个接口，并且这些接口中均包含该方法，就会发生这种情况。在这种（罕见的）情况下，如果你不明确定义要使用的接口（填写**`interface`**参数），就不能保证哪个接口中的方法会被调用（未定义的行为）。然而，在通常情况下你可以简单地传递一个空字符串作为**`interface`**参数。

举例来说，假设我们要访问`org.foo.bar`服务中`network`对象的（虚构的）`ping`方法，可以这样做：

```C++
QDBusMessage m = QDBusMessage::createMethodCall("org.foo.bar",
                                                "/network",
                                                "",
                                                "ping");
bool queued = QDBusConnection::sessionBus().send(m);
```

在上述例子的第5行，我们在当前的会话总线上申请排队发送消息并得到了一个代表排队成功与否的`bool`类型的返回值。

然而，这给我们留下了两个未解决的问题：

- 如何为一个方法调用设置参数？
- 在D-Bus方法有返回值的情况下，如何获得返回值？

### 设置参数

在方法调用时发送参数是非常直接的。首先，我们需要创建一个`QVariant`对象的`QList`，然后将其添加到D-Bus消息中。如果上面的`ping`方法把一个主机名作为参数，我们可以这样修改代码（注意第5行到第7行）。

```undefined
QDBusMessage m = QDBusMessage::createMethodCall("org.foo.bar",
                                                "/network",
                                                "",    
                                                "ping");
QList<QVariant> args;
args.append("kde.org");
m.setArguments(args);
bool queued = QDBusConnection::sessionBus().send(m);
```

另外，`QDBusMessage`提供了一个方便的方法，通过它的`operator<<`函数将参数附加到消息中。那么上面的例子就变成了：

```undefined
QDBusMessage m = QDBusMessage::createMethodCall("org.foo.bar",
                                                "/network",
                                                "",
                                                "ping");
m << "kde.org";
bool queued = QDBusConnection::sessionBus().send(m);
```

**注意**

参数必须以被调用的D-Bus方法中所定义顺序出现在QList中。

### 获取返回值

如果我们希望从D-Bus的方法调用中获取返回值，我们需要使用`QDBusConnection::call`方法。该方法将会阻塞当前线程，直到收到回复或调用超时。假设`ping`方法返回了参数中对应的主机的信息，我们可以代码改成这样：

```C++
QDBusMessage m = QDBusMessage::createMethodCall("org.foo.bar",
                                               "/network",
                                               "",
                                               "ping");
m << "kde.org";
QDBusMessage response = QDBusConnection::sessionBus().call(m);
```

`response`是`QDBusMessage::ReplyMessage`或`QDBusMessage::ErrorMessage`两者之一，着取决于该调用是否成功。我们可以通过`QDBusMessage::arguments()`方法获取返回值，该方法返回`QList<QVariant>`。

### 这是最好的方法吗？

当前这种方式直接使用`QDBusMessage`来调用D-Bus方法，并不是最简单、最好用甚至是最值得推荐的方式。现在我们来看看更方便的`QDBusInterface`类，然后看看如何使用从XML中自动生成的代理类来像访问本地方法一样访问D-Bus接口。

## 使用QDBusInterface

**警告**

不应该继续使用`QDBusInterface`。因为它会在应用程序启动时使用阻塞的D-Bus调用，对应用程序的启动时间有很大影响！

`QDBusInterface`提供了一种简单而直接的方法来进行D-Bus的方法调用和信号监听。

一个`QDBusInterface`对象代表一个给定的D-Bus接口。该对象的构造函数接受一个服务名称、一个对象路径、一个可选的接口和一个可选的要使用的总线对象（如System Bus或Session Bus对应的Qt对象）作为参数（按顺序）。如果没有明确定义总线，它默认为会话总线。如果没有给出接口，该对象将被用来调用总线上的所有接口。

然而，**请注意**，建议**显示的**指定`QDBusInterface`构造所需的接口名称。由于`QtDBus`的内部实现，如果没有显示的指定接口，将会导致每一次创建`QDBusInterface`对象都会进行一次额外的D-Bus调用，以验证哪些方法是可用的。另一方面，如果显示的指定了接口名称，`QtDBus`可能会缓存结果，以供之后进行使用。

`QDBusInterface`是一个`QObject`，你可以给它指定父对象，当父对象被删除时，`Qt`会为自动帮你清理所有的子对象。

> 注：Qt部分源码如下

![image-20240201173053908](assets/KDE%20D-Bus%20%E6%96%87%E6%A1%A3%E7%BF%BB%E8%AF%91/image-20240201173053908.png)

![image-20240201173104723](assets/KDE%20D-Bus%20%E6%96%87%E6%A1%A3%E7%BF%BB%E8%AF%91/image-20240201173104723.png)

下面是一个`QDBusInterface`使用的例子：

```C++
QString hostname("kde.org");
QDBusConnection bus = QDBusConnection::sessionBus();
QDBusInterface *interface = new QDBusInterface("org.foo.bar",
                                               "/network",
                                               "org.foo.bar.network", 
                                               bus,
                                               this); 

interface->call("ping");
interface->call("ping", hostname);

QList<QVariant> args;
args.append("kde.org");
interface->callWithArgumentList("ping", args);

QDBusReply<int> reply = interface->call("ping",
                                        hostname);

if (reply.isValid())
{
     KMessageBox::information(winId(), 
                              i18n("Ping to %1 took %2s")
                               .arg(hostname)
                               .arg(reply.value()),
                              i18n("Pinging %1")
                               .arg(hostname));
}

args.clear();
interface->callWithCallback("listInterfaces", args,
                            this,
                            SLOT(interfaceList(QDBusMessage)));

connect(interface, SIGNAL(interfaceUp(QString)),
        this, SLOT(interfaceUp(QString)));
```

### 同步调用

我们在第3行创建了一个`QDBusInterface`，它对我们在`QDBusMessage`的例子中访问的对象进行了进一步抽象。

然后我们使用了不同的方式通过该对象调用了几个D-Bus方法。在第9行，我们调用了没有任何参数的`ping`的方法。在第10行，我们再次调用了这个方法，但传递了一个参数。注意，使用这种方式时我们不需要为参数创建`QList<QVariant>`。我们可以通过这种方式向D-Bus方法传递最多8个参数。

如果你需要传递超过8个参数，使用`QList<QVariant>`是一个更好的选择，你可以使用`callWithArgumentList`方法来代替，如上述例子第12-14行。

### 处理返回值

在第16行，我们再次调用`ping`方法，但这次我们将返回值保存在了`QDBusReply`对象中。然后我们检查`reply`是否有效，接着我们使用返回的数据在弹出的窗口中展示了得到的数据。

### 异步方法调用和信号

到目前为止，在这个例子中的所有的调用都是同步的，这会导致应用程序阻塞，直到接收到返回值。例子中`QDBusInterface`的最后两次使用显示了D-Bus的异步使用，在异步调用的情况下，我们依赖于Qt中的信号和槽机制。

在第30行，我们使用了`callWithCallback`，并提供了一个常规的`QObject`槽，当D-Bus Reply返回时进行调用。这样，应用程序就不会被阻塞，因为`callWithCallback`在排队发送消息到总线上之后就会立即返回。等到收到D-Bus Reply之后，`interfaceList`槽函数将会被调用。注意，这个方法需要`QList<QVariant>`作为参数。

在第34行我们连接了一个D-Bus信号。使用`QDBusInterface`来做这件事看起来就像在我们自己的应用程序中连接一个普通的、本地的信号一样。我们甚至使用了标准的`QObject::connect`方法! 这是通过`QDBusInterface`使用`Qt`的元对象系统来动态添加D-Bus接口公布的信号所完成的。

### 是否还有更方便的方法?

与`QDBusMessage`相比，`QDBusInterface`易用了许多。然而，我们仍然需要处理一些烦人的问题，比如必须知道接口的名称，设置正确的`QDBusReply`对象（比如我们在上面用`int`进行模板化），以及必须在运行时手动调试方法名称的错误等等，而不是让编译器为我们做这些事情。因此，虽然`QDBusInterface`比`QDBusMessage`有所改进，但仍然不够完美。

而这正是`qdbusxml2cpp`发挥威力的领域。

### 使用从D-Bus XML生成的类

如果我们能够实例化一个代表特定`Service`的本地对象，并立即开始使用它。也许像这样：

```C++
org::foo::bar::network *interface = 
    new org::foo::bar::network("org.foo.bar", "/network",
                            QDBusConnection::sessionBus(),
                            this);
interface->ping("kde.org");
```

幸运的是，这正是`Qt`所允许我们做的。唯一的要求是需要有一个描述D-Bus服务的XML文件。

**Tip**

D-Bus 的前缀是

```
${CMAKE_INSTALL_PREFIX}/share/dbus-1/interfaces
```

`${CMAKE_INSTALL_PREFIX}` 可以通过在终端执行如下命令获取

```
pkg-config dbus-1 --variable=prefix
```

我们也可以通过`C++`头文件来生成我们自己的XML文件。这将在下一节《创建D-Bus接口》中讲述。

有了XML的路径，我们就可以在我们的CMakeLists.txt中添加类似这样的内容：

```C++
set(network_xml ${CMAKE_INSTALL_PREFIX}/${DBUS_INTERFACES_INSTALL_DIR}/org.foo.bar.xml)
qt5_add_dbus_interface(myapp_SRCS ${network_xml} network_interface)
```

这将在构建时生成两个文件，`network_interface.h`和`network_interface.cpp`，并将它们添加到应用程序中进行编译。然后我们可以简单地

```C++
#include "network_interface.h"
```

并使用生成的类。

检查生成的头文件，我们可以准确地看到方法、信号以及它们的参数和返回值。使用该类可以让编译器对方法调用进行类型检查，从而减少了运行时可能发生的错误。

由于生成的类是`QDBusAbstractInterface`的子类，就像`QDBusInterface`一样，所以可以用`QDBusInterface`做的任何事情也可以用`QDBusAbstractInterface`实现。

由于这种方法兼顾了易用性和编译时的类型检查，所以在访问复杂的D-Bus接口时，这通常是首选方案。

**Tip**

如果你的CMake没有提供`${DBUS_INTERFACES_INSTALL_DIR}`，记得将`KDE ECM`模块加入你的`CMakeLists.txt`中。

但这种方式也有其缺点，我们需要拥有一个XML文件才可以在编译时生成适配器。这个XML文件必须存在于系统中。这意味着我们必须先建立带有这个文件的项目，从而会导致更多的编译时的依赖性。通过在源代码中添加XML文件可以避免这种情况，但只有在你能保证实际的接口和项目中包含的XML文件一致时该方案才可行。

每种方式都有优点和缺点，请自由选择你的解决方案。我的建议是：

- 如果远程接口足够简单，直接使用`QDBusInterface`。
- 如果XML文件来自于一个很可能首先被编译的软件，则使用`Adoptor`。例如，来自`KWin`或`PowerDevil`或其他最重要的`Plasma`软件的XML文件。
- 如果它是由同一个项目安装的，使用适配器也是可以的。也就是说，你的项目包括一个守护程序和一个客户端，XML文件来自守护程序，而适配器用于客户端。在同一个项目中，你可以保证生成的适配器是正确的。

### Doing A Little Introspection

找出一个给定的服务是否可用，或者检查是哪个应用程序正在提供该服务，这可能对我们了解D-Bus是有帮助的。另一个`QDBusAbstractInterface`子类：`QDBusConnectionInterface`，提供了查询哪些服务被注册以及谁拥有这些服务等信息的方法。

一旦你拥有了一个服务名称，你就可以使用`QDBusInterface`来获取`org.freedesktop.DBus.Introspectable`接口并对其调用`Introspect`。这将返回一个描述对象的 XML 块，反过来可以对它们提供的内容进行分析。XML本身可以用`QDomDocument`来处理，使之成为一个相当简单的过程。

与`Qt`一起发布的`qdbus`提供了一个很好的例子。可以在Qt源代码中的`tools/qdbus/tools/qdbus/qdbus.cpp`找到它的源码。

# 中级D-Bus

一些在面对真正的DBus接口时，利用`QtDBus`的技巧。

## 摘要

在《Qt D-Bus》中我们介绍了如何处理简单的D-Bus方法，但在事实上我们经常可以发现有更复杂的D-Bus需要处理。本节将会介绍相关的处理方法。

## 复杂的返回类型

`QtDBus`需要一些额外的设置来处理那些具有复杂返回类型的方法。复杂返回类型需要向`Qt`类型系统声明，以便它可以被`Qt`支持。

### List

由D-Bus方法返回的返回值的列表将被映射到`QtDBus`的`QList`上。`QList`的适当特化需要作为一个类型声明给`Qt`类型系统，例如：

```C++
Q_DECLARE_METATYPE(QList<QDBusObjectPath>)
```

`Q_DECLARE_METATYPE`宏必须在源代码中任何代码块或方法之外使用。使用它的最佳位置是在文件的顶部。

该类型**同时**也需要使用`QtDBus`声明。

```C++
qDBusRegisterMetaType<QList<QDBusObjectPath>>();
```

### Dicts

D-Bus中的`Dict`类型将被映射到`QMap`上。

### 任意的返回类型集

一些D-Bus方法会返回一个任意大小的元组。`QDBusReply`类只能处理方法返回的第一个返回值，所以为了获得其余的返回值，我们需要使用`QDBusMessage`。由于`QDBusAbstractInterface::call()`和其他类似的方法实际上返回值的类型都是`QDBusMessage`，所以当我们在使用`QDBusReply`时，实际上只是从函数返回的`QDBusMessage`中构造出了一个新的对象。

一旦我们有了`QDBusMessage`，我们就可以使用`arguments()`来访问所有的返回值，该函数返回一个`QList<QVariant>`。

例如，对于`org.kde.DBusTute.Favourites.Get( out INT32 number, out STRING colour, out STRING flavour )`方法，我们将使用以下代码：

```C++
QDBusInterface iface( "org.kde.DBusTute",
                      "/org/kde/DBusTute/Favourites",
                      "org.kde.DBusTute.Favourites",
                      QDBus::sessionBus());
QDBusMessage reply = iface.call( "Get" );
QList<QVariant> values = reply.arguments();
int favouriteNumber = values.takeFirst().toInt();
QString favouriteColour = values.takeFirst().toString();
QString favouriteFlavour = values.takeFirst().toString();
```

## 不支持Introspect的接口

`QDBusInterface`，作为远程D-Bus接口的代理，利用`Introspect`来提供对D-Bus信号和属性的高级访问。然而，该对象必须支持`org.freedesktop.DBus.Introspectable`接口才能这样做，这个接口并不是强制性的。

### 属性

要发现通过`QObject::property()`可以访问的属性，就需要`Introspect`。如果`Introspect`不存在，但我们通过查看远程接口的源代码知道了属性的名称和类型，就可以通过以下D-Bus方法手动使用D-Bus的属性系统。

```C++
org.freedesktop.DBus.Properties.Get (in STRING interface_name,
                                     in STRING property_name,
                                     out VARIANT value);
org.freedesktop.DBus.Properties.Set (in STRING interface_name,
                                     in STRING property_name,
                                     in VARIANT value);
```

### 信号

如果不支持`Introspect`，`QObject::connect()`将在运行时得到一个`'no such signal'`的错误。

但这种情况下我们仍然可以使用一些抽象层级较低的方式通过`QtDBus`连接到这些信号。使用`QDBusConnection::connect()`。如果你因为`QDBusInterface`的方便的`call()`方法在使用它，那么你可以获得它的连接并调用`connect()`来监听信号。

```C++
QDBusInterface iface("org.kde.DBusTute",
                     "/org/kde/DBusTute/Favourites",
                     "org.kde.DBusTute.Favourites",
                     QDBus::sessionBus());

iface.connection().connect("org.kde.DBusTute",
                           "/org/kde/DBusTute/Favourites",
                           "org.kde.DBusTute.Favourites",
                           "FavouritesChanged", this,
                           SLOT(favouritesChanged()));
```

`QDBusConnection::connect()`与普通的`QObject::connect()`相似，但不支持包括`lambdas`在内的一些新的语法。

# 创建D-Bus接口

本节主要讲解了如何在应用程序中通过自定义的D-Bus接口对外暴露功能。包括生成XML描述、运行时实例化接口以及使用CMake构建系统。

## 摘要

D-Bus允许应用程序将内部API暴露给外部世界。本教程展示了如何在应用程序中创建和实现这种D-Bus接口。

## 定义接口

D-Bus接口通常反映了应用程序中的一个或多个类的API。通过创建一个`QDBusAbstractAdaptor`的子类，对DBus消息做出反应并采取行动，就可以将这个API连接到D-Bus上。然而，通常情况下，每个方法都需要采用这种方式手动对外暴露。然而这种重复的工作可以通过生成D-Bus的XML描述文件来进行避免。

在总线上暴露的接口可以使用D-Bus规范中的标准的XML格式来描述，如下所示：

```XML
<!DOCTYPE node PUBLIC "-//freedesktop//DTD D-BUS Object Introspection 1.0//EN" "http://www.freedesktop.org/standards/dbus/1.0/introspect.dtd">
<node>
  <interface name="org.foo.Background">
    <signal name="backgroundChanged">
    </signal>
    <method name="refreshBackground">
    </method>
    <method name="currentBackground">
      <arg type="s" direction="out"/>
    </method>
    <method name="setBackground">
      <arg type="b" direction="out"/>
      <arg name="name" type="s" direction="in"/>
    </method>
  </interface>
</node>
```

如果有人使用过像`qdbus`（终端）或`qdbusviewer`（图形）这样的D-Bus应用程序来执行过`org.freedesktop.DBus.Introspectable.Introspect`方法，上述的内容可能看起来会很熟悉。

我们可以手工构建这个XML，并手动将其映射到给定的类的API上，但这不仅容易出错、耗费时间，而且也很枯燥。如果不是因为这个XML可以被其他希望使用你的D-Bus接口的应用程序使用，我们还不如自己写一个`QDBusAbstractAdaptor`。

幸运的是，有一些方法可以使这一过程自动化，那就是：创建一个包括所有我们期望通过D-Bus公开的方法的类，然后使用Qt自带的工具来为我们完成剩下的工作。

### 定义方法

下面的例子中，我们允许用户设置壁纸或者查询当前壁纸设置。我们将在这个接口中提供三个方法，可以在下面的类定义中看到。

```C++
#include <QObject>

class Background : QObject
{
    Q_OBJECT

    public:
        Background(QObject* parent);

        void doNotExportToDBus();
        
        void refreshBackground();
        QString currentBackground();

    Q_SIGNALS:
        void doNotExportThisSignal();
        void backgroundChanged();

    public Q_SLOTS:
        bool setBackground(QString name);

    protected Q_SLOTS:
        void dbusCanNotSeeMe();
};
```

接下来，我们需要标记上述哪些方法我们希望通过D-Bus暴露出来。幸运的是，这很简单，我们有以下选项。

- 输出所有信号
- 导出所有公共槽
- 导出所有属性
- 只输出`scriptable`的信号
- 只导出`scriptable`的公共槽
- 只导出`scriptable`的属性

我们也可以按照自己的意愿自由组合上述内容。为了达到例子的预期效果，我们需要对类的定义进行相应的调整。

```C++
#include <QObject>
class Background : QObject
{
    Q_OBJECT

    public:
        Background(QObject* parent);

        void doNotExportToDBus();

    Q_SIGNALS:
        void doNotExportThisSignal();
        Q_SCRIPTABLE void backgroundChanged();

    public Q_SLOTS:
        void refreshBackground();
        QString currentBackground();
        bool setBackground(QString name);

    protected Q_SLOTS:
        void dbusCanNotSeeMe();
};
```

注意我们将希望导出的方法设置成为公共的槽函数，并且使用`Q_SCRIPTABLE`标记我们希望导出的信号。稍后，我们会创建一个导出了所有的公共槽函数和所有的`Q_SCRIPTABLE`的信号的接口。

然后我们会按照上面的定义去完善这个接口的实现。

**Tip**

当通过D-Bus将API暴露给其他应用程序时，其他应用程序可能会依赖接口中的调用。因此，改变D-Bus接口可能会给其他人带来困扰。出于这个原因，我们建议在你的应用程序的主要版本的生命周期内，保持D-Bus API的兼容性。

### 命名接口

在定义了接口之后，下一步就是想出一个它在总线上显示的名字。按照惯例，这些名称采用反向域名的形式，以防止名称冲突。因此，如果你的项目网站的域名是`foo.org`，你应该在接口名称前加上`org.foo`。

因此，我们可以选择将我们的接口实例称为`org.foo.Background`。最简单的定义方法是在我们的类定义中添加一个`Q_CLASSINFO`宏条目。

```C++
class Background : QObject
{
    Q_OBJECT
    Q_CLASSINFO("D-Bus Interface", "org.foo.Background")
```

该接口现在将被称为`org.foo.Background`。

## 生成接口

### 最简单的方式

生成接口的最简单方法是直接将你的类作为接口。只要确保你的类在`Q_OBJECT`宏下有`Q_CLASSINFO("D-Bus Interface", "org.foo.Background")`。现在你可以跳过下一节，前往`在运行时实例化接口`了。

### 复杂但有效的方法

这种方式需要一个更复杂的构建程序，但如果你的项目将被许多其他应用程序使用，这可能是更好的方式。该方式在系统中安装了一个XML文件，其他应用程序可以用该XML来生成自己的适配器类。任何安装了你的项目的人都可以参考这个文件，而不需要去看你的项目源代码。

现在我们已经在类中设置了接口，然后我们将想要生成一个适配器类，在D-Bus和我们的应用程序的对象之间进行调解。第一步是生成本教程开头所看到的XML。

你可以通过在终端调用`qdbuscpp2xml`手动生成XML文件，并将生成的XML文件作为项目源代码的一部分。

另一个选择是让CMake在编译时为你做这件事。这种方法的优点是可以保持源代码的干净，而且不需要在每次编辑类之后手动生成XML文件。

### 解决方案一：手动调用`qdbuscpp2xml`

为了生成XML，我们可以使用Qt自带的`qdbuscpp2xml`命令行工具。该工具可以根据C++源文件为我们生成描述D-Bus接口的XML文档。具体参数如下：

| Switch | Exports                 |
| ------ | ----------------------- |
| -S     | all signals             |
| -M     | all public slots        |
| -P     | all properties          |
| -A     | all exportable items    |
| -s     | scriptable signals      |
| -m     | scriptable public slots |
| -p     | scriptable properties   |
| -a     | all scriptable items    |

在我们上面的例子中，我们想导出所有的公共槽函数和`scriptable`的信号。因此，我们将使用如下命令：

```Bash
qdbuscpp2xml -M -s background.h -o org.foo.Background.xml
```

生成的XMl文件如下：`org.foo.Background.xml`

```XML
<!DOCTYPE node PUBLIC "-//freedesktop//DTD D-BUS Object Introspection 1.0//EN" "http://www.freedesktop.org/standards/dbus/1.0/introspect.dtd">
<node>
  <interface name="org.foo.Background">
    <signal name="backgroundChanged">
    </signal>
    <method name="refreshBackground">
    </method>
    <method name="currentBackground">
      <arg type="s" direction="out"/>
    </method>
    <method name="setBackground">
      <arg type="b" direction="out"/>
      <arg name="name" type="s" direction="in"/>
    </method>
  </interface>
</node>
```

这个文件应该与你的项目源码一起发布。

### 解决方案二：使用CMake调用qdbuscpp2xml (Preferred)

在工程文件的`CMakeLists.txt`中添加如下内容：

```Plain
set(my_nice_project_SRCS 
    ${my_nice_project_SRCS}
    ${CMAKE_CURRENT_BINARY_DIR}/org.foo.Background.xml
)
qt5_generate_dbus_interface(
    background.h
    org.foo.Background.xml
    OPTIONS -a
)
install(FILES ${CMAKE_CURRENT_BINARY_DIR}/org.foo.Background.xml DESTINATION ${DBUS_INTERFACES_INSTALL_DIR})
```

这将从`background.h`生成`org.foo.Background.xml`，并将其安装在`${DBUS_INTERFACES_INSTALL_DIR}`中。(通常指`/usr/share/dbus-1/interfaces`)。

### 使用CMake导出接口

接下来我们把这个XML文件添加到我们的项目中。这可以通过在`CMakeLists.tx`t文件中添加以下内容来完成。

```Plain
qt5_add_dbus_adaptor(my_nice_project_SRCS org.foo.Background.xml
                     background.h Background)
```

这将在构建目录中生成两个文件，在本例中是`backgroundadaptor.h`和`backgroundadaptor.cpp`，并编译到应用程序中。你不应该将这些文件与你项目的源码一起发布。

同时，D-Bus的XML描述文件也将被安装。这将允许用户将其作为参考进行检查，同时其他应用程序也可以使用这个文件利用`qdbusxml2cpp`生成接口类。

你可以在运行时将生成的适配器实例化。

## 在运行时实例化接口

### 简单的方式

你可以使用`QDBusConnection::registerObject`来注册你的类。通常需要在类的构造函数中注册，但如果你有同一个类的多个实例，你需要确保没有DBus路径冲突。对于一个单例类，你可以在构造函数中做这样的事情。

```C++
#include <QDBusConnection>
Background::Background(QObject* parent)
    : QObject(parent)
{
    // register DBus object at org.kde.myapp/foobar
    QDBusConnection::sessionBus().registerService("org.kde.myapp");
    QDBusConnection::sessionBus().registerObject("/foobar", this, QDBusConnection::ExportScriptableContents);

    ... // the rest of constructor
} 
```

在第6行，我们向DBus注册服务名称。该名称不应该被任何其他项目所使用。注意，如果你有

```C++
    KLocalizedString::setApplicationDomain("myapp");
    KDBusService service(KDBusService::Unique);
```

在你的`main`函数中，服务名称`org.kde.myapp`将会被自动注册，因此你可以安全地省略第6行。

在第7行，我们将这个类注册为`org.kde.myapp/foobar/org.foo.Background`的一个对象。第二个参数是指向你想暴露给DBus的类的指针，这个类应该是`QObject`的子类，并且有`Q_CLASSINFO("D-Bus Interface", "org.foo.Background")` 。第三个参数是你想暴露给DBus的方法，关于更多的详细的信息，请查阅`Qt`的`QDBusConnection`文档。

然而，如果你有这个类的多个实例，我们需要编辑上面的例子以避免发生冲突。用`QDBusConnection::sessionBus().registerObject("/foobar", this, QDBusConnection::ExportScriptableContents)`代替`QDBusConnection::sessionBus().registerObject("/foobar/" + QString("YOUR UNIQUE INSTANCE IDENTIFIER"), this, QDBusConnection::ExportScriptableContents)`

### 复杂的方法

现在我们已经为创建了接口，接下来我们所要做的就是在运行时实例化该接口。我们可以通过包含生成的`Adaptor`头文件并且实例化一个`Adaptor`对象来完成这个工作，如下所示：

```C++
#include "background.h"
#include "backgroundadaptor.h"

Background::Background(QObject* parent)
    : QObject(parent)
{
    new BackgroundAdaptor(this);
    QDBusConnection dbus = QDBusConnection::sessionBus();
    dbus.registerObject("/Background", this);
    dbus.registerService("org.foo.Background");
} 
```

由于生成的`Adaptor`是一个`QObject`，当我们将`this`指针传递给`Adaptor`的构造函数时，它不仅会在我们的`Background`对象被删除时被删除，并且还会为了转发D-Bus调用而将自己绑定到这个对象上。

然后我们需要通过调用`QDBusConnection::registerObject`在总线上注册我们的对象，并通过调用`QDBusConnection::registerService`暴露接口供他人使用。

**Tip**

如果在你的应用程序中创建了多个相同的对象，那么你将需要为每个对象注册一个唯一的路径。如果你的对象没有定义好的、唯一的命名方案，那么`this`指针可能会派上用场。