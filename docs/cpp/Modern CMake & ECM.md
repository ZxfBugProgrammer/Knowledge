# Modern CMake & ECM
<br>

# 一、CMake 基础

## 1. CMake 简介

CMake(Cross Platform Make)是一个开源的、跨平台的用于构建、测试和打包软件的构建系统生成器。CMake允许开发者编写一种平台无关的 CMakeList.txt 文件来定制整个编译流程，然后再根据目标用户的平台进一步生成所需的本地化 Makefile 和工程文件，如 Unix 的 Makefile 或 Windows 的 Visual Studio 工程。从而做到“Write once, run everywhere”。

CMake的出现已经有接近20年的历史，它的发展过程也初步经历了三个阶段。

- 2000之前 (~v2.x) ，刚刚启动，过程式描述为主。
- 2000~2014 (v3.0~) ，引入Target概念。
- 2014~now (~v3.15)，有了Target和Property的定义，更现代化。

![7e089561-43cf-4c75-871e-a7afe9fd5d6f](assets/Modern%20CMake%20%26%20ECM/7e089561-43cf-4c75-871e-a7afe9fd5d6f.jpeg)

CMake管理的项目的工作流发生在许多阶段(time)，我们称之为时序。可以简洁地总结如下图：

![55ededb0-d820-494d-b947-c61a935e8144](assets/Modern%20CMake%20%26%20ECM/55ededb0-d820-494d-b947-c61a935e8144.jpeg)

![image-20240131210026952](assets/Modern%20CMake%20%26%20ECM/image-20240131210026952.png)

## 2. 为什么选择CMake

![image-20240131205718267](assets/Modern%20CMake%20%26%20ECM/image-20240131205718267.png)

CMake具有优秀的生态。基本上每个优秀的 IDE 都支持 CMake。使用 CMake 构建的软件包比使用其他任何构建系统的都多。如果想要在代码中包含一个库，通常有两个选择，要么自己写一个构建系统，要么使用该库支持的构建系统（这其中通常会包含CMake）。

## 3. CMake 入门

### 基础用法：

```cmake
cmake [options] -S <path-to-source> -B <path-to-build>

# 例如常用用法：
# 在根目录创建 build 文件夹，并生成工程文件到build目录
# cmake -S . -B build  或者 cmake . -B build

cmake --build . --target all -j

# 另外一种用法：分开执行
mkdir build # 创建文件夹
cd build    # cd 到生成目标目录 
cmake ..    # 执行cmake命令
make -j     # 构建

# 指定最低版本
cmake_minimum_required(VERSION 3.1) 
# CMake 3.12+ 后，可以指定版本范围
cmake_minimum_required(VERSION 3.7...3.18)

# 注意 如果需要混编 C 和 C++ LANGUAGES 可以不指定或者指定两个，不能只写CXX
project(MyProject VERSION 1.0
                  DESCRIPTION "Very nice project"
                  LANGUAGES CXX)

# 流程控制
# 具体运算符详见 https://cmake.org/cmake/help/latest/command/if.html#command:if
if(variable)
    # If variable is `ON`, `YES`, `TRUE`, `Y`, or non zero number
else()
    # If variable is `0`, `OFF`, `NO`, `FALSE`, `N`, `IGNORE`, `NOTFOUND`, `""`, or ends in `-NOTFOUND`
endif()

if(NOT TARGET libA OR EXISTS "test.xml")
 # If libA or test.xml exist 
endif()

# 生成器表达式, generator-expressions
# CMake 大多数命令在 configure 阶段就被执行了，而生成器表达可以在 build 阶段，或者 install 阶段被执行
# 详见 https://cmake.org/cmake/help/latest/manual/cmake-generator-expressions.7.html
target_include_directories(MyTarget 
    PUBLIC
    $<BUILD_INTERFACE:${CMAKE_CURRENT_SOURCE_DIR}/include>
    $<INSTALL_INTERFACE:include>
)

# 用CMake的变量对文本进行配置
# https://cmake.org/cmake/help/latest/command/configure_file.html
configure_file(<input> <output>
               [NO_SOURCE_PERMISSIONS | USE_SOURCE_PERMISSIONS |
                FILE_PERMISSIONS <permissions>...]
               [COPYONLY] [ESCAPE_QUOTES] [@ONLY]
               [NEWLINE_STYLE [UNIX|DOS|WIN32|LF|CRLF] ])

# file 命令支持对文件进行多种操作（读、写、查找、重命名、拷贝、压缩、解压缩、加锁）
# https://cmake.org/cmake/help/latest/command/file.html

# 安装
# https://cmake.org/cmake/help/latest/command/install.html
install(TARGETS <target>... [...])
install(IMPORTED_RUNTIME_ARTIFACTS <target>... [...])
install({FILES | PROGRAMS} <file>... [...])
install(DIRECTORY <dir>... [...])
install(SCRIPT <file> [...])
install(CODE <code> [...])
install(EXPORT <export-name> [...])
install(RUNTIME_DEPENDENCY_SET <set-name> [...])
```

### 常用变量：

