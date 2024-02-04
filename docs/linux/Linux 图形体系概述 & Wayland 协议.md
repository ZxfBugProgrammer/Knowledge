# Linux 图形体系概述 & Wayland 协议
<br>

# Linux 图形体系概述

## 硬件概览

![image-20240201193008805](assets/Linux%20%E5%9B%BE%E5%BD%A2%E4%BD%93%E7%B3%BB%E6%A6%82%E8%BF%B0%20&%20Wayland%20%E5%8D%8F%E8%AE%AE/image-20240201193008805.jpg)

上图是一块过时的破旧的显卡，它由如下几部分组成：

- GPU: 核心运算部件
- VRAM(Video RAM): 存储纹理或通用数据
- Video Outputs: 与屏幕进行连接的物理接口
- Power stage: 降低电压，调节电流
- Host communication bus: 与 CPU 进行通信的部件

接下来我们来看下这块老旧显卡驱动屏幕显示的粗略流程

![image-20240201193013991](assets/Linux%20%E5%9B%BE%E5%BD%A2%E4%BD%93%E7%B3%BB%E6%A6%82%E8%BF%B0%20&%20Wayland%20%E5%8D%8F%E8%AE%AE/image-20240201193013991.jpg)

- `Framebuffer`：存放需要在屏幕中显示的图片(`VRAM`)
- `CRTC`：(`Cathode Ray Tube Controller`) 控制显卡输出的视频信号的时序（即控制每个像素在何时被发送到屏幕，并控制像素的颜色和亮度等参数），以便与屏幕的时序匹配，确保图像可以正确地显示在屏幕上。
- `Encoder`：将`CRTC`的输出转换为正确的物理信号
- `Connector`：屏幕与显卡的接口

### `Framebuffer`

![image-20240201193020420](assets/Linux%20%E5%9B%BE%E5%BD%A2%E4%BD%93%E7%B3%BB%E6%A6%82%E8%BF%B0%20&%20Wayland%20%E5%8D%8F%E8%AE%AE/image-20240201193020420.jpg)

昇阳TGX帧缓冲器

帧缓冲器是一个视频输出设备，它从一个包含了完整帧数据的内存缓冲区驱动视频显示器。

内存缓冲区中的信息通常包含屏幕上每个像素的色彩值，色彩值常以1位、4位、8位、16位及 24位真彩色格式存储。有时还有一个alpha通道来保存像素的透明度。驱动帧缓冲器所需的总内存量取决于输出信号的分辨率、色彩深度和调色板大小。

向量显示器比帧缓冲器出现得早，二者有很大的不同。使用向量显示器时，只存储了图元（graphics primitives）的顶点。输出显示器的电子束按命令从一个顶点移动到另一个顶点，在这些点之间形成一个模拟的线条。而使用帧缓冲器时，电子束（如果显示技术使用了电子束）按命令在整个屏幕上从左到右、从上到下描绘（trace），也就是电视机呈现广播信号的方式。与此同时，屏幕上每个点的色彩信息从帧缓冲器中取出，形成一系列离散的像素。

### `CRTC`

![image-20240201193025380](assets/Linux%20%E5%9B%BE%E5%BD%A2%E4%BD%93%E7%B3%BB%E6%A6%82%E8%BF%B0%20&%20Wayland%20%E5%8D%8F%E8%AE%AE/image-20240201193025380.jpg)

`CRTC`是阴极射线管控制器的缩写，它产生视频定时信号，从连接到`CRTC`的`RAM`中读取视频数据并通过`Encoder`、`Connector`驱动屏幕显示图像。

![image-20240201193028914](assets/Linux%20%E5%9B%BE%E5%BD%A2%E4%BD%93%E7%B3%BB%E6%A6%82%E8%BF%B0%20&%20Wayland%20%E5%8D%8F%E8%AE%AE/image-20240201193028914.jpg)

- `CRTC`(阴极射线管控制器)控制`CRT`(阴极射线管)从上到下，从左到右，依次显示每一个像素。
- 在每一行显示完成之后，`CRTC`(阴极射线管控制器)必须等待`CRT`(阴极射线管)返回到下一行的开头（`HBlank`）
- 在每一帧显示完成之后，`CRTC`(阴极射线管控制器)必须等待`CRT`(阴极射线管)返回到第一行（`VBlank`）

### `Connector`

如下分别是`VGA`、`DVI`、`DP`、`HDMI`接口：

![image-20240201193036820](assets/Linux%20%E5%9B%BE%E5%BD%A2%E4%BD%93%E7%B3%BB%E6%A6%82%E8%BF%B0%20&%20Wayland%20%E5%8D%8F%E8%AE%AE/image-20240201193036820.jpg)

- `VGA`：支持视频，由`IBM`于1987年推出
- `DP`：支持视频和音频，由`VESA`于2006年推出

- `DVI`：支持视频，由`DDWG`于1999年推出
- `HDMI`：支持视频和音频，由`HDMI Founders`于1999年推出

## 概念浅析

在介绍下面的内容之前，有几个概念我们需要辨别清楚。

### Linux与Linux发行版(Linux distributions)

Linux 是一个内核，而不是一个操作系统。内核是一个操作系统的核心，它接近于具体的硬件。我们使用应用程序和 shell 与它交互。

