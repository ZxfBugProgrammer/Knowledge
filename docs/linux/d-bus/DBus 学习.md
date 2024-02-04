# D-Bus 学习
<br>

# 一、D-Bus 基础概念

D-Bus是一个免费/开源的进程间通信（IPC）机制，是freedesktop.org项目的一部分。它被广泛用于各种应用程序和其他freedesktop.org标准之上，如桌面通知、媒体播放器控制和XDG portals。

## 总线

D-Bus提供了多条消息总线。每条总线相互隔离，互不干扰。这允许将不同的安全策略应用于不同的总线，同时也允许全局和局部消息的有效共享。

D-Bus提供了两个预定义的总线，涵盖了绝大多数D-Bus的应用场景。

系统总线（System Bus）用于系统的全局服务，如硬件管理等。它在各个用户之间共享，通常带有严格的安全策略。

每个桌面会话（例如，每个登录的用户）都有一个会话总线。

此外，每个应用程序也可以创建任何数量的自己的总线。

## 消息

消息是总线上通信的基本单位。在总线上传递的所有信息都是以消息的形式进行。然而，与网络数据包不同的是，每个D-Bus消息都保证包含正在发送或接收的整个数据集。除了数据部分外，消息还记录了发送者和接收者的身份，以便进行适当的路由。

消息可以是方法调用、信号或方法返回值以及错误信息。

## 命名空间和地址 

由于同一总线上可能会有多个应用程序，并且同一个应用程序也可能会提供多个对象。因此需要一种方式来唯一标识给定总线上的给定对象。在D-Bus的体系中，使用服务、对象名称以及接口的组合来进行唯一标识。

### 服务（Services）

服务代表应用程序与总线的连接。这里的服务对应于D-Bus规范术语中的“总线名称"。总线名称是总线上的**连接**的名称，而不是**总线**的名称。D-Bus服务一般通过使用"反向域名"的命名方式来确保唯一性。大多数KDE的应用程序提供的服务使用`org.kde`作为服务名称的前缀。eg: `org.kde.screensaver`。

如果一个应用程序在总线上有多个链接，或者应用程序可能会运行多个实例，那么需要为每个连接使用不同的唯一的服务名称。通常可以通过将进程ID附加到服务名称中来实现。

### 对象（Objects）

一个应用程序可能会在总线上注册一个以上的对象。每个路径代表了一个唯一的对象。例如: `/MainInterface`或`/Documents/Doc1`。实际上，路径的结构可以是完全任意的。路径的存在只是为了给发送消息的应用程序提供一种识别和分组对象的方法。

对象提供对接口的访问。一个特定的对象可以同时提供对多个接口的访问。

### 接口（Interfaces）

接口是一组在总线上公布的可调用的方法和信号。接口定义了方法的名称、参数（如果有）和返回值（如果有）。

### Putting it all together

一个D-Bus消息包含一个由上述所有组件组成的地址

```C++
org.kde.krunner /App org.kde.krunner.App.display
```

`org.kde.krunner`是服务，`/App`是对象的路径，`org.kde.krunner.App`是对象输出的接口，`display`是接口中的一个方法。如果`/App`对象只提供`org.kde.krunner.App`接口（或者`display`方法在该服务中是唯一的），那么如下写法也可以作为地址：

```C++
org.kde.krunner /App display
```

## 调用与被调用

### 方法

方法是一次远程调用。如果该方法不可用，那么将向调用方法的应用程序返回一个错误Message。如果该方法被成功调用，一个可选的返回值将被返回给调用的应用程序。即使方法没有提供返回值，也将返回一个成功信息。这个往返过程有一定的开销，对于需要关注性能的代码来说（一般来说是嵌入式程序等等），务必要注意这一点。

方法调用是由调用方法的应用程序发起的包含了源地址和目标地址信息的消息。

### 信号

信号类似方法调用，但它们发生的方向不同（方法调用是服务使用者发起，信号是服务提供者发起），并且不与单一的目的地址相联系。信号对同一总线上的任何应用程序来说均是可见的。

## 有用的工具

在学习D-Bus总线以及开发使用D-Bus的应用程序时，有几个的工具对我们很有帮助。

- `qdbus`
- `qdbusviewer`
- `d-feet`
- `dbus-monitor`
- `dbus-send`

**警告**

谨慎使用`QDBusInterface`。因为它会在应用程序启动时使用阻塞的D-Bus方法调用将D-Bus相关方法、信号添加到自己的元对象系统中，对应用程序的启动时间有很大影响！

注：Qt部分源码如下

![image-20240201174227213](assets/DBus%20%E5%AD%A6%E4%B9%A0/image-20240201174227213.jpg)

![image-20240201174232130](assets/DBus%20%E5%AD%A6%E4%B9%A0/image-20240201174232130.jpg)

详见 [KDE D-Bus 文档翻译 ](./KDE%20D-Bus%20%E6%96%87%E6%A1%A3%E7%BF%BB%E8%AF%91) 

# 二、D-Bus 浅析

## D-Bus 体系结构

一般认为D-Bus具有以下几层

- `libdbus`库，提供给各个应用程序调用，使应用程序具有通信和数据交换的能力，两个应用程序可以通过该库使用`socket`进行通信。
- `D-Bus Daemon`，在`libdbus`的基础上创建，可以管理多个应用程序之间的通信。每个应用程序都和`D-Bus Daemon`建立D-Bus的链接，然后由`D-Bus Daemon`进行消息的分派。
- 各种封装库，有`libdbus-glib`，`libdbus-qt`等等，目的是将D-Bus的底层api进行封装。

![image-20240201174328764](assets/DBus%20%E5%AD%A6%E4%B9%A0/image-20240201174328764.jpg)

## libdbus 使用方式

在官方文档中有这样一句话：

![92e5bf62-c51f-4e67-a09d-d8b2ce34d30a](assets/DBus%20%E5%AD%A6%E4%B9%A0/92e5bf62-c51f-4e67-a09d-d8b2ce34d30a.jpeg)