```bash
CMAKE_BINARY_DIR 工程编译发生的目录
CMAKE_SOURCE_DIR 工程顶级目录
CMAKE_CURRENT_BINARY_DIR 当前正在处理的CMakeLists.txt编译发生的目录
CMAKE_CURRENT_SOURCE_DIR 当前正在处理的CMakeLists.txt所在的目录
CMAKE_MODULE_PATH 模块搜索路径

CMAKE_CXX_FLAGS 编译选项

# 不推荐使用
CMAKE_RUNTIME_OUTPUT_DIRECTORY 执行文件输出路径
CMAKE_ARCHIVE_OUTPUT_DIRECTORY 静态库输出路径
CMAKE_LIBRARY_OUTPUT_DIRECTORY 动态库输出路径

CMAKE_INSTALL_PREFIX 输出文件安装位置

PROJECT_SOURCE_DIR　最近使用project()命令的CMakeLists.txt所处路径
CMAKE_PROJECT_NAME 工程名字
```

### 变量与缓存：

- 局部变量

```cmake
# 设置局部变量，其作用域为当前文件夹，以及 add_subdirectory 进入的文件夹
set(MY_VARIABLE "value")
# 将作用域设置为父目录，通常用在子目录向父目录传递信息
set(MY_VARIABLE "value" PARENT_SCOPE) 
set(MY_LIST "one" "two") # 会在变量值中间加入 ";"，等价于 set(MY_LIST "one;two")
```

- 缓存变量

```cmake
# 设置缓存变量 一般用于需要被用户设置的变量
set(MY_CACHE_VARIABLE "VALUE" CACHE STRING "Description")

# 缓存变量将持久存在于 CMakeCache.txt 中
# 通过 cmake -DXXX 命令传递的参数为缓存变量
```

- 环境变量

```cmake
# 设置环境变量
set(ENV{variable_name} value)
# 获取环境变量
$ENV{variable_name}
```

- 属性

```cmake
# 属性有点像变量，但它依附在某个 target 或者文件、目录上。
# 许多属性的初始值来自于 CMAKE_ 开头的变量，例如设置 CMAKE_CXX_STANDARD，将会设置 target 的 CXX_STANDARD 属性初始值。
# set_property 用于设置属性，get_property 用于获取属性

# https://cmake.org/cmake/help/latest/manual/cmake-properties.7.html
```

### **运行其他程序：**

- 在 configure 阶段运行命令

```cmake
find_package(Git QUIET)

if(GIT_FOUND AND EXISTS "${PROJECT_SOURCE_DIR}/.git")
    execute_process(COMMAND ${GIT_EXECUTABLE} submodule update --init --recursive
                    WORKING_DIRECTORY ${CMAKE_CURRENT_SOURCE_DIR}
                    RESULT_VARIABLE GIT_SUBMOD_RESULT)
    if(NOT GIT_SUBMOD_RESULT EQUAL "0")
        message(FATAL_ERROR "git submodule update --init failed with ${GIT_SUBMOD_RESULT}, please checkout submodules")
    endif()
endif()
```

- 在 build 阶段运行命令

```cmake
find_package(PythonInterp REQUIRED)
add_custom_command(OUTPUT "${CMAKE_CURRENT_BINARY_DIR}/include/Generated.hpp"
    COMMAND "${PYTHON_EXECUTABLE}" "${CMAKE_CURRENT_SOURCE_DIR}/scripts/GenerateHeader.py" --argument
    DEPENDS some_target)

add_custom_target(generate_header ALL
    DEPENDS "${CMAKE_CURRENT_BINARY_DIR}/include/Generated.hpp")

install(FILES ${CMAKE_CURRENT_BINARY_DIR}/include/Generated.hpp DESTINATION include)
```

- cmake -E 运行内置命令

```cmake
# https://cmake.org/cmake/help/latest/manual/cmake.1.html#run-a-command-line-tool
```

### CMake 文件格式：

`cmake`能识别`CMakeLists.txt`和`*.cmake`格式的文件。`cmake`能够以三种方式 来组织文件：

| 类别                | 文件格式       |
| ------------------- | -------------- |
| Dierctory（文件夹） | CMakeLists.txt |
| Script（脚本）      | [script].cmake |
| Module（模块）      | [module].cmake |

- Directory

当CMake处理一个项目时，入口点是一个名为`CMakeLists.txt`的源文件，这个一定是根目录下的`CMakeLists.txt`。这个文件包含整个工程的构建规范，当我们有多个子文件夹需要编译时，使用`add_subdirectory(<dir_name>)`命令来为构建添加子目录。添加的每个子目录也必须包含一个`CMakeLists.txt`文件作为该子目录的入口点。每个子目录的`CMakeLists.txt`文件被处理时，CMake在构建树中生成相应的目录作为默认的工作和输出目录。这样我们就可以使用**外部构建**了。

- Script

一个单独的`<script>.cmake`源文件可以使用`cmake`命令行工具`cmake -P <script>.cmake`选项来执行脚本。脚本模式只是在给定的文件中运行命令，并且不生成构建系统。它不允许CMake命令定义或执行构建目标。

- Module

在Directory或Script中，CMake代码可以使用`include()`命令来加载脚本。`cmake`内置了许多模块用来帮助我们构建工程，如`CheckFunctionExists`(检查一个C函数是否存在)。也可以提供自己的模块，并在`CMAKE_MODULE_PATH`变量中指定它们的位置。

```cmake
include(CheckFunctionExists)
check_function_exists(log HAVE_LOG)
```

# 二、CMake 行为准则(Do's and Don'ts)

