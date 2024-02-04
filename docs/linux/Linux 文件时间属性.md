# Linux 文件时间属性
<br>

# Linux文件的四个时间属性

在Ext2文件系统中，Linux中没有文件创建时间的概念，文件只有三个时间属性：

- Last access timestamp (atime)
  - 该属性当文件被访问时改变，如使用：execve，mknod，pipe，utime，read。一些其他的接口，如mmap，可能会改变该属性）（也可能不会）。
- Last modification timestamp (mtime)
  - 该属性当文件被修改时改变。
- Last status change timestamp (ctime)
  - 该属性当文件状态改变时改变。 例如写入信息或设置`inode`信息（`i.e.,owner, group, link count, mode, etc.`）。

在Ext4文件系统中，文件拥有创建时间的概念：

- File creation (birth) timestamp (btime)
  - 文件的创建时间戳。 这是在文件创建时设置的，随后不会改变。

# MacOS 文件添加时间属性

在MacOS中，文件的时间属性除了上述四种之外，还包含了添加时间的概念。

- 添加时间
  - 该属性当文件的位置发生变化时改变。

我们可以使用

```Bash
mdls filename
```

来查看MacOS上文件的额外信息。

这些额外信息并不是完全存在于`xattr`属性中。当我们给一个文件添加备注后查看`xattr`属性，可以发现文件的备注信息，但当我们清除`xattr`属性时，备注信息仍然存在，不受`xattr`属性清除的影响。

`Spotlight`是MacOS中的智能搜索，它的数据库中存储了文件的额外信息。

MacOS中文件的额外信息存储在`Spotlight`数据库中，`mdls`命令不会直接去查询`Spotlight`的数据库，而是通过`Spotlight`提供的API对文件属性进行查询。`mdfind`命令会查询`Spotlight`的数据库。

# Linux获取文件创建时间方法：

![image-20240201202612104](assets/Linux%20%E6%96%87%E4%BB%B6%E6%97%B6%E9%97%B4%E5%B1%9E%E6%80%A7/image-20240201202612104.png)

![image-20240201202614881](assets/Linux%20%E6%96%87%E4%BB%B6%E6%97%B6%E9%97%B4%E5%B1%9E%E6%80%A7/image-20240201202614881.png)

```C++
#include <sys/stat.h>
#include <unistd.h>
#include <fcntl.h>
#include <cstdio>

int main() {
    struct statx buf;
    statx(AT_FDCWD, "1.txt", AT_STATX_SYNC_AS_STAT | AT_SYMLINK_NOFOLLOW, STATX_ALL, &buf);
    printf("1.txt file size = %llu \n", buf.stx_size);
    printf("1.txt file btime = %lld \n", buf.stx_btime.tv_sec);
}
```

Ubuntu下Stat命令系统调用

![image-20240201202619976](assets/Linux%20%E6%96%87%E4%BB%B6%E6%97%B6%E9%97%B4%E5%B1%9E%E6%80%A7/image-20240201202619976.png)

可以看到也是使用了`statx`函数

参考链接：

- https://man7.org/linux/man-pages/man7/inode.7.html
- https://zhuanlan.zhihu.com/p/150235061
- [statx(2) - Linux manual page](https://man7.org/linux/man-pages/man2/statx.2.html)
- https://apple.stackexchange.com/questions/430802/how-do-mdfind-and-mdls-derive-what-metadata-a-file-has-and-where-is-it-stored