![image-20240201193040583](assets/Linux%20%E5%9B%BE%E5%BD%A2%E4%BD%93%E7%B3%BB%E6%A6%82%E8%BF%B0%20&%20Wayland%20%E5%8D%8F%E8%AE%AE/image-20240201193040583.jpg)

Linux 发行版是一个由 Linux 内核、GNU 工具、附加软件和软件包管理器组成的操作系统，它也可能包括显示服务器和桌面环境，以用作常规的桌面操作系统。

这个术语之所以是 “Linux 发行版”，是因为像 Debian、Ubuntu 这样的机构“发行”了 Linux 内核以及所有必要的软件及实用程序（如网络管理器、软件包管理器、桌面环境等），使其可以作为一个操作系统使用。

> 上文中提到了shell，那么，什么是shell呢？它和Terminal、Console、Cli、TTY分别表示什么概念呢？
>
> 有兴趣的同学可以看下https://segmentfault.com/a/1190000016129862
>
> - **命令行界面** (CLI) = 使用文本命令进行交互的用户界面
> - **终端** (Terminal) = **TTY** = 文本输入/输出环境
> - **控制台** (Console) = 一种特殊的终端
> - **Shell** = 命令行解释器，执行用户输入的命令并返回结果
>
> 下面的图解释了为什么我们现在使用的**终端** (Terminal) 被称为**终端模拟器** (Terminal Emulator)
>
> ![image-20240201193050746](assets/Linux%20%E5%9B%BE%E5%BD%A2%E4%BD%93%E7%B3%BB%E6%A6%82%E8%BF%B0%20&%20Wayland%20%E5%8D%8F%E8%AE%AE/image-20240201193050746.jpg)
>
> ![image-20240201193100579](assets/Linux%20%E5%9B%BE%E5%BD%A2%E4%BD%93%E7%B3%BB%E6%A6%82%E8%BF%B0%20&%20Wayland%20%E5%8D%8F%E8%AE%AE/image-20240201193100579.jpg)
>
> ![image-20240201193105863](assets/Linux%20%E5%9B%BE%E5%BD%A2%E4%BD%93%E7%B3%BB%E6%A6%82%E8%BF%B0%20&%20Wayland%20%E5%8D%8F%E8%AE%AE/image-20240201193105863.jpg)

### 桌面环境(Desktop Environment)

桌面环境是GUI组件的组合体，如图标、工具栏、壁纸和桌面小部件等。

大多数桌面环境都有自己的一套集成的应用程序，以便用户在使用时能得到统一的使用体验。如：文件资源管理器、桌面搜索、应用程序菜单、壁纸和屏保实用程序、文本编辑器等。

如果没有桌面环境，基于 Linux 的操作系统就无法通过GUI操作系统了。

### 显示服务器(Display Server)

显示服务器 (Display Server) 是一个程序，它负责协调其客户端与操作系统之间、硬件和操作系统之间的输入和输出。只有通过显示服务器，我们才可以使用计算机的图形用户界面（GUI）。如果没有显示服务器，我们就只能使用命令行界面（TTY）。

显示服务器为图形环境提供框架，使我们可以通过鼠标和键盘与应用程序交互。

显示服务器通过显示服务器协议（如X11、Wayland）与其客户端通信。显示服务器是任何图形用户界面的关键组件，特别是窗口系统。

不要将显示服务器与桌面环境混淆。桌面环境依托于显示服务器。

## 软件概览

对上述概念有了一个清晰的了解之后，我们对 Linux 的图形体系就可以建立如下认知：

![image-20240201193111624](assets/Linux%20%E5%9B%BE%E5%BD%A2%E4%BD%93%E7%B3%BB%E6%A6%82%E8%BF%B0%20&%20Wayland%20%E5%8D%8F%E8%AE%AE/image-20240201193111624.jpg)

- 用户通过桌面环境以及其他应用程序提供的图形用户接口与操作系统交互
- 桌面环境以及其他应用程序作为显示服务器的客户端，借助显示服务器在屏幕上显示图形界面，并接收键盘、鼠标等事件。
- 显示服务器与窗口管理器在概念上并不是一体的。没有窗口管理器，显示服务器仍然可以在屏幕上显示界面。
- 显示服务器从 kernel 接收事件，处理后分发给上层应用(桌面环境以及其他应用程序)。

## 图形系统演变过程

1. 显卡最早只有基本的显示功能，可以称为显示控制器（Display Controller）或者帧缓冲设备。

    对于这样的显示控制器，Linux 内核部分对其的支持表现为`framebuffer`驱动，`Xorg`(是X11协议的实现，是一个显示服务器)部分对其的支持是`fbdev`驱动。

    > `X11` 与 `Xorg`
    >
    > X窗口系统（X Window System，也常称为X11或X）是一种以位图方式显示的软件窗口系统。最初是1984年麻省理工学院的研究，之后变成UNIX、类UNIX、以及OpenVMS等操作系统所一致适用的标准化软件工具包及显示架构的运作协议。
    >
    > 由于X只是工具包及架构规范，本身并无实际参与运作的实体，所以必须有人依据此标准进行开发撰写。如此才有真正可用、可执行的实体，始可称为实现体。
    >
    > 目前依据X的规范架构所开发撰写成的实现体中，以X.Org最为普遍且最受欢迎。X.Org所用的协议版本，X11，是在1987年9月所发布。而今最新的参考实现（参考性、示范性的实现体）版本则是X11 Release 7.8（简称：X11R7.8），而此项目由X.Org基金会所领导，且是以MIT授权和相似的授权许可的自由软件。