基于优秀的 gist [Effective Modern CMake](https://gist.github.com/mbinna/c61dbb39bca0e4fb7d1f73b0d66a4fd1)。**推荐进行阅读**。

## **CMake 应避免的行为**

- **不要使用具有全局作用域的函数**：包括 `link_directories`、 `include_libraries` 等函数。
- **不要添加非必要的 PUBLIC 要求**：应该避免把一些不必要的东西强加给用户（-Wall），应声明为 **PRIVATE**。
- **不要在file函数中添加 GLOB 文件**：如果不重新运行 CMake，Make 或者其他的工具将不会知道你是否添加了某个文件。值得注意的是，CMake 3.12 添加了一个 `CONFIGURE_DEPENDS` 标志。
- **将库文件直接链接到需要构建的目标上**：尽量采用Target的方式进行链接。
- **当链接target时，不要省略 PUBLIC或PRIVATE 关键字**

## **CMake 应遵守的规范**

- **把 CMake 视作代码**：应该和其他代码一样，整洁并且可读。
- **建立 targets 的观念**：使用target组织工程（使用target进行抽象）。
- **Export your interface**：保证 CMake 项目可以直接构建或安装。
- **编写 Config.cmake 文件**：编写供他人使用的库时，需要提供 Config.cmake 文件。
- **使用 ALIAS 保持使用的一致性**：使用 `add_subdirectory` 和 `find_package` 应该提供相同的目标和命名空间。
- **将常见的功能合并到有详细文档的函数或宏中**：函数往往是更好的选择。
- **使用小写的函数名**： CMake 的函数和宏的名字可以定义为大写或小写，但是一般都使用小写，变量名用大写。
- **使用** **`cmake_policy`** **和/或 限定版本号范围**： 每次改变版本特性 (policy) 都要有据可依。应该只有不得不使用旧特性时才降低特性 (policy) 版本。

# 三、Modern CMake

Modern CMake 主张放弃传统的基于变量的方法，提倡围绕 target 和 properties 设计和组织工程，通过 INTERFACE、PRIVATE、PUBLIC 进行依赖的传递与管理。

如果把一个Target想象成一个对象（Object），会发现两者的组织方式非常相似：

- 构造函数：
  - add_executable
  - add_library
- 成员函数：
  - get_target_property()
  - set_target_properties()
  - get_property(TARGET)
  - set_property(TARGET)
  - target_compile_definitions()
  - target_compile_features()
  - target_compile_options()
  - target_include_directories()
  - target_link_libraries()
  - target_sources()
- 成员变量
  - Target properties（太多）

## Build Specification 和 Usage Requirements：

在Target中有两个概念非常重要：Build Specification 和 Usage Requirements。这两个概念对于理解为什么现代CMake会如此设计提供了指导意义。

软件开发中依赖关系是十分常见且重要的的，C/C++通过 include 头文件的方式引入依赖，在动态或静态链接后可以调用依赖实现。 一个可执行程序可能会依赖链接库，链接库也同样可能依赖其他的链接库。 此时一个棘手的问题是，使用者如何知道**使用**这些外部依赖库需要什么条件？ 比如，其头文件的代码可能需要开启编译器 C++17 的支持、依赖存在许多动态链接库时可能只需要链接其中的一小部分、有哪些间接依赖需要安装、间接依赖的版本要求是什么……

对于这些问题，最简单粗暴的解决方案即文字说明，依赖库的作者可以在某个 README、网站、甚至在头文件里说明使用要求，但这种方式效率显然是很低下的。

CMake 提供的解决方案是，在对 target 进行配置时，可以规定配置的类型，分为 build specification 和 usage requirement 两类，会影响配置的应用范围。 Build specification 类型的配置仅在编译的时候需要满足，通过`PRIVATE`关键字声明； Usage requirement 类型的配置则是在使用时需要满足，即在其他项目里，使用本项目已编译好的 target 时需要满足，这种类型的配置使用`INTERFACE`关键词声明。 在实际工程中，有很多配置在编译时以及被使用时都需要被满足的，这种配置通过`PUBLIC`关键词进行声明。

- Non-INTERFACE_properties 定义了 target 的 Build specification。
- INTERFACE_properties 定义了 target 的 Usage requirement。

在Link时，

- `PRIVATE` Link 填充 Non-INTERFACE_properties。
- `INTERFACE` Link 填充 INTERFACE_properties。
- `PUBLIC` Link 填充 Non-INTERFACE_properties 和 INTERFACE_properties。

如：

```cmake
target_link_libraries(Foo
                PUBLIC Bar::Bar
                PRIVATE Cow::Cow
)
```

如上命令会对Foo的属性做如下修改：

- 添加`Bar::Bar`到`LINK_LIBRARIES`和`INTERFACE_LINK_LIBRARIES`中
- 添加`Cow::Cow`到`LINK_LIBRARIES`中
- 添加`Bar::Bar`的所有`INTERFACE_<property>`到`<property>`和`INTERFACE_<property>`
- 添加`Cow::Cow`的所有`INTERFACE_<property>`到`<property>`
- 添加`$<LINK_ONLY:Cow::Cow>`到`INTERFACE_LINK_LIBRARIES`中

## Interface library：

```cmake
add_library(Bar INTERFACE)
target_compile_definitions(Bar INTERFACE BAR=1)
```

Interface library只有 Usage Requirements，没有 Build Specification 。

总结来说，Build Specification 和 Usage Requirements 名副其实

- Build Specification 即编译时需要的配置，通过例如头文件目录、编译选项、链接库、宏定义等。它的作用是让编译通过。
- Usage Requirements 即外部使用我们项目时需要的配置。具体来说，一般通过 install 命令发布我们的库后，我们需要告诉使用者，需要引入的头文件目录在哪、需要添加哪些编译选项等。 它的作用是让使用者能够正确集成。

例：我们写了一个音频解码库，它：

- 链接了静态库 ffmpeg，使用到了 ffmpeg 的头文件和函数
- 在实现文件中使用到了 c++14 的特性

随后我们发布了这个库，其中有头文件和编译好的动态库链接。尽管我们在代码实现中使用了 c++14 语法，但是对外发布的头文件只用到了 c++03 的特性，也没有引入任何 ffmpeg 的代码。

这种情况下，其他工程在使用我们项目的 library 时，并不需要开启 c++14 特性，也不需要安装 ffmpeg。因此我们 library 可以这么写：

```cmake
target_compile_feature(my_lib PRIVATE cxx_std_14)
target_link_libraries(my_lib PRIVATE ffmpeg)
```

但如果我们对外提供的头文件中包括 c++14 的特性，那么需要使用 `PUBLIC`进行修饰

```cmake
target_compile_feature(my_lib PUBLIC cxx_std_14)
target_link_libraries(my_lib PRIVATE ffmpeg)
```

另一种情况，当我们提供的库是 header only 时，也就不需要编译了，这时候通过 `INTERFACE`修改配置，例如

```cmake
target_compile_feature(my_header_only_lib INTERFACE cxx_std_14)
```

## **寻找和使用链接库：**

CMake 中寻找链接库一般有如下两种方式

- **通过 Config file 找到依赖**

CMake 对 Config file 的命名是有规定的，对于`find_package(ABC)`这样一条命令，CMake 只会去寻找`ABCConfig.cmake`或是`abc-config.cmake`。 CMake 默认寻找的路径和平台有关，在 Linux 下寻找路径包括`/usr/lib/cmake`以及`/usr/lib/local/cmake`，在这两个路径下可以发现大量的 Config File，一般在安装某个库时，其自带的 Config file 会被放到这里来。

- **通过 Find file 找到依赖**

Config file 看似十分美好，由开发者编写 CMake 脚本，使用者只要能找到 Config file 即可获取到库的 usage requirement。 但现实是，并不是所有的开发者都使用 CMake，很多库并没有提供供 CMake 使用的 Config file，但此时我们还可以使用 Find file。

对于`find_package(ABC)`命令，如果 CMake 没有找到 Config file，他还会去试着寻找`FindABC.cmake`。Find file 在功能上和 Config file 相同，区别在于 Find file 是由其他人编写的，而非库的开发者。 如果你使用的某个库没有提供 Config file，你可以去网上搜搜 Find file 或者自己写一个，然后加入到你的 CMake 工程中。

一个好消息是 CMake 官方为我们写好了很多 Find file，在[CMake Documentation](https://cmake.org/cmake/help/latest/manual/cmake-modules.7.html#find-modules)这一页面可以看到，`OpenGL`，`OpenMP`，`SDL` 这些知名的库官方都为我们写好了 Find 脚本，因此直接调用`find_package` 命令即可。

坏消息是有更大部分库 CMake 官方也没有提供 Find file，这时候就要自己写了或者靠搜索了，写好后放到本项目的目录下，修改`CMAKE_MODULE_PATH`这个 CMake 变量即可。

## **Imported Target：**

在 C/C++工程里，对于依赖，我们最基本的要求就是知道他们的链接库路径和头文件目录，通过 CMake 的`find_library`和`find_path`两个命令就可以完成任务：

```cmake
find_library(MPI_LIBRARY
  NAMES mpi
  HINTS "${CMAKE_PREFIX_PATH}/lib" ${MPI_LIB_PATH}
  # 如果默认路径没找到libmpi.so，还会去MPI_LIB_PATH找，下游使用者可以设置这个变量值
)

find_path(MPI_INCLUDE_DIR
  NAMES mpi.h
  PATHS "${CMAKE_PREFIX_PATH}/include" ${MPI_INCLUDE_PATH}
  # 如果默认路径没找到mpi.h，还会去MPI_INCLUDE_PATH找，下游使用者可以设置这个变量值
)
```

于是在早期 CMake 时代，依赖的开发者在 CMake 脚本里通过全局变量来声明这两个东西。 比如名为 Abc 的库，其开发者在他的 CMake 脚本里会创建`Abc_INCLUDE_DIRS`和`Abc_LIBRARIES`两个变量供下游使用者使用。 这种命令尽管不是官方强制要求的，但大家都遵守了这个习惯，到了今天，很多库为了兼容旧 CMake 的使用方式，仍然提供这样的全局变量。

在现代 CMake 中，CMake 脚本提供一个 target 显然会更好，因为 target 具备属性，我们不光是要找到库，还需要了解库的使用方式，使用 target 除了头文件目录和链接库路径，我们还可以拿到更多关于库的信息。

因此现代 CMake 提供了一种特别的 target，Imported Target，创建命令为`add_library(Abc STATIC IMPORTRED)`，用于表示在项目外部已经存在、无需编译的依赖，命令的第二个参数用于说明类型，比如是静态库或动态库等。 对于 Imported Target 的名字，似乎开发者们都喜欢使用 namespace 的方式，比如`Boost::Format`、`Boost::Asio`等。 同样的，对于一个 CMake 脚本，可以有多个 Imported Target。

我们可以像对待普通 target 一样，对 Imported Target 调用`target_link_libraries`等命令来说明他的 usage requirement。 但其实还有另一种配置方式，上文提到过可以通过`PRIVATE`, `INTERFACE`, `PUBLIC`用于修饰 target 属性，这实际上可看作是一种语法糖。 在 CMake 中，target 的大多属性都有对应的 private 以及 interface 两个版本的变量。 比如通过`target_include_directories`命令配置头文件目录时，当使用`PRIVATE`修饰时，值被写入 target 的 `INCLUDE_DIRECTORIES`变量；使用`INTERFACE`修饰时，值写入`INTERFACE_INCLUDE_DIRECTORIES`变量；而使用`PUBLIC`时，则会写入两个变量。 在 CMake 中，我们可以不使用 target 命令，而是直接使用`set_target_properties`修改这些值的变量。

对于 Imported Target，当库已经事先编译好时，我们需要通过一个特殊的变量，`IMPORTED_LOCATION`，来指明动态链接库的具体位置。 这个变量就可以通过`set_target_properties`进行设置，在实际生产环境下，由于存在 Release 以及 Debug 环境的区别，`IMPORTED_LOCATION`实际上也存在多个版本，比如`IMPORTED_LOCATION_RELEASE`以及`IMPORTED_LOCATION_DEBUG`，都进行设置后，在对应的环境下，CMake 会根据这些变量为下游使用者选择正确的链接库。

详见：https://cmake.org/cmake/help/latest/guide/importing-exporting/index.html#importing-targets

```cmake
# spdlog库的Imported Target
set_target_properties(spdlog::spdlog PROPERTIES
  IMPORTED_LINK_INTERFACE_LANGUAGES_RELEASE "CXX"
  IMPORTED_LOCATION_RELEASE "${_IMPORT_PREFIX}/lib/spdlog/spdlog.lib"
)
```

使用 Imported Target 的另一个好处是，我们在引入一个依赖时只需要 link 其 Imported Target，不再需要手动加入其头文件目录了。因为依赖的头文件目录已经在其 target 的`INTERFACE`属性里了，而`INTERFACE`属性是可传递的，于是：

```cmake
find_package(spdlog REQUIRED)
add_executable(MyEXE)
target_source(MyExe "main.cpp")
target_link_libraries(MyExe SPDLog::spdlog)
```

无需`target_include_directories`，spdlog 的头文件目录自动会加进来。

回到`find_package`这个命令，这个命令可以指定很多参数，比如指定版本，指定具体的模块等等。 以 SFML 多媒体库为例，其包含了 network 模块，audio 模块，graphic 模块等等，但很多时候我们只需要其中的一个模块，那么其他的模块对应的链接库不需要被链接，于是 CMake 脚本可以这么写

```cmake
# 要求大版本号为2的SFML库的graphic模块
find_package(SFML 2 COMPONENTS graphics REQUIRED)
# SFML提供的target名字为sfml-graphics
target_link_libraries(MyEXE PRIVATE sfml-graphics)
```

对于`find_package`命令，这些版本、模块等参数在 Config file 或是 Find file 中显然是需要处理的，在版本不匹配，模块不存在的情况下应该对下游使用者进行提示。 这一方面 CMake 官方也为依赖开发者做了考虑，提供了`FindPackageHandleStandardArgs`这个模块，在 CMake 脚本中 include 此模块后，就可以使用`find_package_handle_standard_args`命令，来告知 CMake 如何获取当前 package 的版本变量，如何知道是否找到了库，比如下面针对 RapidJSON 的 cmake 脚本：

```cmake
include(FindPackageHandleStandardArgs)
find_package_handle_standard_args(RapidJSON
    REQUIRED_VARS RapidJSON_INCLUDE_DIR
    VERSION_VAR RapidJSON_VERSION
)
```

这段脚本声明了当前库的版本值应该从`RapidJSON_VERSION`这个变量拿，而`RapidJSON_INCLUDE_DIR`这个变量可以用于表明有没有找到库。 在执行这段脚本时，CMake 先去判断`RapidJSON_INCLUDE_DIR`这个变量是否为空，如果为空说明没找到库，CMake 会直接对下游使用者报错提示；如果此变量不为空，并且下游使用者在调用`find_package`时传入了版本号，CMake 则会从`RapidJSON_VERSION`变量中取值进行对比，如果版本不满足也报错提示。

## Exporting Targets：

编译通过后，为了方便别的项目使用，需要将我们的库导出，包括头文件、编译好的二进制库、以及库的基本信息。CMake 为我们提供了导出库的方式。

```cmake
set(QT_MIN_VERSION "5.15.2")

install(TARGETS Mylib
        EXPORT MylibTargets
        LIBRARY DESTINATION ${CMAKE_INSTALL_LIBDIR}
        ARCHIVE DESTINATION ${CMAKE_INSTALL_LIBDIR})

configure_file(${CMAKE_CURRENT_SOURCE_DIR}/MylibConfig.cmake.in
                                ${CMAKE_CURRENT_BINARY_DIR}/${APP_DOWNLOAD_PROXY_NAME}Config.cmake @ONLY)

install(DIRECTORY include/
        DESTINATION ${CMAKE_INSTALL_INCLUDEDIR})

# Export the targets to a script
install(EXPORT MylibTargets
        FILE
            MylibTargets.cmake
        NAMESPACE
            Mylib::
        DESTINATION
            "lib/cmake/Mylib"
        )

install(FILES
        ${CMAKE_CURRENT_SOURCE_DIR}/cmake/MylibConfig.cmake
        DESTINATION "lib/cmake/Mylib")
```

`MylibConfig.cmake.in` 内容如下：

```cmake
@PACKAGE_INIT@

include(CMakeFindDependencyMacro)
find_dependency(Qt5Core "@QT_MIN_VERSION@")

include("${CMAKE_CURRENT_LIST_DIR}/MylibTargets.cmake")
```

# 四、ECM

ECM，即Extra CMake Modules，是KDE提供的额外的CMake模块。包括如下几部分：

## 1. ecm-find-modules

ecm-find-modules是ECM的Modules查找模块，对没有提供CMake配置文件的软件包进行查找，对CMake原有的查找模块进行了补充。

使用方式如下：

```cmake
# 方式一
find_package(ECM REQUIRED NO_MODULE)
set(CMAKE_MODULE_PATH ${ECM_FIND_MODULE_DIR})

# 方式二
find_package(ECM REQUIRED NO_MODULE)
ecm_use_find_modules(
    DIR "${CMAKE_BINARY_DIR}/cmake"
    MODULES FindEGL.cmake
)
set(CMAKE_MODULE_PATH "${CMAKE_BINARY_DIR}/cmake")
```

例：

```cmake
find_package(GLIB2 REQUIRED)
Try to locate the GLib2 library. If found, this will define the following variables:

GLIB2_FOUND
True if the GLib2 library is available

GLIB2_INCLUDE_DIRS
The GLib2 include directories

GLIB2_LIBRARIES
The GLib2 libraries for linking

GLIB2_INCLUDE_DIR
Deprecated, use GLIB2_INCLUDE_DIRS

GLIB2_LIBRARY
Deprecated, use GLIB2_LIBRARIES

If GLIB2_FOUND is TRUE, it will also define the following imported target:

GLIB2::GLIB2
The GLIB2 library

Since 5.41.0.
find_package(7z REQUIRED)
Try to find 7z.

If the 7z executable is not in your PATH, you can provide an alternative name or full path location with the 7z_EXECUTABLE variable.

This will define the following variables:

7z_FOUND
TRUE if 7z is available

7z_EXECUTABLE
Path to 7z executable

If 7z_FOUND is TRUE, it will also define the following imported target:

7z::7z
Path to 7z executable

Since 5.85.0.
```

详细Find清单见：https://api.kde.org/ecm/manual/ecm-find-modules.7.html 

实现解析：

```cmake
find_program(7z_EXECUTABLE NAMES 7z.exe 7za.exe)

include(FindPackageHandleStandardArgs)
find_package_handle_standard_args(7z
    FOUND_VAR
        7z_FOUND
    REQUIRED_VARS
        7z_EXECUTABLE
)
mark_as_advanced(7z_EXECUTABLE)

if(NOT TARGET 7z::7z AND 7z_FOUND)
    add_executable(7z::7z IMPORTED)
    set_target_properties(7z::7z PROPERTIES
        IMPORTED_LOCATION "${7z_EXECUTABLE}"
    )
endif()

include(FeatureSummary)
set_package_properties(7z PROPERTIES
    URL "https://www.7-zip.org/"
    DESCRIPTION "Data (de)compression program"
)
```

## 2. ecm-kde-modules

ecm-kde-modules提供了KDE项目的一些基础、通用的配置。包括安装路径、编译选项、CMake设置等。

使用方式：

```cmake
find_package(ECM REQUIRED NO_MODULE)
set(CMAKE_MODULE_PATH ${ECM_KDE_MODULE_DIR})
```

例：

```cmake
include(KDEInstallDirs)

# 提供了 ${KDE_INSTALL_TARGETS_DEFAULT_ARGS} 等变量
# BINDIR、LIBDIR、QTQUICKIMPORTSDIR、QTPLUGINDIR、INCLUDEDIR
# 详见：https://api.kde.org/ecm/kde-module/KDEInstallDirs5.html#kde-module:KDEInstallDirs5
```

例：

```cmake
include(KDEClangFormat)
file(GLOB_RECURSE ALL_CLANG_FORMAT_SOURCE_FILES *.cpp *.h *.hpp *.c)
kde_clang_format(${ALL_CLANG_FORMAT_SOURCE_FILES})
```

使用此函数将创建一个 clang-format Target，该Target将使用预定义的 KDE clang-format 样式格式化`<files>`。为了进行格式化，可以执行（在`build`目录下）`cmake --build . --target clang-format`(或`make clang-format`或`ninja clang-format`)。可以使用`pre-commit hook`在提交前强制进行格式化。可参考`KDEGitCommitHooks`

执行Target之后来自 ECM的`.clang-format`文件将被复制到源目录。建议将其添加到`.gitignore`文件中：`/.clang-format`.

从 5.79 开始：如果源文件夹已经包含一个 .clang 格式的文件，则不会使用 ECM的`.clang-format`文件进行覆盖。如果目录应从格式中排除，则应创建一个`.clang-format`文件包含`DisableFormat: true`和`SortIncludes: false`

实现如下：

```cmake
# try to find clang-format in path
find_program(KDE_CLANG_FORMAT_EXECUTABLE clang-format)

# instantiate our clang-format file, must be in source directory for tooling if we have the tool
if(KDE_CLANG_FORMAT_EXECUTABLE)
    set(CLANG_FORMAT_FILE ${CMAKE_CURRENT_SOURCE_DIR}/.clang-format)
    if (EXISTS ${CLANG_FORMAT_FILE})
        file(READ ${CLANG_FORMAT_FILE} CLANG_FORMAT_CONTENTS LIMIT 1000)
        string(FIND "${CLANG_FORMAT_CONTENTS}" "This file got automatically created by ECM, do not edit" matchres)
        if(${matchres} EQUAL -1)
            message(WARNING "The .clang-format file already exists. Please remove it in order to use the file provided by ECM")
        else()
            configure_file(${CMAKE_CURRENT_LIST_DIR}/clang-format.cmake ${CLANG_FORMAT_FILE} @ONLY)
        endif()
    else()
        configure_file(${CMAKE_CURRENT_LIST_DIR}/clang-format.cmake ${CLANG_FORMAT_FILE} @ONLY)
    endif()
endif()

# formatting target
function(KDE_CLANG_FORMAT)
    if (TARGET clang-format)
        message(WARNING "the kde_clang_format function was already called")
        return()
    endif()

    # add target without specific commands first, we add the real calls file-per-file to avoid command line length issues
    add_custom_target(clang-format COMMENT "Formatting sources in ${CMAKE_CURRENT_SOURCE_DIR} with ${KDE_CLANG_FORMAT_EXECUTABLE}...")

    # run clang-format only if available, else signal the user what is missing
    if(KDE_CLANG_FORMAT_EXECUTABLE)
        get_filename_component(_binary_dir ${CMAKE_BINARY_DIR} REALPATH)
        foreach(_file ${ARGV})
            # check if the file is inside the build directory => ignore such files
            get_filename_component(_full_file_path ${_file} REALPATH)
            string(FIND ${_full_file_path} ${_binary_dir} _index)
            if(NOT _index EQUAL 0)
                add_custom_command(TARGET clang-format
                    COMMAND
                        ${KDE_CLANG_FORMAT_EXECUTABLE}
                        -style=file
                        -i
                        ${_full_file_path}
                    WORKING_DIRECTORY
                        ${CMAKE_CURRENT_SOURCE_DIR}
                    COMMENT
                        "Formatting ${_full_file_path}..."
                    )
            endif()
        endforeach()
    else()
        add_custom_command(TARGET clang-format
            COMMAND
                ${CMAKE_COMMAND} -E echo "Could not set up the clang-format target as the clang-format executable is missing."
            )
    endif()
endfunction()
```

例：

```cmake
include(KDEGitCommitHooks)
kde_configure_git_pre_commit_hook(CHECKS CLANG_FORMAT)
# 调用 git clang-format
# 详见：https://api.kde.org/ecm/kde-module/KDEGitCommitHooks.html#kde-module:KDEGitCommitHooks
```

实现如下：

```cmake
# try to find clang-format in path
find_program(KDE_CLANG_FORMAT_EXECUTABLE clang-format)
include(CMakeParseArguments)
set(PRE_COMMIT_HOOK_UNIX "${CMAKE_CURRENT_LIST_DIR}/kde-git-commit-hooks/pre-commit.in")
set(CLANG_FORMAT_UNIX "${CMAKE_CURRENT_LIST_DIR}/kde-git-commit-hooks/clang-format.sh")

function(KDE_CONFIGURE_GIT_PRE_COMMIT_HOOK)
    set(_oneValueArgs "")
    set(_multiValueArgs CHECKS)
    cmake_parse_arguments(ARG "" "${_oneValueArgs}" "${_multiValueArgs}" ${ARGN} )

    if(NOT CMAKE_PROJECT_NAME STREQUAL PROJECT_NAME)
        message(STATUS "Project is not top level project - pre-commit hook not installed")
        return()
    endif()

    if(NOT ARG_CHECKS)
        message(FATAL_ERROR "No checks were specified")
    endif()
    set(GIT_DIR "${CMAKE_SOURCE_DIR}/.git")

    if (NOT IS_DIRECTORY ${GIT_DIR} # In case of tarballs there is no .git directory
        OR NOT (UNIX OR WIN32)
    )
        return()
    endif()
    if (COMMAND KDE_CLANG_FORMAT)
        set(HAS_CLANG_FORMAT_COMMAND_INCLUDED TRUE)
    else()
        set(HAS_CLANG_FORMAT_COMMAND_INCLUDED FALSE)
    endif()

    set(_write_hook FALSE)
    if(KDE_CLANG_FORMAT_EXECUTABLE)
        list(FIND ARG_CHECKS "CLANG_FORMAT" _index)
        if (${_index} GREATER -1)
            set(CLANG_FORMAT_SCRIPT "\"$(git rev-parse --git-common-dir)\"/hooks/scripts/clang-format.sh")
            configure_file(${CLANG_FORMAT_UNIX} "${GIT_DIR}/hooks/scripts/clang-format.sh" @ONLY)
            set(_write_hook TRUE)
        endif()
    else()
        message(WARNING "No clang-format executable was found, skipping the formatting pre-commit hook")
    endif()

    if(NOT _write_hook)
        return()
    endif()

    set(_hook_file "${GIT_DIR}/hooks/pre-commit")
    # Doesn't exist? write away
    if(NOT EXISTS ${_hook_file})
        configure_file(${PRE_COMMIT_HOOK_UNIX} "${GIT_DIR}/hooks/pre-commit")
        return()
    endif()

    file(READ ${_hook_file} _contents)

    # For when CLANG_FORMAT_SCRIPT didn't have the 'git rev-parse --git-common-dir' part
    set(_old_cmd "./.git/hooks/scripts/clang-format.sh")
    string(FIND "${_contents}" "${_old_cmd}" _idx)
    if (${_idx} GREATER -1)
        string(REPLACE "${_old_cmd}" "${CLANG_FORMAT_SCRIPT}" _contents "${_contents}")
        file(WRITE ${_hook_file} "${_contents}")
        return()
    endif()

    string(FIND "${_contents}" "${CLANG_FORMAT_SCRIPT}" _idx)
    # File exists and doesn't have the clang-format.sh line, append it
    # so as to not overwrite users' customisations
    if (_idx EQUAL -1)
        file(APPEND ${_hook_file} "${CLANG_FORMAT_SCRIPT}")
    endif()
endfunction()
```

## 3. ecm-modules

ecm-modules在原有CMake函数的基础上提供了额外的宏和函数。

详见：https://api.kde.org/ecm/manual/ecm-modules.7.html

使用方式如下：

```cmake
find_package(ECM REQUIRED NO_MODULE)
set(CMAKE_MODULE_PATH ${ECM_MODULE_DIR})
```

例：

```cmake
include(ECMSetupVersion)
ecm_setup_version(<version>
                  VARIABLE_PREFIX <prefix>
                  [SOVERSION <soversion>]
                  [VERSION_HEADER <filename>]
                  [PACKAGE_VERSION_FILE <filename> [COMPATIBILITY <compat>]] )

# <major>.<minor>.<patch>.<tweak>
# 头文件中将生成如下宏
# <prefix>_VERSION_MAJOR  - <major>
# <prefix>_VERSION_MINOR  - <minor>
# <prefix>_VERSION_PATCH  - <patch>
# <prefix>_VERSION        - <version>
# <prefix>_SOVERSION      - <soversion>, or <major> if SOVERSION was not given

ecm_setup_version(${MYAPP_VERSION}
                  VARIABLE_PREFIX MyApp
                  VERSION_HEADER "${CMAKE_CURRENT_BINARY_DIR}/myapp_version.h" )
```

例：

```cmake
include(ECMQtDeclareLoggingCategory)
ecm_qt_declare_logging_category(<sources_var_name(|target (since 5.80))>
    HEADER <filename>
    IDENTIFIER <identifier>
    CATEGORY_NAME <category_name>
    [OLD_CATEGORY_NAMES <oldest_cat_name> [<second_oldest_cat_name> [...]]]
    [DEFAULT_SEVERITY <Debug|Info|Warning|Critical|Fatal>]
    [EXPORT <exportid>]
    [DESCRIPTION <description>]
)

ecm_qt_declare_logging_category(MYAPP_LOG_SOURCES
    HEADER myapp_debug.h
    IDENTIFIER MYAPP_LOG
    CATEGORY_NAME com.my.app
    DEFAULT_SEVERITY ${LOG_LEVEL}
    DESCRIPTION "myapp"
)
// This file was generated by ecm_qt_declare_logging_category(): DO NOT EDIT!

#ifndef ECM_QLOGGINGCATEGORY_MYAPP_LOG_OCEANSTORE_DEBUG_H
#define ECM_QLOGGINGCATEGORY_MYAPP_LOG_OCEANSTORE_DEBUG_H

#include <QLoggingCategory>

Q_DECLARE_LOGGING_CATEGORY(MYAPP_LOG)

#endif
// This file was generated by ecm_qt_declare_logging_category(): DO NOT EDIT!

#include "myapp_debug.h"

#if QT_VERSION >= QT_VERSION_CHECK(5, 4, 0)
Q_LOGGING_CATEGORY(MYAPP_LOG, "com.my.app", QtDebugMsg)
#else
Q_LOGGING_CATEGORY(MYAPP_LOG, "com.my.app")
#endif
```

例：

```cmake
include(ECMFindQmlModule)
ecm_find_qmlmodule(<module_name> <version>...)

ecm_find_qmlmodule(org.kde.kirigami 2.1)
```

该函数可以在编译时查找Qml模块，它使用`qmlplugindump`应用对模块进行查找并将其设置成为运行依赖。

例：

```cmake
include(ECMGenerateDBusServiceFile)
ecm_generate_dbus_service_file(
    NAME <service name>
    EXECUTABLE <executable>
    [SYSTEMD_SERVICE <systemd service>]
    DESTINATION <install_path>
    [RENAME <dbus service filename>] # Since 5.75
)

ecm_generate_dbus_service_file(
    NAME org.kde.kded5
    EXECUTABLE ${KDE_INSTALL_FULL_BINDIR}/kded5
    DESTINATION ${KDE_INSTALL_DBUSSERVICEDIR}
)
```

例：

```cmake
include(ECMConfiguredInstall)
ecm_install_configured_files(
    INPUT <file> [<file2> [...]]
    DESTINATION <INSTALL_DIRECTORY>
    [COPYONLY]
    [ESCAPE_QUOTES]
    [@ONLY]
    [COMPONENT <component>])

ecm_install_configured_files(INPUT foo.txt.in DESTINATION ${KDE_INSTALL_DATADIR} @ONLY)
```

在安装`foo.txt`文件时，同时进行configure。

例：

```cmake
include(ECMEnableSanitizers)

mkdir build
cd build
cmake -DECM_ENABLE_SANITIZERS='address;leak;undefined' ..
# 注意大多数的检查需要添加 -DCMAKE_CXX_COMPILER=clang++
```

## 4. ecm-toolchains

ecm-toolchains提供了一些工具链，目前仅包括AndroidToolchain。

详见：https://api.kde.org/ecm/manual/ecm-toolchains.7.html

---

**TODO**
* 在CMake中配置Clang-Tidy
* CPack、CTest

# 参考资料

- [https://cmake.org/cmake/help/latest/#](https://cmake.org/cmake/help/latest/)
- https://api.kde.org/ecm/index.html
- https://cliutils.gitlab.io/modern-cmake/
- https://www.youtube.com/watch?v=bsXLMQ6WgIk
- https://www.bookstack.cn/read/CMake-Cookbook/README.md
- https://zhuanlan.zhihu.com/p/76975231
- https://ukabuer.me/blog/more-modern-cmake/