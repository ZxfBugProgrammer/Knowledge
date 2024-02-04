# Qt 事件循环
<br>

# Qt 中事件循环

Qt中的事件循环（又称消息队列）实际上就是对不同平台上的窗口消息进行了封装，并对上层应用保持透明。上层应用无需关心底层消息到底是X11消息还是Windows消息。Qt的信号槽机制也是依托于事件循环。

Qt中的事件循环与线程绑定，每一个线程拥有自己的QThreadData（并且所有该线程中的QObject均可访问该对象）。QThreadData中包括了事件循环的栈、事件循环栈的深度、事件分发器等数据。如下：

```C++
class QThreadData
{
public:
    QThreadData(int initialRefCount = 1);
    ~QThreadData();

    static Q_AUTOTEST_EXPORT QThreadData *current(bool createIfNecessary = true);
#ifdef Q_OS_WINRT
    static void setMainThread();
#endif
    static void clearCurrentThreadData();
    static QThreadData *get2(QThread *thread)
    { Q_ASSERT_X(thread != nullptr, "QThread", "internal error"); return thread->d_func()->data; }

    void ref();
    void deref();
    inline bool hasEventDispatcher() const
    { return eventDispatcher.loadRelaxed() != nullptr; }
    QAbstractEventDispatcher *createEventDispatcher();
    QAbstractEventDispatcher *ensureEventDispatcher();

    bool canWaitLocked();

private:
    QAtomicInt _ref;

public:
    int loopLevel;
    int scopeLevel;

    QStack<QEventLoop *> eventLoops;
    QPostEventList postEventList;
    QAtomicPointer<QThread> thread;
    QAtomicPointer<void> threadId;
    QAtomicPointer<QAbstractEventDispatcher> eventDispatcher;
    QVector<void *> tls;
    FlaggedDebugSignatures flaggedSignatures;

    bool quitNow;
    bool canWait;
    bool isAdopted;
    bool requiresCoreApplication;
};
```

![image-20240201202059959](assets/Qt%20%E4%BA%8B%E4%BB%B6%E5%BE%AA%E7%8E%AF/image-20240201202059959.png)

结合上述数据结构及Qt源码，可以发现Qt中的事件循环支持嵌套，当执行到QEvenLoop->exec时，当前事件循环被阻塞，由新的事件循环接管并处理事件。

详见：https://doc.qt.io/qt-5/threads-qobject.html

https://codebrowser.dev/qt5/qtbase/src/corelib/thread/qthread_p.h.html#QThreadData

---

# Qt 中拖拽

拖拽分为应用内拖拽与应用间拖拽两部分。应用内拖拽由应用自身实现，不涉及其他进程，不包含IPC通信。应用间拖拽需要依托窗口管理器的能力，并遵照相关协议传递数据。Qt中QDrag底层根据不同的窗管协议封装了不同的实现，并对上层应用保持透明。

当QDrag -> exec调用之后，调用QDrag -> exec的函数被阻塞住，QDrag内部会启动一个新的事件循环用来处理事件。所以UI可以继续响应用户的操作。拖拽图标的显示、上屏均由窗管负责，应用无法进行控制。