2. 后面显卡上逐渐加上了2D加速部件，如下图：

  注意，这个时候X Server**必须拥有root权限**。

![image-20240201193118930](assets/Linux%20%E5%9B%BE%E5%BD%A2%E4%BD%93%E7%B3%BB%E6%A6%82%E8%BF%B0%20&%20Wayland%20%E5%8D%8F%E8%AE%AE/image-20240201193118930.jpg)

- DIX（Device Independent X）是 X11 服务器的一部分，它提供了与硬件无关的绘图和输入处理功能。DIX 负责处理所有客户端的输入事件，以及将输出绘制到屏幕上。它是 X11 服务器的核心组件之一。
- XAA（XFree86 Acceleration Architecture）是一个用于加速 2D 图形操作的 X11 扩展。它提供了一些优化技术，如位图缓存、填充矩形和位图转移等。XAA 早期是 Linux 图形栈中的一个重要组件，但现在已经被更现代的技术所取代。
- DDX（Device Dependent X）是 X11 服务器的另一部分，它提供了与硬件相关的功能。DDX 负责与硬件交互，从硬件设备中读取输入事件，并将渲染操作发送到硬件设备。DDX 与 DIX 一起协同工作。

3. 随着3D图形显示和运算的需要，带有图形运算功能的显卡出现，这个时候需要有专门的3D驱动来处理3D，如下图：

![image-20240201193123531](assets/Linux%20%E5%9B%BE%E5%BD%A2%E4%BD%93%E7%B3%BB%E6%A6%82%E8%BF%B0%20&%20Wayland%20%E5%8D%8F%E8%AE%AE/image-20240201193123531.jpg)

- GLX（OpenGL Extension to the X Window System）是一个用于在 X Window System 上使用 OpenGL 的扩展协议。它允许 OpenGL 应用程序在 X 窗口系统中创建和管理 OpenGL 上下文，并将渲染结果输出到 X 窗口或者全屏幕上。
- Utah GLX driver 是GLX协议的一个实现，它最初由 Utah University 的一个研究小组开发，可以提供硬件加速的 OpenGL 渲染功能。它可以显著提升 OpenGL 应用程序的性能和渲染质量。
- X server依然处在一个中心节点的位置，无论是X11程序还是3D OpenGL程序，都要通过X server才能与底层交互。
- 到现在为止X的2D driver和GLX driver都是直接调用到硬件，而没有通过内核调用。

4. 上述的结构虽然简单，但存在着一个比较大的问题。X server是单线程的，`main`函数完成系统初始化之后就进入了事件循环，等待客户端程序连接。连接完成之后，需要等当前客户端程序发送完数据之后其他的客户端可以连接。OpenGL客户端程序每次要请求硬件都必须先经过X server，然后再由X server去调用硬件。对于场景复杂的3D应用程序来说，这样频繁的和X server交互是难以保证3D渲染的实时性的。由于上述问题，Linux 引入了DRI机制，通过DRI机制，OpenGL程序对硬件的请求可以不再经过X server，直接与硬件交互，如下图：

![image-20240201193129915](assets/Linux%20%E5%9B%BE%E5%BD%A2%E4%BD%93%E7%B3%BB%E6%A6%82%E8%BF%B0%20&%20Wayland%20%E5%8D%8F%E8%AE%AE/image-20240201193129915.jpg)

- OpenGL程序向内核申请一片渲染目标(显存缓冲区)并通知X server。
- OpenGL程序通过OpenGL DRI driver直接调用内核，请求硬件进行渲染操作，并将结果渲染到申请到的渲染目标中。
- 渲染结束后，OpenGL程序通知X server该渲染目标发生了变化，对应的屏幕上的窗口区域需要进行更新。
- X server收到通知后，重新进行合成上屏。
- GLX driver被DRI driver取代，和DRI driver交互的不再是X server而直接是OpenGL程序。另外DRI（原来是GLX）不直接操作硬件，而是通过内核drm驱动操作硬件。（目前，2D driver以EXA 2D加速驱动的形式存在于Xorg里面，DRI driver则在Mesa中。 ）

5. Utah GLX直接调用到硬件，没有通过内核。AIGLX的作用与Utah GLX大致相同，但是它并不会直接的访问硬件而是通过内核drm驱动操作硬件。详见：http://en.wikipedia.org/wiki/AIGLX
  这个时候X server就**不需要root权限**了。

![image-20240201193133471](assets/Linux%20%E5%9B%BE%E5%BD%A2%E4%BD%93%E7%B3%BB%E6%A6%82%E8%BF%B0%20&%20Wayland%20%E5%8D%8F%E8%AE%AE/image-20240201193133471.jpg)

6.  X server通过不断扩展形成了现在的样子，显得庞大而且复杂，有些工作是不必要的。开源社区提出了更为简洁的wayland图形系统。(具体细节见下文)

![image-20240201193136539](assets/Linux%20%E5%9B%BE%E5%BD%A2%E4%BD%93%E7%B3%BB%E6%A6%82%E8%BF%B0%20&%20Wayland%20%E5%8D%8F%E8%AE%AE/image-20240201193136539.jpg)