[stuff/dbus-example.c at master · wware/stuff](https://github.com/wware/stuff/blob/master/dbus-example/dbus-example.c)

- Calling a Method

```C++
/**
 * Call a method on a remote object
 */
void query(char* param)
{
   DBusMessage* msg;
   DBusMessageIter args;
   DBusConnection* conn;
   DBusError err;
   DBusPendingCall* pending;
   int ret;
   bool stat;
   dbus_uint32_t level;

   printf("Calling remote method with %s\n", param);

   // initialiset the errors
   dbus_error_init(&err);

   // connect to the system bus and check for errors
   conn = dbus_bus_get(DBUS_BUS_SESSION, &err);
   if (dbus_error_is_set(&err)) {
      fprintf(stderr, "Connection Error (%s)\n", err.message);
      dbus_error_free(&err);
   }
   if (NULL == conn) {
      exit(1);
   }

   // request our name on the bus
   ret = dbus_bus_request_name(conn, "test.method.caller", DBUS_NAME_FLAG_REPLACE_EXISTING , &err);
   if (dbus_error_is_set(&err)) {
      fprintf(stderr, "Name Error (%s)\n", err.message);
      dbus_error_free(&err);
   }
   if (DBUS_REQUEST_NAME_REPLY_PRIMARY_OWNER != ret) {
      exit(1);
   }

   // create a new method call and check for errors
   msg = dbus_message_new_method_call("test.method.server", // target for the method call
                                      "/test/method/Object", // object to call on
                                      "test.method.Type", // interface to call on
                                      "Method"); // method name
   if (NULL == msg) {
      fprintf(stderr, "Message Null\n");
      exit(1);
   }

   // append arguments
   dbus_message_iter_init_append(msg, &args);
   if (!dbus_message_iter_append_basic(&args, DBUS_TYPE_STRING, &param)) {
      fprintf(stderr, "Out Of Memory!\n");
      exit(1);
   }

   // send message and get a handle for a reply
   if (!dbus_connection_send_with_reply (conn, msg, &pending, -1)) { // -1 is default timeout
      fprintf(stderr, "Out Of Memory!\n");
      exit(1);
   }
   if (NULL == pending) {
      fprintf(stderr, "Pending Call Null\n");
      exit(1);
   }
   dbus_connection_flush(conn);

   printf("Request Sent\n");

   // free message
   dbus_message_unref(msg);

   // block until we recieve a reply
   dbus_pending_call_block(pending);

   // get the reply message
   msg = dbus_pending_call_steal_reply(pending);
   if (NULL == msg) {
      fprintf(stderr, "Reply Null\n");
      exit(1);
   }
   // free the pending message handle
   dbus_pending_call_unref(pending);

   // read the parameters
   if (!dbus_message_iter_init(msg, &args))
      fprintf(stderr, "Message has no arguments!\n");
   else if (DBUS_TYPE_BOOLEAN != dbus_message_iter_get_arg_type(&args))
      fprintf(stderr, "Argument is not boolean!\n");
   else
      dbus_message_iter_get_basic(&args, &stat);

   if (!dbus_message_iter_next(&args))
      fprintf(stderr, "Message has too few arguments!\n");
   else if (DBUS_TYPE_UINT32 != dbus_message_iter_get_arg_type(&args))
      fprintf(stderr, "Argument is not int!\n");
   else
      dbus_message_iter_get_basic(&args, &level);

   printf("Got Reply: %d, %d\n", stat, level);

   // free reply
   dbus_message_unref(msg);
}
```

- Receiving a Signal

```C++
/**
 * Listens for signals on the bus
 */
void receive()
{
   DBusMessage* msg;
   DBusMessageIter args;
   DBusConnection* conn;
   DBusError err;
   int ret;
   char* sigvalue;

   printf("Listening for signals\n");

   // initialise the errors
   dbus_error_init(&err);

   // connect to the bus and check for errors
   conn = dbus_bus_get(DBUS_BUS_SESSION, &err);
   if (dbus_error_is_set(&err)) {
      fprintf(stderr, "Connection Error (%s)\n", err.message);
      dbus_error_free(&err);
   }
   if (NULL == conn) {
      exit(1);
   }

   // request our name on the bus and check for errors
   ret = dbus_bus_request_name(conn, "test.signal.sink", DBUS_NAME_FLAG_REPLACE_EXISTING , &err);
   if (dbus_error_is_set(&err)) {
      fprintf(stderr, "Name Error (%s)\n", err.message);
      dbus_error_free(&err);
   }
   if (DBUS_REQUEST_NAME_REPLY_PRIMARY_OWNER != ret) {
      exit(1);
   }

   // add a rule for which messages we want to see
   dbus_bus_add_match(conn, "type='signal',interface='test.signal.Type'", &err); // see signals from the given interface
   dbus_connection_flush(conn);
   if (dbus_error_is_set(&err)) {
      fprintf(stderr, "Match Error (%s)\n", err.message);
      exit(1);
   }
   printf("Match rule sent\n");

   // loop listening for signals being emmitted
   while (true) {

      // non blocking read of the next available message
      dbus_connection_read_write(conn, 0);
      msg = dbus_connection_pop_message(conn);

      // loop again if we haven't read a message
      if (NULL == msg) {
         usleep(10000);
         continue;
      }

      // check if the message is a signal from the correct interface and with the correct name
      if (dbus_message_is_signal(msg, "test.signal.Type", "Test")) {

         // read the parameters
         if (!dbus_message_iter_init(msg, &args))
            fprintf(stderr, "Message Has No Parameters\n");
         else if (DBUS_TYPE_STRING != dbus_message_iter_get_arg_type(&args))
            fprintf(stderr, "Argument is not string!\n");
         else
            dbus_message_iter_get_basic(&args, &sigvalue);

         printf("Got Signal with value %s\n", sigvalue);
      }

      // free the message
      dbus_message_unref(msg);
   }
}
```

- Exposing a Method to be called

```C++
// loop, testing for new messages
while (true) {// non blocking read of the next available message
    dbus_connection_read_write(conn, 0);
    msg = dbus_connection_pop_message(conn);
    // loop again if we haven't got a message
    if (NULL == msg) { 
        sleep(1); 
        continue; 
    }// check this is a method call for the right interface and method
    if (dbus_message_is_method_call(msg, "test.method.Type", "Method"))
    reply_to_method_call(msg, conn);
    // free the message
    dbus_message_unref(msg);
}
void reply_to_method_call(DBusMessage* msg, DBusConnection* conn)
{
    DBusMessage* reply;
    DBusMessageIter args;
    DBusConnection* conn;
    bool stat = true;
    dbus_uint32_t level = 21614;
    dbus_uint32_t serial = 0;
    char* param = "";
    
    // read the arguments
    if (!dbus_message_iter_init(msg, &args))
        fprintf(stderr, "Message has no arguments!\n"); 
    else if (DBUS_TYPE_STRING != dbus_message_iter_get_arg_type(&args)) 
        fprintf(stderr, "Argument is not string!\n"); 
    else 
        dbus_message_iter_get_basic(&args, &param);
    printf("Method called with %s\n", param);
    
    // create a reply from the message
    reply = dbus_message_new_method_return(msg);
    
    // add the arguments to the reply
    dbus_message_iter_init_append(reply, &args);
    if (!dbus_message_iter_append_basic(&args, DBUS_TYPE_BOOLEAN, &stat)) { 
        fprintf(stderr, "Out Of Memory!\n"); 
        exit(1);
    }
    if (!dbus_message_iter_append_basic(&args, DBUS_TYPE_UINT32, &level)) { 
        fprintf(stderr, "Out Of Memory!\n"); 
        exit(1);
    }
    
    // send the reply && flush the connection
    if (!dbus_connection_send(conn, reply, &serial)) { 
        fprintf(stderr, "Out Of Memory!\n"); 
        exit(1);
    }
    dbus_connection_flush(conn);
    
    // free the reply
    dbus_message_unref(reply);
}
```

![image-20240201174340157](assets/DBus%20%E5%AD%A6%E4%B9%A0/image-20240201174340157.jpg)

![image-20240201174344944](assets/DBus%20%E5%AD%A6%E4%B9%A0/image-20240201174344944.jpg)

Qt D-Bus Delay Reply: https://doc.qt.io/qt-5/qdbusmessage.html#setDelayedReply

## d-feet 获取 Interface 数据原理

![image-20240201174348682](assets/DBus%20%E5%AD%A6%E4%B9%A0/image-20240201174348682.jpg)

![image-20240201174353247](assets/DBus%20%E5%AD%A6%E4%B9%A0/image-20240201174353247.jpg)

可以看到，对于每一个`path`，d-feet都会去调用`org. freedesktop.DBus.Introspectable` 接口下的`Introspect`方法去获取XML，从而解析数据进行展示。

## D-Bus Marshalling

D-Bus类型系统

![image-20240201174402318](assets/DBus%20%E5%AD%A6%E4%B9%A0/image-20240201174402318.jpg)

D-Bus为它的类型系统定义了一套自己的编码格式。该编码格式被应用于D-Bus Message中。

### Byte order 和 Alignment

所有D-Bus类型处理`Byte order`和`Alignment`的方式都是一致的。给定一个类型签名，一个数据块就可以被转化为一个D-Bus的类型。

每一个数据块都有一个相关的存储顺序（大端或者小端）。对于D-Bus来说，存储顺序是消息头的一部分。

![image-20240201174407476](assets/DBus%20%E5%AD%A6%E4%B9%A0/image-20240201174407476.jpg)

数据块中的每个值都是“自然”对齐的，即，4字节的值被对齐到4字节的边界，8字节的值被对齐到8字节的边界。边界是全局计算的，与信息中的第一个字节有关。为了正确地对齐一个值，在该值之前可能需要对齐填充。对齐填充的字节数必须是正确对齐所需的最小填充字节数，且必须由空字节组成。

作为自然对齐的一个例外，`STRUCT`和`DICT_ENTRY`的值总是被对齐到8字节的边界，而不管其内容的对齐情况如何。

### 基础类型编码

要编码和解码基础类型，只需从数据块中按照类型签名的格式读取对应的值即可。所有带符号的整数值都是采用补码的形式编码的，`DOUBLE`值是`IEEE 754`的双精度浮点数进行编码，`BOOLEAN`值是用32位进行编码（其中只有最小有效位被使用）。

类字符串类型（`STRING`、`OBJECT_PATH`和`SIGNATURE`）都是以一个固定长度的无符号整数`n`给出变量部分的长度，然后是`n`个非零字节的`UTF-8`文本，后面是一个不被认为是文本一部分的零（`null`）字节作为结束符。类字符串类型的对齐方式与`n`的对齐方式相同。

对于`STRING`和`OBJECT_PATH`类型，`n`被编码为4个字节（一个`UINT32`），进行4字节对齐。对于`SIGNATURE`类型，`n`被编码为一个字节（一个`UINT8`）。因此，`SIGNATURE`不需要对齐。

例如，如果当前存储顺序为大端，且当前地址是8字节的倍数，则字符串“foo”、“+”和“bar”将被依次序列化，如下：

```C++
                                          no padding required, we are already at a multiple of 4
0x03 0x00 0x00 0x00                       length of ‘foo’ = 3
                    0x66 0x6f 0x6f        ‘foo’
                                   0x00   trailing nul

                                          no padding required, we are already at a multiple of 4
0x01 0x00 0x00 0x00                       length of ‘+’ = 1
                    0x2b                  ‘+’
                         0x00             trailing nul

                               0x00 0x00  2 bytes of padding to reach next multiple of 4
0x03 0x00 0x00 0x00                       length of ‘bar’ = 3
                    0x62 0x61 0x72        ‘bar’
                                    0x00  trailing nul
```

### 容器类型编码

数组以`UINT32`的形式编码，`n`给出数组数据的长度（以字节为单位），然后进行对齐填充，接着是依次编码的数组元素的`n`个字节。`n`不包括最后一个元素之后的对其填充。注意，即使为空数组，也需要进行对齐填充。

例如，如果当前存储顺序为小端，且当前地址是8字节的倍数，一个只包含64位整数5的数组将被编码为：

```C++
00 00 00 08               n = 8 bytes of data
00 00 00 00               padding to 8-byte boundary
00 00 00 00  00 00 00 05  first element = 5
```

数组的最大长度为2的26次方即67108864（**64 MiB**）。

`STRUCT`和`DICT_ENTRY`的编码方式与它们的内容相同，但对齐方式总是以8字节为边界，即使它们的内容通常是不严格对齐的。

`VARIANT`以内容的`SIGNATURE`（必须是一个完整的类型）的方式被编码，后面是一个具有该签名所给类型的编码值。`VARIANT`具有与`SIGNATURE`相同的1字节对齐方式。`VARIANT`的使用不能导致总的消息深度大于64，包括其他容器类型，如结构等。

应该注意的是，虽然`VARIANT`本身不需要任何对齐填充，但包含的值确实需要根据其类型的对齐规则进行填充。

例如，如果消息中的当前位置是8字节的倍数，并且字节顺序是小端，那么包含一个64位整数5的`VARIANT`将被编码为：

```C++
0x01 0x74 0x00                          signature bytes (length = 1, signature = 't' and trailing nul)
               0x00 0x00 0x00 0x00 0x00 padding to 8-byte boundary
0x00 0x00 0x00 0x00 0x00 0x00 0x00 0x05 8 bytes of contained value
```

**编码总结：**

| Conventional Name | Encoding                                                     | Alignment                      |
| ----------------- | ------------------------------------------------------------ | ------------------------------ |
| INVALID           | Not applicable; cannot be marshaled.                         | N/A                            |
| BYTE              | A single 8-bit byte.                                         | 1                              |
| BOOLEAN           | As for UINT32, but only 0 and 1 are valid values.            | 4                              |
| INT16             | 16-bit signed integer in the message's byte order.           | 2                              |
| UINT16            | 16-bit unsigned integer in the message's byte order.         | 2                              |
| INT32             | 32-bit signed integer in the message's byte order.           | 4                              |
| UINT32            | 32-bit unsigned integer in the message's byte order.         | 4                              |
| INT64             | 64-bit signed integer in the message's byte order.           | 8                              |
| UINT64            | 64-bit unsigned integer in the message's byte order.         | 8                              |
| DOUBLE            | 64-bit IEEE 754 double in the message's byte order.          | 8                              |
| STRING            | A UINT32 indicating the string's length in bytes excluding its terminating nul, followed by non-nul string data of the given length, followed by a terminating nul byte. | 4 (for the length)             |
| OBJECT_PATH       | Exactly the same as STRING except the content must be a valid object path (see above). | 4 (for the length)             |
| SIGNATURE         | The same as STRING except the length is a single byte (thus signatures have a maximum length of 255) and the content must be a valid signature (see above). | 1                              |
| ARRAY             | A UINT32 giving the length of the array data in bytes, followed by alignment padding to the alignment boundary of the array element type, followed by each array element. | 4 (for the length)             |
| STRUCT            | A struct must start on an 8-byte boundary regardless of the type of the struct fields. The struct value consists of each field marshaled in sequence starting from that 8-byte alignment boundary. | 8                              |
| VARIANT           | The marshaled SIGNATURE of a single complete type, followed by a marshaled value with the type given in the signature. | 1 (alignment of the signature) |
| DICT_ENTRY        | Identical to STRUCT.                                         | 8                              |
| UNIX_FD           | 32-bit unsigned integer in the message's byte order. The actual file descriptors need to be transferred out-of-band via some platform specific mechanism. On the wire, values of this type store the index to the file descriptor in the array of file descriptors that accompany the message. | 4                              |

具体实现可参考：https://dbus.freedesktop.org/doc/api/html/group__DBusMarshal.html

## D-Bus Message Protocol

一条`Message`由一个`header`和一个`body`组成。信息传递系统使用`header`来确定将信息发送到何处以及如何解释它；收件人则可以解析信息的`body`。

消息的`body`由零个或多个参数组成，这些参数是类型化的值，如整数或数组。

`header`和`body`都使用D-Bus类型系统的格式来序列化数据。

### 消息格式

一条`Message`由一个`header`和一个`body`组成。`header`是一个具有固定签名和含义的数据块块。`body`是一个单独的值块，其签名在`header`中指定。

`header`的长度必须是8的倍数，当把整个消息存储在一个缓冲区时，允许`body`在8字节的边界上开始。如果`header`没有自然结束在8字节的边界上，则必须添加最多7字节的**无初始化**对齐填充。

消息`body`不需要在8字节的边界上结束。

一个消息的最大长度，包括`header`、`header`对齐填充和`body`，是2的27次方或134217728（**128 MiB**）。

`header`的签名格式是：`"yyyyuua(yv)"`，即

```
BYTE, BYTE, BYTE, BYTE, UINT32, UINT32, ARRAY of STRUCT of (BYTE,VARIANT)
```

这些值的意义如下：

| Value                             | Description                                                  |
| --------------------------------- | ------------------------------------------------------------ |
| 1st BYTE                          | Endianness flag; ASCII 'l' for little-endian or ASCII 'B' for big-endian. Both header and body are in this endianness. |
| 2nd BYTE                          | Message type. Unknown types must be ignored. Currently-defined types are described below. |
| 3rd BYTE                          | Bitwise OR of flags. Unknown flags must be ignored. Currently-defined flags are described below. |
| 4th BYTE                          | Major protocol version of the sending application. If the major protocol version of the receiving application does not match, the applications will not be able to communicate and the D-Bus connection must be disconnected. The major protocol version for this version of the specification is 1. |
| 1st UINT32                        | Length in bytes of the message body, starting from the end of the header. The header ends after its alignment padding to an 8-boundary. |
| 2nd UINT32                        | The serial of this message, used as a cookie by the sender to identify the reply corresponding to this request. This must not be zero. |
| ARRAY of STRUCT of (BYTE,VARIANT) | An array of zero or more header fields where the byte is the field code, and the variant is the field value. The message type determines which fields are required. |

第二个Byte所代表的Message Type如下：

| Conventional name | Decimal value | Description                                                  |
| ----------------- | ------------- | ------------------------------------------------------------ |
| INVALID           | 0             | This is an invalid type.                                     |
| METHOD_CALL       | 1             | Method call. This message type may prompt a reply.           |
| METHOD_RETURN     | 2             | Method reply with returned data.                             |
| ERROR             | 3             | Error reply. If the first argument exists and is a string, it is an error message. |
| SIGNAL            | 4             | Signal emission.                                             |

其余字段不再列举。

## D-Bus 中的传输方式

D-Bus中的传输方式主要分为以下几种

- Unix Domain Sockets
- launchd
- systemd
- TCP Sockets
- Nonce-authenticated TCP Sockets
- Executed Subprocesses on Unix

从D-feet中的地址字段中，我们可以看到服务所使用的具体传输方式

![image-20240201174428645](assets/DBus%20%E5%AD%A6%E4%B9%A0/image-20240201174428645.jpg)

![image-20240201174431831](assets/DBus%20%E5%AD%A6%E4%B9%A0/image-20240201174431831.jpg)

### Unix Domain Sockets

```C++
DBusSocket
_dbus_connect_unix_socket (const char     *path,
                           dbus_bool_t     abstract,
                           DBusError      *error)
{
  DBusSocket fd = DBUS_SOCKET_INIT;
  size_t path_len;
  struct sockaddr_un addr;
  _DBUS_STATIC_ASSERT (sizeof (addr.sun_path) > _DBUS_MAX_SUN_PATH_LENGTH);

  _DBUS_ASSERT_ERROR_IS_CLEAR (error);

  _dbus_verbose ("connecting to unix socket %s abstract=%d\n",
                 path, abstract);


  if (!_dbus_open_unix_socket (&fd.fd, error))
    {
      _DBUS_ASSERT_ERROR_IS_SET(error);
      return fd;
    }
  _DBUS_ASSERT_ERROR_IS_CLEAR(error);

  _DBUS_ZERO (addr);
  addr.sun_family = AF_UNIX;
  path_len = strlen (path);

  if (abstract)
    {
#ifdef __linux__
      addr.sun_path[0] = '\0'; /* this is what says "use abstract" */
      path_len++; /* Account for the extra nul byte added to the start of sun_path */

      if (path_len > _DBUS_MAX_SUN_PATH_LENGTH)
        {
          dbus_set_error (error, DBUS_ERROR_BAD_ADDRESS,
                      "Abstract socket name too long\n");
          _dbus_close_socket (&fd, NULL);
          return fd;
        }

      strncpy (&addr.sun_path[1], path, sizeof (addr.sun_path) - 2);
      /* _dbus_verbose_bytes (addr.sun_path, sizeof (addr.sun_path)); */
#else /* !__linux__ */
      dbus_set_error (error, DBUS_ERROR_NOT_SUPPORTED,
                      "Operating system does not support abstract socket namespace\n");
      _dbus_close_socket (&fd, NULL);
      return fd;
#endif /* !__linux__ */
    }
  else
    {
      if (path_len > _DBUS_MAX_SUN_PATH_LENGTH)
        {
          dbus_set_error (error, DBUS_ERROR_BAD_ADDRESS,
                      "Socket name too long\n");
          _dbus_close_socket (&fd, NULL);
          return fd;
        }

      strncpy (addr.sun_path, path, sizeof (addr.sun_path) - 1);
    }

  if (connect (fd.fd, (struct sockaddr*) &addr, _DBUS_STRUCT_OFFSET (struct sockaddr_un, sun_path) + path_len) < 0)
    {
      dbus_set_error (error,
                      _dbus_error_from_errno (errno),
                      "Failed to connect to socket %s: %s",
                      path, _dbus_strerror (errno));

      _dbus_close_socket (&fd, NULL);
      return fd;
    }

  if (!_dbus_set_fd_nonblocking (fd.fd, error))
    {
      _DBUS_ASSERT_ERROR_IS_SET (error);

      _dbus_close_socket (&fd, NULL);
      return fd;
    }

  return fd;
}
```

Unix Domain Sockets的socket文件

![image-20240201174438415](assets/DBus%20%E5%AD%A6%E4%B9%A0/image-20240201174438415.jpg)

![image-20240201174442768](assets/DBus%20%E5%AD%A6%E4%B9%A0/image-20240201174442768.jpg)

## D-Bus Daemon

### 概述

每一条总线实际上就是`D-Bus Daemon`的一个进程实例，如下：

![image-20240201174445819](assets/DBus%20%E5%AD%A6%E4%B9%A0/image-20240201174445819.jpg)

当一个程序连接到`D-Bus Daemon`时，`D-Bus Daemon`会自动为其分配一个唯一的连接名。在程序发送任何D-Bus消息之前，必须向`org.freedesktop.DBus.Hello`发送一个远程调用消息（不使用`D-Bus Daemon`的点对点连接则不需要），该远程调用会返回当前应用程序的唯一名称。唯一名称必须以`:`开头。

![image-20240201174450524](assets/DBus%20%E5%AD%A6%E4%B9%A0/image-20240201174450524.jpg)

每个应用程序还可以向`D-Bus Daemon`申请一个`Additional name`（不能以`:`开头），如`com.example.TextEditor1`。也就是我们之前所说的`Service Name`。

`D-Bus Daemon`本身拥有一个特殊的名字：`org.freedesktop.DBus`，且有一个位于`/org/freedesktop/DBus`的对象，该对象实现了`org.freedesktop.DBus`接口。这个服务允许应用程序对`D-Bus Daemon`本身进行管理请求。

![image-20240201174453740](assets/DBus%20%E5%AD%A6%E4%B9%A0/image-20240201174453740.jpg)

每个`Additional name`都可有一个等待队列。如果某一个应用程序申请的`Additional name`已经在使用中了，那么，`D-Bus Daemon`将会把这个应用程序的连接加入到对应名称的等待队列中去。当该名称的当前所有者断开连接或释放该名称时，队列中的下一个应用程序将会成为该名称新的所有者。

### 消息路由

`D-Bus Daemon`维护一张，该表记录了消息的路由信息。

如果一个D-Bus消息具有`DESTINATION`字段，那么该消息就是一条单播消息。`D-Bus Daemon`会将设置了`DESTINATION`字段的消息转发给指定的收件人，无论收件人是否设置了对应的消息匹配规则。

如果一个D-Bus消息不具有`DESTINATION`字段，那么该消息就是一条广播消息。`D-Bus Daemon`会将该消息转发给所有具有与该消息相匹配的消息匹配规则的应用程序。目前，在`D-Bus Daemon`中，大部分信号是广播的，其它类型的消息都不可能是广播的。

单播信号并不常用，但它们确实存在。单播信号的一个用途是避免竞赛条件，即在预期的接收者调用`org.freedesktop.DBus.AddMatch`添加匹配规则之前发出信号。单播信号的另一个用途是发送敏感信息，这些信息只对一个接收者可见。

如果一个方法调用的D-Bus消息不包含`DESTINATION`字段，那么该调用将被视为一个点对点消息，由`D-Bus Daemon`进行处理。

### 窃听

接收一个`DESTINATION`字段不为自己的单播消息被称为窃听。`D-Bus Daemon`的安全策略通常会阻止窃听，因为单播消息通常是保密的。目前，在`D-Bus Daemon`中，窃听被弃用，BecomeMonitor方法（`org.freedesktop.DBus.Monitor.BecomeMonitor`）提供了一种更好的监控`D-Bus Daemon`的方法。

应用程序可以通过添加包括`eavesdrop='true'`的匹配规则来尝试窃听。为了与旧版本的`D-Bus Daemon`实现兼容，如果添加`eavesdrop='true'`导致错误会自动会应用程序省略掉窃听。

![6724c826-e957-4cd4-bb10-0387b3af387f](assets/DBus%20%E5%AD%A6%E4%B9%A0/6724c826-e957-4cd4-bb10-0387b3af387f-6788781.jpeg)

![image-20240201174459692](assets/DBus%20%E5%AD%A6%E4%B9%A0/image-20240201174459692.jpg)

### 匹配规则

`D-Bus Daemon`路由协议的一个重要部分是消息匹配规则。消息匹配规则描述了消息应该如何被转发。广播信息注会发送给具有合适匹配规则的应用程序。如果`D-Bus Daemon`的安全策略允许的话，消息匹配规则也可以用于窃听（见上文），但是这种用法已经被废弃了。消息匹配规则可以使用`AddMatch`方法（`org.freedesktop.DBus.AddMatch`）添加。消息匹配规则是用逗号分割的多组键值对。eg：

```C++
"type='signal',sender='org.freedesktop.DBus',interface='org.freedesktop.DBus',member='Foo',path='/bar/foo',destination=':452345.34',arg2='bar'"
```

![image-20240201174512239](assets/DBus%20%E5%AD%A6%E4%B9%A0/image-20240201174512239.jpg)

### D-Bus 唤醒

`D-Bus Daemon`可以根据消息请求对应用程序进行唤醒。可以被唤醒的应用程序被称为服务。在D-Bus中，服务的激活通常是通过`auto-starting`完成的。

在`auto-starting`模式下，应用程序向一个特定的`Service`发送消息，例如`com.example.TextEditor1`，并且没有在消息头中指定`NO_AUTO_START`标志。如果`D-Bus Daemon`的连接中没有该消息请求的名称，则`D-Bus Daemon`将启动该服务，并等待它请求该名称，然后将消息传递给它。

应用程序也可以明确的请求启动某个服务：`org.freedesktop.DBus.StartServiceByName`。

为了找到`Service`对应的可执行文件，`D-Bus Daemon`会寻找服务描述文件。服务描述文件定义了从`Service`名称到可执行文件的映射。不同类型的`D-Bus Daemon`将在不同的地方寻找这些文件。

![image-20240201174517313](assets/DBus%20%E5%AD%A6%E4%B9%A0/image-20240201174517313.jpg)

服务描述文件的扩展名是".service"。`D-Bus Daemon`只加载以.service结尾的服务描述文件，所有其他文件将被忽略。所有服务描述文件必须采用UTF-8编码。服务描述文件的名称必须是D-Bus上的`Service`名称加上.service，例如`com.example.ConfigurationDatabase1.service`。

```Plain
# Sample service description file
[D-BUS Service]
Name=com.example.ConfigurationDatabase1
Exec=/usr/bin/sample-configd
```

此外，Unix上系统总线的服务描述文件必须包含一个User键，其值是一个用户账户的名称（例如root）。系统服务将以该用户身份运行。

如果不同目录下的两个.service文件提供了相同的服务名称，则使用优先级较高的目录中的文件：例如，在系统总线上，`/usr/local/share/dbus-1/system-services`中的.service文件优先于`/usr/share/dbus-1/system-services`中的。

## D-Bus 性能分析

![image-20240201174522150](assets/DBus%20%E5%AD%A6%E4%B9%A0/image-20240201174522150.jpg)

D-Bus的拓扑结构——所有进程都需要连接到daemon上，以获取D-Bus消息。D-Bus Daemon负责路由消息以及广播信号。

目前的D-Bus实现在CPU和内存受限的嵌入式环境下有很大的开销。这种开销有四个方面。一个是由库中的多层封装引起的抽象开销。另一个是由参数断言和验证、安全字符串操作、安全内存分配和释放引起的安全开销。然后是由序列化和反序列化（内存拷贝）、方法名称绑定（D-Bus接口v-table访问和间接调用）引起的对象模型开销。最后一个是由匹配、过滤、监控和转发引起的守护进程中的路由开销。一个RPC可能会导致四个上下文切换，因为调用信息首先唤醒守护进程，然后唤醒被调用者，而返回信息又会造成两次唤醒。下面列出了一个客户端服务器的性能数据，是使用perf工具得到的。这个测试只使用libdbus（没有C++对象层的开销），进行100万次方法调用。调用的参数是一个5字节的字符串，返回值是一个4字节的状态和一个4字节的整数。在测试中，一个RPC的平均延迟约为1.22毫秒（在4GB内存的Core 2 Duo E8400上）。当然对于一般的图形化设备来说，这个“沉重的”开销就不值一提了。

![image-20240201174525858](assets/DBus%20%E5%AD%A6%E4%B9%A0/image-20240201174525858.jpg)

- D-Bus传输大数据的方式：D-Bus+共享内存等

# 三、KDBusAddons 简介

KDBusAddons是在QtDBus的基础之上进行了一层封装，包含`KDBusInterProcessLock`、`KDBusService`、`KDEDModule`、`UpdateLaunchEnvironmentJob`四个模块。

1. `KDBusInterProcessLock`：实现了进程间的资源访问的协同锁。该类可以用于在多个进程之间序列化对一个资源的访问。具体实现没有使用传统的文件锁，而是通过注册D-Bus服务来允许一次只有一个进程可以访问该资源。
2. `KDBusService`：KDBusService负责为当前进程注册D-Bus Serivce，并将`QCoreApplication`（或子类）对象注册到`/MainApplication`上，从而允许桌面根据`.desktop`文件中的配置对应用程序进行唤起或激活。基于`KDBusService`，一个应用程序可以在`Multiple`模式或`Unique`模式下工作。
   1.  在`Multiple`模式下，应用程序可以被多次启动。不同的应用程序运行实例注册中D-Bus的服务名称将包含PID以进行区分；例如：`org.kde.konqueror-12345`。在`Unique`模式下，应用程序只有一个实例可以运行。应用程序的第一个实例将在D-Bus上注册服务，任何试图再次运行该应用程序的行为都会向已经运行的实例发出`activateRequested()`信号，然后退出新启动的进程。新进程推出的返回值可以由已经运行的实例用`setExitValue()`设置，默认值为0。

   2.  `Unique`模式下的应用程序应该推迟解析命令行参数，直到`KDBusService`对象创建完成之后。

   3.  在`.desktop`文件中设置了D-Bus激活项（`DBusActivatable=true`）后，桌面可根据.desktop文件中的配置对应用程序进行唤起或激活。

   4. ![image-20240201174531083](assets/DBus%20%E5%AD%A6%E4%B9%A0/image-20240201174531083.jpg)
3. `KDEDModule`：KDED模块的基类。KDED模块被构造成共享库，在运行时被按需加载到KDED守护进程中。
   1. ![image-20240201174536530](assets/DBus%20%E5%AD%A6%E4%B9%A0/image-20240201174536530.jpg)

   2. ![image-20240201174542960](assets/DBus%20%E5%AD%A6%E4%B9%A0/image-20240201174542960.jpg)

   3. ![7286419b-f4b0-4db1-ab3d-a2938d4878c3](assets/DBus%20%E5%AD%A6%E4%B9%A0/7286419b-f4b0-4db1-ab3d-a2938d4878c3.jpeg)

   4.  [docs/HOWTO · master · Frameworks / KDE Daemon · GitLab](https://invent.kde.org/frameworks/kded/-/blob/master/docs/HOWTO)

   5.  [app/kded.h · master · Plasma / KHotkeys · GitLab](https://invent.kde.org/plasma/khotkeys/-/blob/master/app/kded.h)
4. `UpdateLaunchEnvironmentJob`：负责更新应用程序`launch environment`的类，，该变量将在进程启动时使用。包括：
   1. `DBus activation`
   2. `Systemd units`
   3. `Plasma-session`
   4. ```C++
      void UpdateLaunchEnvironmentJob::start()
      {
          qDBusRegisterMetaType<QMap<QString, QString>>();
          QMap<QString, QString> dbusActivationEnv;
          QStringList systemdUpdates;
      
          for (const auto &varName : d->environment.keys()) {
              if (!UpdateLaunchEnvironmentJobPrivate::isPosixName(varName)) {
                  qCWarning(KDBUSADDONS_LOG) << "Skipping syncing of environment variable " << varName << "as name contains unsupported characters";
                  continue;
              }
              const QString value = d->environment.value(varName);
      
              // KLauncher; remove this in KF6 (by then KInit will be gone)
              QDBusMessage klauncherMsg = QDBusMessage::createMethodCall(QStringLiteral("org.kde.klauncher5"),
                                                                         QStringLiteral("/KLauncher"),
                                                                         QStringLiteral("org.kde.KLauncher"),
                                                                         QStringLiteral("setLaunchEnv"));
              klauncherMsg.setArguments({QVariant::fromValue(varName), QVariant::fromValue(value)});
              auto klauncherReply = QDBusConnection::sessionBus().asyncCall(klauncherMsg);
              d->monitorReply(klauncherReply);
      
              // plasma-session
              QDBusMessage plasmaSessionMsg = QDBusMessage::createMethodCall(QStringLiteral("org.kde.Startup"),
                                                                             QStringLiteral("/Startup"),
                                                                             QStringLiteral("org.kde.Startup"),
                                                                             QStringLiteral("updateLaunchEnv"));
              plasmaSessionMsg.setArguments({QVariant::fromValue(varName), QVariant::fromValue(value)});
              auto plasmaSessionReply = QDBusConnection::sessionBus().asyncCall(plasmaSessionMsg);
              d->monitorReply(plasmaSessionReply);
      
              // DBus-activation environment
              dbusActivationEnv.insert(varName, value);
      
              // _user_ systemd env
              // Systemd has stricter parsing of valid environment variables
              // https://github.com/systemd/systemd/issues/16704
              // validate here
              if (!UpdateLaunchEnvironmentJobPrivate::isSystemdApprovedValue(value)) {
                  qCWarning(KDBUSADDONS_LOG) << "Skipping syncing of environment variable " << varName << "as value contains unsupported characters";
                  continue;
              }
              const QString updateString = varName + QStringLiteral("=") + value;
              systemdUpdates.append(updateString);
          }
      
          // DBus-activation environment
          QDBusMessage dbusActivationMsg = QDBusMessage::createMethodCall(QStringLiteral("org.freedesktop.DBus"),
                                                                          QStringLiteral("/org/freedesktop/DBus"),
                                                                          QStringLiteral("org.freedesktop.DBus"),
                                                                          QStringLiteral("UpdateActivationEnvironment"));
          dbusActivationMsg.setArguments({QVariant::fromValue(dbusActivationEnv)});
      
          auto dbusActivationReply = QDBusConnection::sessionBus().asyncCall(dbusActivationMsg);
          d->monitorReply(dbusActivationReply);
      
          // _user_ systemd env
          QDBusMessage systemdActivationMsg = QDBusMessage::createMethodCall(QStringLiteral("org.freedesktop.systemd1"),
                                                                             QStringLiteral("/org/freedesktop/systemd1"),
                                                                             QStringLiteral("org.freedesktop.systemd1.Manager"),
                                                                             QStringLiteral("SetEnvironment"));
          systemdActivationMsg.setArguments({systemdUpdates});
      
          auto systemdActivationReply = QDBusConnection::sessionBus().asyncCall(systemdActivationMsg);
          d->monitorReply(systemdActivationReply);
      }
      ```

# 四、KDBusService 实现

## D-Bus Service Name

创建KDBusService时，会自动在D-Bus上注册服务。服务名称为：反向域名+应用名称+进程ID（如果为`Multiple`模式）

```C++
// d->serviceName;
QString generateServiceName()
{
    const QCoreApplication *app = QCoreApplication::instance();
    const QString domain = app->organizationDomain();
    const QStringList parts = domain.split(QLatin1Char('.'), Qt::SkipEmptyParts);

    QString reversedDomain;
    if (parts.isEmpty()) {
        reversedDomain = QStringLiteral("local.");
    } else {
        for (const QString &part : parts) {
            reversedDomain.prepend(QLatin1Char('.'));
            reversedDomain.prepend(part);
        }
    }

    return reversedDomain + app->applicationName();
}

void generateServiceName()
{
    d->serviceName = d->generateServiceName();
    objectPath = QLatin1Char('/') + d->serviceName;
    objectPath.replace(QLatin1Char('.'), QLatin1Char('/'));
    objectPath.replace(QLatin1Char('-'), QLatin1Char('_')); // see spec change at https://bugs.freedesktop.org/show_bug.cgi?id=95129

    if (options & KDBusService::Multiple) {
        const bool inSandbox = QFileInfo::exists(QStringLiteral("/.flatpak-info"));
        if (inSandbox) {
            d->serviceName += QStringLiteral(".kdbus-")
                + QDBusConnection::sessionBus().baseService().replace(QRegularExpression(QStringLiteral("[\\.:]")), QStringLiteral("_"));
        } else {
            d->serviceName += QLatin1Char('-') + QString::number(QCoreApplication::applicationPid());
        }
    }
}
```

## register

在注册D-Bus服务时，会将QCoreApplication::instance()对象暴露在D-Bus`/MainApplication`下。

```C++
auto bus = QDBusConnection::sessionBus();
bool objectRegistered = false;
objectRegistered = bus.registerObject(QStringLiteral("/MainApplication"),
                                      QCoreApplication::instance(),
                                      QDBusConnection::ExportAllSlots
                                      | QDBusConnection::ExportScriptableProperties //
                                      | QDBusConnection::ExportAdaptors);
```

注册服务时，会根据不同平台做一些特殊处理。另外，如果是`Unique`模式的话，为了避免前一个实例Crash然后被`KCrash`自动Restart或其他原因导致D-Bus Service Name 所有权释放延时，会进行一次Retry。

```C++
void attemptRegistration()
{
    Q_ASSERT(!d->registered);

    auto queueOption = QDBusConnectionInterface::DontQueueService;

    if (options & KDBusService::Unique) {
        queueOption = QDBusConnectionInterface::QueueService;
        // When a process crashes and gets auto-restarted by KCrash we may
        // be in this code path "too early". There is a bit of a delay
        // between the restart and the previous process dropping off of the
        // bus and thus releasing its registered names. As a result there
        // is a good chance that if we wait a bit the name will shortly
        // become registered.

        connect(bus, &QDBusConnectionInterface::serviceRegistered, this, [this](const QString &service) {
            if (service != d->serviceName) {
                return;
            }

            d->registered = true;
            registrationLoop.quit();
        });
    }

    d->registered = (bus->registerService(d->serviceName, queueOption) == QDBusConnectionInterface::ServiceRegistered);

    if (d->registered) {
        return;
    }

    if (options & KDBusService::Replace) {
        auto message = QDBusMessage::createMethodCall(d->serviceName,
                                                      QStringLiteral("/MainApplication"),
                                                      QStringLiteral("org.qtproject.Qt.QCoreApplication"),
                                                      QStringLiteral("quit"));
        QDBusConnection::sessionBus().asyncCall(message);
        waitForRegistration();
    } else if (options & KDBusService::Unique) {
        // Already running so it's ok!
        QVariantMap platform_data;
#if HAVE_X11
        if (QX11Info::isPlatformX11()) {
            QString startupId = QString::fromUtf8(qgetenv("DESKTOP_STARTUP_ID"));
            if (startupId.isEmpty()) {
                startupId = QString::fromUtf8(QX11Info::nextStartupId());
            }
            if (!startupId.isEmpty()) {
                platform_data.insert(QStringLiteral("desktop-startup-id"), startupId);
            }
        }
#endif

        if (qEnvironmentVariableIsSet("XDG_ACTIVATION_TOKEN")) {
            platform_data.insert(QStringLiteral("activation-token"), qgetenv("XDG_ACTIVATION_TOKEN"));
        }

        if (QCoreApplication::arguments().count() > 1) {
            OrgKdeKDBusServiceInterface iface(d->serviceName, objectPath, QDBusConnection::sessionBus());
            iface.setTimeout(5 * 60 * 1000); // Application can take time to answer
            QDBusReply<int> reply = iface.CommandLine(QCoreApplication::arguments(), QDir::currentPath(), platform_data);
            if (reply.isValid()) {
                exit(reply.value());
            } else {
                d->errorMessage = reply.error().message();
            }
        } else {
            OrgFreedesktopApplicationInterface iface(d->serviceName, objectPath, QDBusConnection::sessionBus());
            iface.setTimeout(5 * 60 * 1000); // Application can take time to answer
            QDBusReply<void> reply = iface.Activate(platform_data);
            if (reply.isValid()) {
                exit(0);
            } else {
                d->errorMessage = reply.error().message();
            }
        }

        // service did not respond in a valid way....
        // let's wait to see if our queued registration finishes perhaps.
        waitForRegistration();
    }

    if (!d->registered) { // either multi service or failed to reclaim name
        d->errorMessage = QLatin1String("Couldn't register name '") + d->serviceName + QLatin1String("' with DBUS - another process owns it already!");
    }
}
static void handlePlatformData(const QVariantMap &platformData)
{
    #if HAVE_X11
    if (QX11Info::isPlatformX11()) {
        QByteArray desktopStartupId = platformData.value(QStringLiteral("desktop-startup-id")).toByteArray();
        if (!desktopStartupId.isEmpty()) {
            QX11Info::setNextStartupId(desktopStartupId);
        }
    }
    #endif

    const auto xdgActivationToken = platformData.value(QLatin1String("activation-token")).toByteArray();
    if (!xdgActivationToken.isEmpty()) {
        qputenv("XDG_ACTIVATION_TOKEN", xdgActivationToken);
    }
}
```

# 参考链接

- [KDBusAddons API Doc](https://api.kde.org/frameworks/kdbusaddons/html/index.html)
- [DBus学习笔记 - 莫水千流 - 博客园](https://www.cnblogs.com/zhoug2020/p/4516144.html)
- [Using the DBUS C API](http://www.matthew.ath.cx/misc/dbus)
- [D-Bus Specification](https://dbus.freedesktop.org/doc/dbus-specification.html)
- [Unix/Linux编程:Unix domain socket_OceanStar的学习笔记的博客-CSDN博客_domain socket编程](https://blog.csdn.net/zhizhengguan/article/details/117666015)
- [D-Bus 性能分析 - daw1213 - 博客园](https://www.cnblogs.com/brt3/p/9614632.html)
- [D-Bus API Design Guidelines](https://dbus.freedesktop.org/doc/dbus-api-design.html)
