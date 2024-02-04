# Qt Qml Debug 小结
<br>

# 一、QML Debug & 性能分析

## QML Debug 工具 Gammaray

Gammaray是一款很好用的QML Debug工具，可以观察QML的层级，并动态调整QML中的属性，也可以查看QML中的事件、信号、数据model等。

### 安装

Apt源中包含Gammaray，但版本较低。

建议使用源码安装：

```Shell
git clone https://github.com/KDAB/GammaRay.git
cd GammaRay
sudo apt update
sudo apt install qtbase5-private-dev qtdeclarative5-private-dev
mkdir build
cd build
cmake ..
make
sudo make install
```

### 使用

有些OS关闭了`ptrace_scope`，导致`gammaray/gdb`无法`attach`，可以使用以下命令开启:

```Bash
echo 0 | sudo tee /proc/sys/kernel/yama/ptrace_scope
```

也可以使用Launch方式调试QML应用 （按需要填写参数）

具体使用方式略，根据UI操作即可。

## QML Profiler

QML Profiler是内置在Qt Creator中的QML性能分析工具

### 使用前准备

在需要调试的Target中，添加QT_QML_DEBUG宏，如下

```undefined
# ${MODULE_NAME}代表Target名
target_compile_definitions(${MODULE_NAME}
    PRIVATE $<$<OR:$<CONFIG:Debug>,$<CONFIG:RelWithDebInfo>>:QT_QML_DEBUG>)
```

### 使用

在Qt Creator中的Analyze选项卡中，选择QML Profiler

![image-20240201195407514](assets/Qt%20Qml%20Debug%20%E5%B0%8F%E7%BB%93/image-20240201195407514.jpg)

![image-20240201195403439](assets/Qt%20Qml%20Debug%20%E5%B0%8F%E7%BB%93/image-20240201195403439.jpg)

![image-20240201195411224](assets/Qt%20Qml%20Debug%20%E5%B0%8F%E7%BB%93/image-20240201195411224.jpg)

根据需要查看相关信息

![image-20240201195417536](assets/Qt%20Qml%20Debug%20%E5%B0%8F%E7%BB%93/image-20240201195417536.jpg)

## QML断点调试

qml debug原理可见官方文档[Debugging QML Applications | Qt 5.15](https://doc.qt.io/qt-5/qtquick-debugging.html)，具体使用方式如下

### 配置QT_QML_DEBUG宏

在需要调试的Target中，添加QT_QML_DEBUG宏，如下

```Plain
# ${MODULE_NAME}代表Target名
target_compile_definitions(${MODULE_NAME}
    PRIVATE $<$<OR:$<CONFIG:Debug>,$<CONFIG:RelWithDebInfo>>:QT_QML_DEBUG>)
```

### 设置Qt Creator

开始QML Debug（好像可以不设置）

- 在项目 - 构建设置中设置`QML debugging and profiling`为`Enable`。
- 在`Debugger settings`中勾选`Enable C++`和`Enable QML`。

配置完成之后即可在QML上打断点、调试。

# 二、Qt 源码 Debug

也可手动编译Qt源码。

## 下载 Qt 源码以及Debug信息

https://www.qt.io/download-open-source 目前Qt官网不再支持使用离线安装包，所以需要从官网下载在线安装包

![image-20240201195424117](assets/Qt%20Qml%20Debug%20%E5%B0%8F%E7%BB%93/image-20240201195424117.jpg)

```undefined
cd 下载目录
chmod +x qt-unified-linux-x64-4.4.1-online.run
sudo ./qt-unified-linux-x64-4.4.1-online.run

# 登录帐号后点击下一步
```

![image-20240201195427206](assets/Qt%20Qml%20Debug%20%E5%B0%8F%E7%BB%93/image-20240201195427206.jpg)

![image-20240201195430870](assets/Qt%20Qml%20Debug%20%E5%B0%8F%E7%BB%93/image-20240201195430870.jpg)

等待安装完成。安装完成后打开Qt Creator可以自动检测到新的工具链。

![image-20240201195434292](assets/Qt%20Qml%20Debug%20%E5%B0%8F%E7%BB%93/image-20240201195434292.jpg)

## 配置Qt Creator

在项目中启用下载的源码对应的构建套件。（执行 `Run CMake`）

在首选项中添加源码映射

![image-20240201195437448](assets/Qt%20Qml%20Debug%20%E5%B0%8F%E7%BB%93/image-20240201195437448.jpg)

此时进行调试即可看到Qt源码中的相关信息。

此外：为了在Qt Creator的底部搜索栏搜索Qt源码中的cpp，我们可以进行如下配置

![image-20240201195440923](assets/Qt%20Qml%20Debug%20%E5%B0%8F%E7%BB%93/image-20240201195440923.jpg)

![image-20240201195443429](assets/Qt%20Qml%20Debug%20%E5%B0%8F%E7%BB%93/image-20240201195443429.jpg)

即可搜索源码中的cpp文件

## 注意！！

在使用我们下载或编译的构建套件编译运行程序时，可能会提示缺少plugin等，这个时候需要我们手动从原始的Qt环境目录中建立软链接。

# 三、gdb 显示 Qt 类的值（可在 Clion 等 IDE 中生效）

默认使用gdb调试时，不能直接观察Qt中类的值，只能看到d-pointer的地址，如下：

![image-20240201195449075](assets/Qt%20Qml%20Debug%20%E5%B0%8F%E7%BB%93/image-20240201195449075.jpg)

因此，我们需要使用KDevelop中的gdb Printer，从

https://github.com/KDE/kdevelop/tree/master/plugins/gdb/printers 中下载：.gdbinit、helper.py、kde.py

、qt.py。 将helper.py、kde.py、qt.py拷贝到~/.gdb/kdeprinters/ 文件夹中，将.gdbinit拷贝到~目录中（注意不要忽略`.`），修改.gdbinit：

```undefined
python

import sys, os.path
sys.path.insert(0, os.path.expanduser('~/.gdb/kdeprinters/'))

from qt import register_qt_printers
register_qt_printers (None)

from kde import register_kde_printers
register_kde_printers (None)

end
```

但KDE的kdeprinters在调试包含自定义类指针的QMap会报错，需要修改qt.py中的

```undefined
node_type = gdb.lookup_type('QMapData<' + keytype.name + ',' + valtype.name + '>::Node')
```

为

```undefined
key_name = str(keytype) if keytype.name is None else keytype.name
val_name = str(valtype) if valtype.name is None else valtype.name
node_type = gdb.lookup_type('QMapData<' + key_name + ',' + val_name + '>::Node')
```

修改成功后可以看到效果如下：

![image-20240201195455483](assets/Qt%20Qml%20Debug%20%E5%B0%8F%E7%BB%93/image-20240201195455483.jpg)

# 四、QML 易踩坑点总结

- 在 Flickable 中直接声明的元素的 parent 不是 Flickable 本身
- 字体需要配置行高以保证在不同平台下显示的一致性，且行高设置过小也可能会出现问题。
- QSetting读取文本文件时，不能区分数字、bool和String，因此把QSetting返回的Qvariant直接传递给QML会导致解析出错，如用bool去返回值，会把“false”转化为bool值true。
- 包含动画的元素将visible设置为false并不会停止动画，仍会在后台不停的请求界面进行刷新

# 参考

[Debugging QML Applications | Qt 5.15](https://doc.qt.io/qt-5/qtquick-debugging.html)

https://blog.csdn.net/zcteo/article/details/123856295