## X 协议与 wayland 协议对比

关于X与Wayland两种协议架构的区别可见下图，详见[Wayland官网架构介绍](https://wayland.freedesktop.org/architecture.html)。

Wayland Server，不仅负责**与 Clients 通信**，更要把接收到来的图像**合成**后呈现到显示器上，也就是说在 Wayland 中 Server、Window Manager 是**二位一体**的。 因此我们见到的 Server、服务端、合成器、混成器、窗口管理器等概念**所指相同**。

> 在X中显示服务器和窗口合成器分开是因为**历史原因**，在没有合成器之前，X使用**栈****式窗口管理器**。
>
> 最初图形界面的应用程序是全屏的，独占整个显示器，所有程序都全屏并且任何时刻只能看到一个程序的输出，这个限制显然不能满足人们使用计算机的需求， 于是就有了**窗口**的概念
>
> 在当时图形界面的概念刚刚普及的时候，绘图操作是非常“昂贵”的。 可以想象一下`800x600`像素的显示器输出下，每帧真彩色位图就要占掉`800×600×3≈1.4MiB`的内存大小，`30Hz`的刷新率（也就是`30FPS`）下每秒从 `CPU`传往绘图设备的数据单单位图就需要`1.4×30=41MiB`的带宽。对比一下当时的`VESA`接口，总的数据传输能力也就是`25MHz×32bits=100MiB/s`左右，对当时的硬件而言， 这是一个庞大的负担。
>
> 于是在当时的硬件条件下采用栈式窗口管理器有一个巨大优势 ：如果正确地采用画家算法， 并且合理地控制重绘时**只绘制没有被别的窗口覆盖的部分** ，那么无论有多少窗口互相遮盖，都可以保证每次绘制屏幕的最大面积不会超过整个显示器的面积。 同样因为实现方式栈式窗口管理器也有一些难以回避的**限制** ：
>
> - 窗口必须是矩形的，不能支持不规则形状的窗口。
> - 不支持透明或者半透明的颜色。
> - 为了优化效率，在缩放窗口和移动窗口的过程中，窗口的内容不会得到重绘请求， 必须等到缩放或者移动命令结束之后窗口才会重绘。
>
> 以上这些限制在早期的X11窗口管理器比如`twm`以及XP之前经典主题的Windows或者经典的Mac OS上都能看到。在这些早期的窗口环境中，如果你拖动或者缩放一个窗口，那么将显示变化后的窗口边界，这些用来预览的边界用快速的位图反转方式绘制。当你放开鼠标的时候才会触发窗口的重绘事件。
>
> 现代的X中，窗口管理器与窗口合成器往往是一体的，如：`KWin`既是窗口管理器又是合成器。

> **X合成器的缺陷**
>
> 1. 渲染效率低。应用程序向X server请求渲染，然后再通过合成器进行合成。（`X Client <-> X Server <-> Compositor`）
> 2. 大部分X合成器没有重定向输入事件(因为处理输入事件过于复杂且X server本身也会处理事件输入及事件分发)，一些特殊效果无法实现。具体的实现方式就是通过`XFixes`扩展提供的`SetWindowShapeRegion API`将`OverlayWindow`的输入区域`ShapeInput`设为空区域，从而忽略对这个`OverlayWindow`的一切鼠标键盘事件。这样一来对`OverlayWindow`的点击会透过`OverlayWindow`直接作用到底下的窗口上。
>
> Wayland 的开发者在`the real story behind Wayland and X`里这么说：and what's the X server? really bad IPC. https://people.freedesktop.org/~daniels/lca2013-wayland-x11.pdf

![image-20240201193626064](assets/Linux%20%E5%9B%BE%E5%BD%A2%E4%BD%93%E7%B3%BB%E6%A6%82%E8%BF%B0%20&%20Wayland%20%E5%8D%8F%E8%AE%AE/image-20240201193626064.jpg)

**X(序号代表从输入设备接收事件到屏幕发生变化的整个流程)**

1. 内核从输入设备接收事件，并通过 evdev 输入驱动程序将其发送到 X 服务器。在此过程中，内核负责驱动设备，并将不同设备的特定的事件协议转换为 Linux evdev 输入的标准事件。
2. X 服务器确定该事件会影响到哪个窗口，并将其发送给对应的客户端。但是，X 服务器并不能确认得到的窗口是否准确，因为窗口在屏幕上的位置由合成器控制，且可能以多种方式进行变换（缩小、旋转、抖动等），而 X 服务器不知道这些变换。
3. 客户端接收并处理事件。通常，UI 会对事件作出响应并向 X 服务器发送一个渲染请求。
4. 当 X 服务器接收到渲染请求时，会请求驱动程序控制硬件执行渲染。同时 X 服务器会计算渲染的边界区域，并将这些信息作为损坏事件发送给合成器。
5. 合成器收到损坏事件之后，需要重新合成该窗口所在的屏幕部分。最终，合成器会根据其场景图及所有的窗口合成出整个屏幕的内容。然后，它必须通过 X 服务器进行渲染。
6. X 服务器接收来自合成器的渲染请求，并将合成器的后备缓冲区复制到前置缓冲区或执行页面翻转。在这一步中，X 服务器还会做一些额外的处理，如：窗口的重叠判断、被覆盖窗口的剪载计算等等。然而，对于合成器来说，它总是全屏，这是完全不必要的开销。

![image-20240201193635034](assets/Linux%20%E5%9B%BE%E5%BD%A2%E4%BD%93%E7%B3%BB%E6%A6%82%E8%BF%B0%20&%20Wayland%20%E5%8D%8F%E8%AE%AE/image-20240201193635034.jpg)

**Wayland(序号代表从输入设备接收事件到屏幕发生变化的整个流程)**

1. 内核接收事件并将其发送到合成器。这类似于 X 的情况。
2. 合成器通过其场景图查找应接收事件的窗口。与X 服务器不同的是，合成器可以选择正确的窗口并通过应用逆变换将屏幕坐标转换为窗口本地坐标。
3. 与 X 情况类似，当客户端接收到事件时，它会响应地更新 UI。但是，在 Wayland 下，渲染发生在客户端中，客户端只需向合成器发送一个请求，指示需要更新的区域即可。
4. 合成器从其客户端收集损坏请求，然后重新合成屏幕。合成器可以直接向 KMS 发出 ioctl 以安排页面翻转。

> KMS & DRM
>
> ![image-20240201193734660](assets/Linux%20%E5%9B%BE%E5%BD%A2%E4%BD%93%E7%B3%BB%E6%A6%82%E8%BF%B0%20&%20Wayland%20%E5%8D%8F%E8%AE%AE/image-20240201193734660.jpg)
>
> ```
> DRM`从模块上划分，可以简单分为3部分：`libdrm`、`KMS`、`GEM
> ```
>
> `KMS`，Kernel Mode Setting，所谓Mode setting，其实说白了就两件事：**更新画面**和**设置显示参数**。
>
> **更新画面**：显示buffer的切换，多图层的合成方式，以及每个图层的显示位置。
>
> **设置显示参数**：包括分辨率、刷新率、电源状态（休眠唤醒）等。
>
> **KMS****的背景**
>
>  在没有KMS支持的时候，设定显卡显示模式是 X 服务器的工作（显卡想要正确工作，必须设置正确的显示模式）。所以虚拟终端不可能提供漂亮的图像效果。同时，每次从X切换到虚拟终端时，x服务器必须将显卡的控制权交给内核，这个流程显得低效并且会导致闪烁。将控制权切回到X服务器同样是一个“痛苦”的过程。
>
>  使用内核模式设置后，内核可以设定显卡的模式。这样开机启动即可看到漂亮的显示画面，在 X 图形界面 和 终端 之间也可以快速切换，还有其他的一些优点。

## Wayland 图形系统架构图

![image-20240201193739943](assets/Linux%20%E5%9B%BE%E5%BD%A2%E4%BD%93%E7%B3%BB%E6%A6%82%E8%BF%B0%20&%20Wayland%20%E5%8D%8F%E8%AE%AE/image-20240201193739943.jpg)

该架构图在上节中的Wayland架构图中补充完善了一些细节。

> `EGL`、`OpenGL`、`OpenGL ES`概念辨析
>
> `OpenGL`是一个跨平台的图形渲染API，它提供了一系列的函数和数据类型，使得开发人员可以利用图形硬件来实现高性能的图形渲染。`OpenGL`支持`2D`和`3D`图形渲染，并且可以在各种操作系统、硬件和编程语言中使用。
>
> `OpenGL ES`是`OpenGL`的子集，它专门为嵌入式系统和移动设备设计，可以支持低功耗、低内存和小型设备。与`OpenGL`相比，`OpenGL ES`省略了一些不常用的功能，并且采用了一些针对嵌入式设备的优化。
>
> `EGL`是一个跨平台的图形显示抽象层，它提供了一系列的API，使得应用程序可以与底层的图形系统交互。它的主要作用是提供了一个标准的接口，使得应用程序可以在不同的硬件平台上使用相同的代码进行图形渲染。
>
> `OpenGL`、`OpenGL ES`的平台无关性正是借助`EGL`实现的，`EGL`屏蔽了不同平台的差异。
>
> ![image-20240201193743894](assets/Linux%20%E5%9B%BE%E5%BD%A2%E4%BD%93%E7%B3%BB%E6%A6%82%E8%BF%B0%20&%20Wayland%20%E5%8D%8F%E8%AE%AE/image-20240201193743894.jpg)

# Wayland 协议

在线阅读Wayland协议文档地址：https://wayland.app/protocols/

以下两节内容摘自 https://wayland-book.com/

## Wayland 软件包

Wayland 软件包包括如下几部分(此包代表了 Wayland 协议最主流的实现，但它不是唯一选择):

- libwayland
  - libwayland-client 和 libwayland-server 这两个库包含了一个 wire 协议的双端通信实现。
  - libwayland 同时提供一些常用工具函数，用于处理 Wayland 数据结构、简易事件循环等。
  - 此外，libwayland 还包含一份使用 wayland-scanner 生成的 Wayland 核心协议的预编译副本。
- wayland.xml
  - Wayland 协议通过 XML 文件进行定义，wayland.xml是 Wayland 核心协议 XML 规范。
- wayland-scanner
  - wayland-scanner 工具能够处理上述 XML 文件并生成对应代码。 可以由 wayland.xml 之类的文件生成 C 语言的头文件和上下文胶水代码。也有其他语言对应的 scanner，如 wayland-rs (Rust)、waymonad-scanner (Haskell) 等。

## 协议设计

Wayland 协议由多层抽象结构组成。 它从一个基本的 Wire 协议格式开始（该格式可以用事先约定的接口解码信息流），然后用更高层次的程序枚举接口、创建符合这些接口的资源、交换相关信息，这便是 Wayland 协议及其扩展协议的内容。

### 基础类型

Wire 协议是由 32 位值所组成的流，使用当前机器的字节顺序进行编码（例如 x86 系列 CPU 上的小端序）。 其中包含以下几种基础类型：

- `int uint`
  -  32 位 有符号及无符号整型
- `fixed`
  -  24 位整数 + 8 位小数 有符号浮点数

- `object`
  -  32 位 对象 ID
- `new_id`
  -  32 位 对象 ID（收到对象时需要分配）

除了上述基础类型之外，还有一些常用的类型：

- `string`
  -  字符串以 32 位整数开头，这个整数表示字符串的长度（以字节为单位）， 接下来是字符串的内容和 NUL 终结符，最后用未定义数据对齐填充 32 位。 编码没有指定，但是实际使用 UTF-8。
- `array`
  -  任意数据的二进制块，以 32 位整数开头，指定块长度（以字节为单位）， 然后是数组的逐字内容，最后用未定义数据对齐 32 位。

- `fd`
  -  主传输上的 0 位值，在 Unix Socket 消息（msg_control）中使用辅助数据，将文件描述符从一端传输到另一端。
- `enum`
  -  一个单独的值（或 bitmap），用于已知常量的枚举，编码为 32 位整型。

### 消息

Wire 协议是使用这些原语构建而成的消息流。 每条消息都代表着某个对象 object 相关的一次 event 事件（服务端到客户端）或 request 请求 （客户端到服务端）。

消息头由两个字段组成。 第一个字段是**操作的对象 ID**。 第二个字段是两个 16 位值：高 16 位是这条**消息的大小**（包括头本身），低 16 位是这次事件或请求的**操作码**。 接下来是**基于双方事先约定的消息签名的消息参数**。 接收方会查找对象 ID 的接口、事件或请求的操作码，以确认消息的签名和属性。

为了解析一条消息，客户端和服务端**必须先创建对象**。 **ID 1 预分配给了** **Wayland** **显示****单例****对象**，它被用于**引导产生其它对象**。

### 对象 ID

当`new_id`参数随某条消息而来，发送者会给它分配一个对象 ID （新对象的接口通过其它额外的参数传递，或事先双方约定）。 此对象 ID 能在后续的消息头或者其它对象的参数中使用。 客户端在 [1, 0xFEFFFFFF] 而服务端在 [0xFF000000, 0xFFFFFFFF] 内分配 ID。 ID 从低位边界开始，并随每次新对象的分配递增。

对象的 ID 为 0 代表 null 空对象，即不存在或者空缺。

### 传输

迄今为止，所有的 Wayland 实现均通过 Unix Socket 工作。 这有个很特别的原因：文件描述符消息。 Unix Socket 是最实用的跨进程文件描述符传输方法，它对大文件传输（如键盘映射、像素缓冲区、剪切板）非常必要。 理论上其它传输协议（如 TCP）可行，但是需要开发者实现大文件传输的替代方案。

libwayland 查找 Unix Socket 流程如下：

1. 如果 `WAYLAND_SOCKET` 已设置，则假设父进程已经为我们配置了连接，将 `WAYLAND_SOCKET` 解析为文件描述符。
2. 如果 `WAYLAND_DISPLAY` 已设置，则与 `XDG_RUNTIME_DIR` 路径连接，尝试建立 Unix Socket。
3. 假设 `Socket` 名称为 `wayland-0` 并连接 `XDG_RUNTIME_DIR` 为路径，尝试建立 Unix Socket。
4. 失败放弃。

## App 显示流程

下面我们将以一个简单的例子来看下想通过Wayland协议显示一个黑框框，我们需要怎么做。

程序来自：https://github.com/bugaevc/writing-wayland-clients

```C++
#include <stdio.h>
#include <string.h>

#include <syscall.h>
#include <unistd.h>
#include <sys/mman.h>

#include <wayland-client.h>

struct wl_compositor *compositor;
struct wl_shm *shm;
struct wl_shell *shell;

void registry_global_handler
(
    void *data,
    struct wl_registry *registry,
    uint32_t name,
    const char *interface,
    uint32_t version
) {
    if (strcmp(interface, "wl_compositor") == 0) {
        compositor = wl_registry_bind(registry, name,
            &wl_compositor_interface, 3);
    } else if (strcmp(interface, "wl_shm") == 0) {
        shm = wl_registry_bind(registry, name,
            &wl_shm_interface, 1);
    } else if (strcmp(interface, "wl_shell") == 0) {
        shell = wl_registry_bind(registry, name,
            &wl_shell_interface, 1);
    }
}

void registry_global_remove_handler
(
    void *data,
    struct wl_registry *registry,
    uint32_t name
) {}

const struct wl_registry_listener registry_listener = {
    .global = registry_global_handler,
    .global_remove = registry_global_remove_handler
};

int main(void)
{
    struct wl_display *display = wl_display_connect(NULL);
    struct wl_registry *registry = wl_display_get_registry(display);
    wl_registry_add_listener(registry, &registry_listener, NULL);

    // wait for the "initial" set of globals to appear
    wl_display_roundtrip(display);

    struct wl_surface *surface = wl_compositor_create_surface(compositor);
    struct wl_shell_surface *shell_surface = wl_shell_get_shell_surface(shell, surface);
    wl_shell_surface_set_toplevel(shell_surface);

    int width = 200;
    int height = 200;
    int stride = width * 4;
    int size = stride * height;  // bytes

    // open an anonymous file and write some zero bytes to it
    int fd = syscall(SYS_memfd_create, "buffer", 0);
    ftruncate(fd, size);

    // map it to the memory
    unsigned char *data = mmap(NULL, size, PROT_READ | PROT_WRITE, MAP_SHARED, fd, 0);

    // turn it into a shared memory pool
    struct wl_shm_pool *pool = wl_shm_create_pool(shm, fd, size);

    // allocate the buffer in that pool
    struct wl_buffer *buffer = wl_shm_pool_create_buffer(pool,
        0, width, height, stride, WL_SHM_FORMAT_XRGB8888);

    wl_surface_attach(surface, buffer, 0, 0);
    wl_surface_commit(surface);

    while (1) {
        wl_display_dispatch(display);
    }
}
```

我们可以使用如下命令编译运行该程序

```Bash
curl -O https://cgit.freedesktop.org/wayland/wayland-protocols/plain/unstable/xdg-shell/xdg-shell-unstable-v6.xml
wayland-scanner client-header xdg-shell-unstable-v6.xml xdg-shell.h
wayland-scanner code xdg-shell-unstable-v6.xml xdg-shell.c
gcc main.c xdg-shell.c -l wayland-client -l wayland-cursor -o runme
./runme
```

程序运行显示如下黑框(灰色部分是背景，与程序无关)

![image-20240201193755425](assets/Linux%20%E5%9B%BE%E5%BD%A2%E4%BD%93%E7%B3%BB%E6%A6%82%E8%BF%B0%20&%20Wayland%20%E5%8D%8F%E8%AE%AE/image-20240201193755425.jpg)

我们可以使用`WAYLAND_DEBUG=1 ./runme`开启`libwayland`的`Debug`输出

```Bash
$ WAYLAND_DEBUG=1 ./runme
[1610518.311]  -> wl_display@1.get_registry(new id wl_registry@2)
[1610518.358]  -> wl_display@1.sync(new id wl_callback@3)
[1610518.488] wl_display@1.delete_id(3)
[1610518.502] wl_registry@2.global(1, "wl_drm", 2)
[1610518.511] wl_registry@2.global(2, "wl_compositor", 3)
[1610518.521]  -> wl_registry@2.bind(2, "wl_compositor", 3, new id [unknown]@4)
[1610518.536] wl_registry@2.global(3, "wl_shm", 1)
[1610518.545]  -> wl_registry@2.bind(3, "wl_shm", 1, new id [unknown]@5)
[1610518.555] wl_registry@2.global(4, "wl_output", 2)
[1610518.563] wl_registry@2.global(5, "wl_output", 2)
[1610518.570] wl_registry@2.global(6, "wl_data_device_manager", 3)
[1610518.586] wl_registry@2.global(7, "gtk_primary_selection_device_manager", 1)
[1610518.604] wl_registry@2.global(8, "zxdg_shell_v6", 1)
[1610518.612] wl_registry@2.global(9, "wl_shell", 1)
[1610518.631]  -> wl_registry@2.bind(9, "wl_shell", 1, new id [unknown]@6)
[1610518.652] wl_registry@2.global(10, "gtk_shell1", 1)
[1610518.658] wl_registry@2.global(11, "wl_subcompositor", 1)
[1610518.676] wl_registry@2.global(12, "zwp_pointer_gestures_v1", 1)
[1610518.694] wl_registry@2.global(13, "zwp_tablet_manager_v2", 1)
[1610518.718] wl_registry@2.global(14, "wl_seat", 5)
[1610518.728] wl_registry@2.global(15, "zwp_relative_pointer_manager_v1", 1)
[1610518.737] wl_registry@2.global(16, "zwp_pointer_constraints_v1", 1)
[1610518.745] wl_registry@2.global(17, "zxdg_exporter_v1", 1)
[1610518.755] wl_registry@2.global(18, "zxdg_importer_v1", 1)
[1610518.763] wl_callback@3.done(16657)
[1610518.769]  -> wl_compositor@4.create_surface(new id wl_surface@3)
[1610518.775]  -> wl_shell@6.get_shell_surface(new id wl_shell_surface@7, wl_surface@3)
[1610518.784]  -> wl_shell_surface@7.set_toplevel()
[1610518.805]  -> wl_shm@5.create_pool(new id wl_shm_pool@8, fd 5, 160000)
[1610518.818]  -> wl_shm_pool@8.create_buffer(new id wl_buffer@9, 0, 200, 200, 800, 1)
[1610518.835]  -> wl_surface@3.attach(wl_buffer@9, 0, 0)
[1610518.844]  -> wl_surface@3.commit()
^C
```

结合上述信息我们可以得到Wayland下显示一个黑框框的步骤如下：

![img](assets/Linux%20%E5%9B%BE%E5%BD%A2%E4%BD%93%E7%B3%BB%E6%A6%82%E8%BF%B0%20&%20Wayland%20%E5%8D%8F%E8%AE%AE/plantuml-0.svg)

注意，Wayland Debug展示的信息是在调用时打印，而不是在发送的时候打印。Wayland异步的机制允许暂存许多方法调用然后在我们完成所有的调用后等待回应的时候一次性的将请求一起发出去。

我们使用`strace`命令来跟踪系统的`socket`调用，得到如下结果：

```Bash
$ strace -e trace=network ./runme
socket(AF_UNIX, SOCK_STREAM|SOCK_CLOEXEC, 0) = 3
connect(3, {sa_family=AF_UNIX, sun_path="/run/user/1000/wayland-0"}, 27) = 0
sendmsg(3, {msg_name=NULL, msg_namelen=0, msg_iov=[{iov_base="\1\0\0\0\1\0\f\0\2\0\0\0\1\0\0\0\0\0\f\0\3\0\0\0", iov_len=24}], msg_iovlen=1, msg_controllen=0, msg_flags=0}, MSG_DONTWAIT|MSG_NOSIGNAL) = 24
recvmsg(3, {msg_name=NULL, msg_namelen=0, msg_iov=[{iov_base="\2\0\0\0\0\0\34\0\1\0\0\0\7\0\0\0wl_drm\0\0\2\0\0\0\2\0\0\0"..., iov_len=4096}], msg_iovlen=1, msg_controllen=0, msg_flags=MSG_CMSG_CLOEXEC}, MSG_DONTWAIT|MSG_CMSG_CLOEXEC) = 720
sendmsg(3, {msg_name=NULL, msg_namelen=0, msg_iov=[{iov_base="\2\0\0\0\0\0(\0\2\0\0\0\16\0\0\0wl_compositor\0\0\0"..., iov_len=220}], msg_iovlen=1, msg_control=[{cmsg_len=20, cmsg_level=SOL_SOCKET, cmsg_type=SCM_RIGHTS, cmsg_data=[5]}], msg_controllen=20, msg_flags=0}, MSG_DONTWAIT|MSG_NOSIGNAL) = 220
recvmsg(3, {msg_name=NULL, msg_namelen=0, msg_iov=[{iov_base="\5\0\0\0\0\0\f\0\0\0\0\0\5\0\0\0\0\0\f\0\1\0\0\0\t\0\0\0\0\0\10\0", iov_len=3376}, {iov_base="", iov_len=720}], msg_iovlen=2, msg_controllen=0, msg_flags=MSG_CMSG_CLOEXEC}, MSG_DONTWAIT|MSG_CMSG_CLOEXEC) = 32
recvmsg(3, {msg_name=NULL, msg_namelen=0, msg_iov=[{iov_base="\7\0\0\0\1\0\24\0\0\0\0\0\310\0\0\0\310\0\0\0", iov_len=3344}, {iov_base="", iov_len=752}], msg_iovlen=2, msg_controllen=0, msg_flags=MSG_CMSG_CLOEXEC}, MSG_DONTWAIT|MSG_CMSG_CLOEXEC) = 20
^C
```

我们可以看到我们的程序创建了一个新的Unix domain socket，连接到 `/run/user/1000/wayland-0`，然后发送初始消息（该消息编码了 `wl_display.get_registry` 和 `wl_display.sync` 请求）。然后它等待回应（因为我们用了`wl_display_roundtrip()`调用）。管理器用`wl_registry.global`, `wl_display.delete_id` 和 `wl_callback.done` 事件回应，全部都在一个消息中。这是我们第一个往返开销。

之后我们的程序发送一个编码了所有剩余请求的消息，三次`wl_registry.bind`调用。

创建完窗口之后，还有两个从管理器发过来的消息没有显示出来，那是因为我们没有设置相应的监听器。

所以实际上要显示一个Wayland窗口只需要**一个半的往返开销** 。

# 参考链接：

- https://en.wikipedia.org/wiki/Free_and_open-source_graphics_device_driver
- https://www.cnblogs.com/shoemaker/p/linux_graphics01.html
- https://toulibre.org/pub/2012-11-24-capitole-du-libre/slides/peres-gpu-details.pdf
- https://zh.wikipedia.org/zh-cn/%E5%B8%A7%E7%BC%93%E5%86%B2%E5%99%A8
- https://en.wikipedia.org/wiki/Video_display_controller
- https://itsfoss.com/what-is-linux/
- https://itsfoss.com/display-server/
- https://itsfoss.com/what-is-linux-distribution/
- https://itsfoss.com/best-window-managers/
- https://www.zhihu.com/question/21711307/answer/2231006377
- https://segmentfault.com/a/1190000016129862
- https://z.itpub.net/article/detail/67EC176F9595BCDCAC260EB8C1661F3F
- https://wayland.freedesktop.org/architecture.html
- https://cloud.tencent.com/developer/article/1442279
- https://cloud.tencent.com/developer/article/1442281
- https://en.wikipedia.org/wiki/Direct_Rendering_Manager
- https://blog.csdn.net/hexiaolong2009/article/details/83720940
- https://zhuanlan.zhihu.com/p/74006499
- https://farseerfc.me/zhs/brief-history-of-compositors-in-desktop-os.html
- https://farseerfc.me/zhs/compositor-in-X-and-compositext.html
- https://wayland-book.com/
- https://bugaevc.gitbooks.io/writing-wayland-clients/content/