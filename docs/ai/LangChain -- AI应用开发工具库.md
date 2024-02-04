# LangChain -- AI应用开发工具库
<br>

# 为什么需要 LangChain

参考：https://mp.weixin.qq.com/s/3coFhAdzr40tozn8f9Dc-w

随着 LLM(Large Language Models) 的热度越来越高，众多AI应用开发者们逐渐发现，想要构建一个AI应用，仅仅只依靠 LLM 的API是远远不够的。当前模型本身的两点局限：

1. 无法与外界环境交互，包括但不限于搜索信息、查找数据库、调用API等。
2. 支持的 Token 数量有限，无法传递大量信息给 LLM，这样 LLM 只能根据自己的“记忆”回答问题，并且经常给出与事实相悖的答案。

这就需要为模型注入 Context 并进行一定的 Prompt Engineering。正确的 Prompt 可以激发出 LLM 的能力，这在 GPT-3.5 以前的时代更为重要。将 Context 注入 LLM 实际上在 Prompt Engineering 的上游，把知识告诉 LLM，Prompt 只是中间桥梁。前 Stitch Fix 的 ML 总监 John McDonnell 画的这幅图很好地展示出了二者的关系：

![image-20240204161347728](assets/LangChain%20--%20AI%E5%BA%94%E7%94%A8%E5%BC%80%E5%8F%91%E5%B7%A5%E5%85%B7%E5%BA%93/image-20240204161347728.jpg)

目前已经有了成熟的解决方案来绕开 Token 数量的限制。通常的方法借鉴了 Map Reduce 的思想，涉及到给文档切片、使用 Embedding 引擎、向量数据库和语义搜索（具体会在下文中介绍）。

关于与外部环境交互的探索也有很多，OpenAI 的 WebGPT 给模型注入了使用网页信息的能力，Adept 训练的 ACT-1 则能自己去网站和使用 Excel、Salesforce 等软件，PaLM 的 SayCan 和 PaLM-E 尝试让 LLM 和机器人结合，Meta 的 Toolformer 探索让 LLM 自行调用 API，普林斯顿的 Shunyu Yao 做出的 ReAct 工作通过结合思维链 prompting 让 LLM 能够搜索和使用维基百科的信息。

有了这些工作，在开源模型或者 API 之上，开发者们终于可以做有相对复杂步骤和业务逻辑的 AI 应用。而 LangChain 是一个开源的 Python 库（后续又推出了 Typescript 版本），封装好了大量的相关逻辑和代码实现，开发者们可以直接调用，大大加速了构建一个应用的速度。

如果没有 LangChain，这些探索可能首先将被局限在 Adept、Cohere 等有充足产研资源的公司身上，或仅仅停留在论文层面。然后随着时间推移，开发者需要闷头码个几周来复现这些逻辑。但是有了 LangChain，做一个基于公司内部文档的问答机器人通常只需要两天，而直接 fork 别人基于 LangChain 的代码构建个人的 Notion 问答机器人则只需要几个小时。

# LangChain 简介

LangChain 是由前 Robust Intelligence 的机器学习工程师 Chase Harrison 在 22 年 10 月底推出的，是论文《ReAct: Synergizing Reasoning and Acting in Language Models》的实现，是一个封装了大量 LLM(Large Language Models) 应用开发逻辑和相关工具的开源 Python 库。目前，LangChain 已经成为了 AI 应用开发的新手必备套件之一。

![image-20240204161353293](assets/LangChain%20--%20AI%E5%BA%94%E7%94%A8%E5%BC%80%E5%8F%91%E5%B7%A5%E5%85%B7%E5%BA%93/image-20240204161353293.jpg)

随着 Harrison 为 LangChain 添加了很多实用的抽象，以及 23 年 1 月众多 AI Hackathon 决赛项目使用 LangChain，它的 Github Star 迅速破万（截止至2023.08.01 Star数为57K），成为 LLM 应用开发者选择中间件时想到的第一个名字。

2023 年 3 月，ChatGPT 的 API 因升级降价大受欢迎，LangChain 的使用也随之爆炸式增长。

这之后，LangChain 在没有任何收入也没有任何明显的创收计划的情况下，获得了 1000 万美元的种子轮融资和 2000-2500 万美元的 A 轮融资，估值达到 2 亿美元左右。

LangChain可以为LLM应用提供如下能力（来自官方文档）：

- Data-aware: connect a language model to other sources of data
- Agentic: allow a language model to interact with its environment

> The main value props of LangChain are:
>
> - Components: abstractions for working with language models, along with a collection of implementations for each abstraction. Components are modular and easy-to-use, whether you are using the rest of the LangChain framework or not
> - Off-the-shelf chains: a structured assembly of components for accomplishing specific higher-level tasks
>
> Off-the-shelf chains make it easy to get started. For more complex applications and nuanced use-cases, components make it easy to customize existing chains or build new ones.

# 从不同的视角看 LangChain

以下内容来自https://mp.weixin.qq.com/s/3coFhAdzr40tozn8f9Dc-w

从**开发者视角**看，LangChain 是个挺友好且优美的库：

- 它非常模块化，还通过 Chain、Agent、Memory 对 LLM 的抽象帮助开发者提高了构建较复杂逻辑应用的效率；而且每个模块有很好的可组合性，能实现 LLM 与其他工具的组合、Chain 与 Chain 的嵌套等逻辑；
- 它一站式集成了所有工具，从各种非结构化数据的预处理、不同的 LLM、中间的向量和图数据库和最后的模型部署，贡献者都帮 LangChain 跟各种工具完成了迅速、全面的集成。

作为**成长期投资者**看 LangChain，它本身还太早期，远没到成长逻辑。除此之外，我对它在商业层面未来发展的核心担忧在于：

- 我们不能直接套用旧时代的中间件视角，随着 ChatGPT Plug-In 出现和 OpenAI 的更多边界延伸，LangChain 的价值可能被取代，很快像机器学习历史上的其他明星库一样隐入尘埃；
- LangChain 本身的壁垒也比较薄，是“其他开源库身上的开源库”，没有太多技术壁垒，只是替大家省下来了码的时间。如果要收费使用，很多开发者可能会选择自己把 LangChain 这套东西码出来；
- 目前使用 LangChain 库的以个人开发者和极客的 side project 为主，还不是正经的企业级 LLM 集成工具，而稍微有点体量的公司都会选择 fork LangChain 的源码或者干脆自己再码套框架。

从**投资人**的角度看，LangChain 的创始人 Harrison Chase 想做的不止是 LangChain 这个开源库而已，我们比较期待他服务 AI 应用开发者的下一步动作。

# LangChain 的主要模块

LangChain 官方把 LangChain 划分为如下几个模块

- Model I/O：模型与IO
  - Prompts: 模板化、动态选择和管理模型输入。
    - ![image-20240204161358329](assets/LangChain%20--%20AI%E5%BA%94%E7%94%A8%E5%BC%80%E5%8F%91%E5%B7%A5%E5%85%B7%E5%BA%93/image-20240204161358329.jpg)

    - 一个 Prompt 通常由 Instructions、Context、Input Data（比如输入的问题）和 Output Indicator（通常是对输出数据格式的约定）。使用 LangChain 的 Prompt Template 很好地定义各个部分，同时将 Input Data 留作动态输入项。
  - Language models: 通过通用接口调用不同的大型语言模型。
    - AI21、Aleph Alpha、Amazon API Gateway、Anyscale、Azure OpenAI、OpenAI、OpenLLM、OpenLM等。
    - FakeLLM：可用于测试
    - Usage tracking：Token 使用量记录
    - 支持多个模型对比
  - Output parsers: 从模型输出中提取信息。
  - ![image-20240204161402185](assets/LangChain%20--%20AI%E5%BA%94%E7%94%A8%E5%BC%80%E5%8F%91%E5%B7%A5%E5%85%B7%E5%BA%93/image-20240204161402185.jpg)
- Data connection：帮助大语言模型从用户特定的数据集中获取上下文信息
  - Document loaders: 从不同的源中加载文档。
    - Airbyte json、email、Markdown、Google Drive、 PDF、 PowerPoint、 YouTube等大量格式。
  - Document transformers: 文档拆分，文档转换，文档冗余删除等。
  - Text embedding models: 将文本转化为embedding向量。
    - 多种模型支持，如OpenAIEmbeddingsAPI等。
  - Vector stores: 存储和搜索embedding向量。
    - Chroma、Milvus、Pinecone、Weaviate、Qdrant等。
  - Retrievers: 在构建的数据集中查询。
- Chains：在 LLM 之间，或 LLM 与工具、数据集等外部环境之间建立连接。
  - ![image-20240204161406266](assets/LangChain%20--%20AI%E5%BA%94%E7%94%A8%E5%BC%80%E5%8F%91%E5%B7%A5%E5%85%B7%E5%BA%93/image-20240204161406266.jpg)

  - LLMChain：Prompt格式化 + LLM 调用
  - 各类工具Chain：API、Math、Bash、web request、SQLdb...
  - LangChainHub : https://github.com/hwchase17/langchain-hub
- Memory：保存 LLM 的上下文、历史记录等状态
  - 在收到初始用户输入后执行核心逻辑之前，从 Memory 中读取并扩充用户输入。
  - 在执行核心逻辑后返回答案前，将当前输入和输出写入 Memory，以便未来引用。
  - ![image-20240204161409797](assets/LangChain%20--%20AI%E5%BA%94%E7%94%A8%E5%BC%80%E5%8F%91%E5%B7%A5%E5%85%B7%E5%BA%93/image-20240204161409797.jpg)

  - 内存缓存支持。
  - SQLite、Redis、SQLAlchemy 等数据库缓存支持。
  - Entity Memory：为 LLM 提供长期记忆
    - ![image-20240204161412982](assets/LangChain%20--%20AI%E5%BA%94%E7%94%A8%E5%BC%80%E5%8F%91%E5%B7%A5%E5%85%B7%E5%BA%93/image-20240204161412982.jpg)
- Agents：让 LLM 自主选择应该使用的工具。
  - ![image-20240204161416135](assets/LangChain%20--%20AI%E5%BA%94%E7%94%A8%E5%BC%80%E5%8F%91%E5%B7%A5%E5%85%B7%E5%BA%93/image-20240204161416135.jpg)

  - Agents 的核心思想是使用 LLM 选择一系列要执行的动作。在 Chain 中，要执行的动作是在代码中硬编码的。而在 Agents 中，LLM 则被用作推理引擎，确定要执行哪些动作以及这些动作的执行顺序。
  - Agent
    - Agent Type: https://python.langchain.com/docs/modules/agents/agent_types/
      - 决定了 Agent 的 Prompt，具体会在下文中详细介绍。
    - 这个类负责决定下一步要采取什么行动。它由 LLM 和 Prompt 驱动。Prompt 包含以下内容：
    - Agent 的个性，用于让它以某种方式回应。
    - Agent 的背景上下文，用于为它提供更多关于其被要求执行的任务的信息。
    - 使结果更好的提示词工程（Prompt Engineering），最著名/广泛使用的是 React。
  - Tools
    - Tools 是 Agent 调用的函数。这里有两个重要的考虑因素：
      - 让 Agent 可以正确的访问工具
      - 以对 Agent 最有帮助的方式描述工具
    - LangChain 内部实现了很多 Tools
      - 详见 https://python.langchain.com/docs/integrations/tools/
      - 包括 Bash命令执行工具、Google搜索工具、维基百科查询工具、Wolfram Alpha查询工具等
  - Toolkits
    - 完成特定目标所需的一组工具。工具包中通常有大约 3-5 个工具。
    - 包括Github Toolkit、Gmail Toolkit、CSV Toolkit等。
  - AgentExecutor
    - AgentExecutor 是 Agent 的运行时。这是实际调用 Agent 并执行其选择的操作的部分。
      - ```Bash
        next_action = agent.get_action(...)
        while next_action != AgentFinish:
            observation = run(next_action)
            next_action = agent.get_action(..., next_action, observation)
        return next_action
        ```
    - 处理 Agent 选择不存在的工具的情况
    - 处理工具出错的情况
    - 处理 Agent 生成无法解析工具输出的情况
    - 在所有级别（Agent 决策、工具调用）中保存Log（标准输出 or LangSmith）。
- Callbacks：在 LLM 运行的各个阶段提供 Hook 点
  - LangChain 内置了很多 Callbacks，可以很方便的与各个工具配合使用。

总结：LangChain 在众多的开源库之上做了整合，提供了一整套 AI 应用开发的解决方案。在众多 LLM 之上抽象出了一套通用的接口，并把常用的 AI 开发业务逻辑进行封装（Memory、Chain、Agent等），还封装了很多工具的接口，方便应用开发者快速开发应用。极大的简化了应用开发流程。

# LangChain Agent Type & Prompt

## Agent Type 简介

LangChain 目前支持的 Agent Type 如下：

- ZERO_SHOT_REACT_DESCRIPTION、CHAT_ZERO_SHOT_REACT_DESCRIPTION
  - 使用 ReAct 框架来决定使用哪些工具，以及使用工具的顺序。不具有聊天能力，没有上下文短期记忆。CHAT_ZERO_SHOT_REACT_DESCRIPTION 会区分 system、user、assistant 等，调用 OpenAI API 效果更好。
- STRUCTURED_CHAT_ZERO_SHOT_REACT_DESCRIPTION
  - 与 ZERO_SHOT_REACT_DESCRIPTION 相比，可以使用输入更加复杂的工具进行更加精确的操作。
- OPENAI_FUNCTIONS、OPENAI_MULTI_FUNCTIONS
  - 某些 OpenAI 模型（如 gpt-3.5-turbo-0613 和 gpt-4-0613）已经经过了特别的微调，可以更好的调用函数。（体现在调用 API 的时拥有专门的参数可以传递 function 信息）
- CONVERSATIONAL_REACT_DESCRIPTION、CHAT_CONVERSATIONAL_REACT_DESCRIPTION
  - 与 ZERO_SHOT_REACT_DESCRIPTION 相比，具有聊天能力，以及上下文短期记忆。
- SELF_ASK_WITH_SEARCH
  - 在回答问题的时候会进行自我提问，当发觉信息不够时会进行搜索。
- REACT_DOCSTORE
  - [ReAct](https://arxiv.org/pdf/2210.03629.pdf) 论文的原始实现，必须提供 Search、Lookup 两个工具。Search 工具用来查找一篇与问题相关的文档。Lookup工具用来在文档中查找需要的信息。

## Prompt

### ZERO_SHOT_REACT_DESCRIPTION、CHAT_ZERO_SHOT_REACT_DESCRIPTION

- ZERO_SHOT_REACT_DESCRIPTION

```Plain
Answer the following questions as best you can. You have access to the following tools:

|Tool-1 name|: |Tool-1 description|
|Tool-2 name|: |Tool-2 description|

Use the following format:

Question: the input question you must answer
Thought: you should always think about what to do
Action: the action to take, should be one of [|Tool-1 name|, |Tool-2 name|]
Action Input: the input to the action
Observation: the result of the action
... (this Thought/Action/Action Input/Observation can repeat N times)
Thought: I now know the final answer
Final Answer: the final answer to the original input question

Begin!

Question: |user input|
Thought:
```

- CHAT_ZERO_SHOT_REACT_DESCRIPTION

~~~Plain
System: Answer the following questions as best you can. You have access to the following tools:

|Tool-1 name|: |Tool-1 description|
|Tool-2 name|: |Tool-2 description|

The way you use the tools is by specifying a json blob.
Specifically, this json should have a `action` key (with the name of the tool to use) and a `action_input` key (with the input to the tool going here).

The only values that should be in the "action" field are: |Tool-1 name|, |Tool-2 name|

The $JSON_BLOB should only contain a SINGLE action, do NOT return a list of multiple actions. Here is an example of a valid $JSON_BLOB:

```
{
  "action": $TOOL_NAME,
  "action_input": $INPUT
}
```

ALWAYS use the following format:

Question: the input question you must answer
Thought: you should always think about what to do
Action:
```
$JSON_BLOB
```
Observation: the result of the action
... (this Thought/Action/Observation can repeat N times)
Thought: I now know the final answer
Final Answer: the final answer to the original input question

Begin! Reminder to always use the exact characters `Final Answer` when responding.
Human: |user input|
~~~

### STRUCTURED_CHAT_ZERO_SHOT_REACT_DESCRIPTION

~~~Plain
System: Respond to the human as helpfully and accurately as possible. You have access to the following tools:

|Tool-1 name|: |Tool-1 description|, args: {{'tool_input': {{'type': 'string'}}}}
|Tool-2 name|: |Tool-2 description|, args: {{'arg_1_name': {{'title': 'Arg 1 Name', 'type': 'string'}}, 'arg_2_name': {{'title': 'Arg 2 Name', 'type': 'integer'}}}}

Use a json blob to specify a tool by providing an action key (tool name) and an action_input key (tool input).

Valid "action" values: "Final Answer" or |Tool-1 name|, |Tool-2 name|

Provide only ONE action per $JSON_BLOB, as shown:

```
{
  "action": $TOOL_NAME,
  "action_input": $INPUT
}
```

Follow this format:

Question: input question to answer
Thought: consider previous and subsequent steps
Action:
```
$JSON_BLOB
```
Observation: action result
... (repeat Thought/Action/Observation N times)
Thought: I know what to respond
Action:
```
{
  "action": "Final Answer",
  "action_input": "Final response to human"
}
```

Begin! Reminder to ALWAYS respond with a valid json blob of a single action. Use tools if necessary. Respond directly if appropriate. Format is Action:```$JSON_BLOB```then Observation:.
Thought:
Human: |user input|
~~~

### CONVERSATIONAL_REACT_DESCRIPTION、CHAT_CONVERSATIONAL_REACT_DESCRIPTION

CONVERSATIONAL_REACT_DESCRIPTION

~~~Plain
Assistant is a large language model trained by OpenAI.

Assistant is designed to be able to assist with a wide range of tasks, from answering simple questions to providing in-depth explanations and discussions on a wide range of topics. As a language model, Assistant is able to generate human-like text based on the input it receives, allowing it to engage in natural-sounding conversations and provide responses that are coherent and relevant to the topic at hand.

Assistant is constantly learning and improving, and its capabilities are constantly evolving. It is able to process and understand large amounts of text, and can use this knowledge to provide accurate and informative responses to a wide range of questions. Additionally, Assistant is able to generate its own text based on the input it receives, allowing it to engage in discussions and provide explanations and descriptions on a wide range of topics.

Overall, Assistant is a powerful tool that can help with a wide range of tasks and provide valuable insights and information on a wide range of topics. Whether you need help with a specific question or just want to have a conversation about a particular topic, Assistant is here to assist.

TOOLS:
------

Assistant has access to the following tools:

> |Tool-1 name|: |Tool-1 description|
> |Tool-2 name|: |Tool-2 description|

To use a tool, please use the following format:

```
Thought: Do I need to use a tool? Yes
Action: the action to take, should be one of [|Tool-1 name|, |Tool-2 name|]
Action Input: the input to the action
Observation: the result of the action
```

When you have a response to say to the Human, or if you do not need to use a tool, you MUST use the format:

```
Thought: Do I need to use a tool? No
AI: [your response here]
```

Begin!

Previous conversation history:
|chat history|

New input: |user input|
~~~

CHAT_CONVERSATIONAL_REACT_DESCRIPTION

~~~Plain
System: Assistant is a large language model trained by OpenAI.

Assistant is designed to be able to assist with a wide range of tasks, from answering simple questions to providing in-depth explanations and discussions on a wide range of topics. As a language model, Assistant is able to generate human-like text based on the input it receives, allowing it to engage in natural-sounding conversations and provide responses that are coherent and relevant to the topic at hand.

Assistant is constantly learning and improving, and its capabilities are constantly evolving. It is able to process and understand large amounts of text, and can use this knowledge to provide accurate and informative responses to a wide range of questions. Additionally, Assistant is able to generate its own text based on the input it receives, allowing it to engage in discussions and provide explanations and descriptions on a wide range of topics.

Overall, Assistant is a powerful system that can help with a wide range of tasks and provide valuable insights and information on a wide range of topics. Whether you need help with a specific question or just want to have a conversation about a particular topic, Assistant is here to assist.
Human: |Human input|
AI: |AI output|
Human: TOOLS
------
Assistant can ask the user to use tools to look up information that may be helpful in answering the users original question. The tools the human can use are:

> |Tool-1 name|: |Tool-1 description|
> |Tool-2 name|: |Tool-2 description|

RESPONSE FORMAT INSTRUCTIONS
----------------------------

When responding to me, please output a response in one of two formats:

**Option 1:**
Use this if you want the human to use a tool.
Markdown code snippet formatted in the following schema:

```json
{
    "action": string, \ The action to take. Must be one of |Tool-1 name|, |Tool-2 name|
    "action_input": string \ The input to the action
}
```

**Option #2:**
Use this if you want to respond directly to the human. Markdown code snippet formatted in the following schema:

```json
{
    "action": "Final Answer",
    "action_input": string \ You should put what you want to return to use here
}
```

USER'S INPUT
--------------------
Here is the user's input (remember to respond with a markdown code snippet of a json blob with a single action, and NOTHING else):

|user input|
~~~

### SELF_ASK_WITH_SEARCH

```Plain
Question: Who lived longer, Muhammad Ali or Alan Turing?
Are follow up questions needed here: Yes.
Follow up: How old was Muhammad Ali when he died?
Intermediate answer: Muhammad Ali was 74 years old when he died.
Follow up: How old was Alan Turing when he died?
Intermediate answer: Alan Turing was 41 years old when he died.
So the final answer is: Muhammad Ali

Question: When was the founder of craigslist born?
Are follow up questions needed here: Yes.
Follow up: Who was the founder of craigslist?
Intermediate answer: Craigslist was founded by Craig Newmark.
Follow up: When was Craig Newmark born?
Intermediate answer: Craig Newmark was born on December 6, 1952.
So the final answer is: December 6, 1952

Question: Who was the maternal grandfather of George Washington?
Are follow up questions needed here: Yes.
Follow up: Who was the mother of George Washington?
Intermediate answer: The mother of George Washington was Mary Ball Washington.
Follow up: Who was the father of Mary Ball Washington?
Intermediate answer: The father of Mary Ball Washington was Joseph Ball.
So the final answer is: Joseph Ball

Question: Are both the directors of Jaws and Casino Royale from the same country?
Are follow up questions needed here: Yes.
Follow up: Who is the director of Jaws?
Intermediate answer: The director of Jaws is Steven Spielberg.
Follow up: Where is Steven Spielberg from?
Intermediate answer: The United States.
Follow up: Who is the director of Casino Royale?
Intermediate answer: The director of Casino Royale is Martin Campbell.
Follow up: Where is Martin Campbell from?
Intermediate answer: New Zealand.
So the final answer is: No

Question: |user input|
Are followup questions needed here:
```

## OpenAI Function Call

OPENAI_FUNCTIONS、OPENAI_MULTI_FUNCTIONS 这两种 Agent Type，主要是为了适配 OpenAI 在2023年6月13日推出的 gpt-4-0613 和 gpt-3.5-turbo-0613。这两个模型经过了微调，支持在API中指定模型可以交互的function。模型在推理时更好的处理对 function 的调用并使用 JSON 格式返回响应。（详见：https://platform.openai.com/docs/guides/gpt/function-calling)（API文档：https://platform.openai.com/docs/api-reference/chat/create）

Request & Response 例子：

1. 初始 Request:

```JSON
{
    "model": "gpt-3.5-turbo-0613",
    "messages": [
        {
            "role": "user",
            "content": "What is the weather like in Boston?"
        }
    ],
    "functions": [
        {
            "name": "get_current_weather",
            "description": "Get the current weather in a given location",
            "parameters": {
                "type": "object",
                "properties": {
                    "location": {
                        "type": "string",
                        "description": "The city and state, e.g. San Francisco, CA"
                    },
                    "unit": {
                        "type": "string",
                        "enum": [
                            "celsius",
                            "fahrenheit"
                        ]
                    }
                },
                "required": [
                    "location",
                    "unit"
                ]
            }
        }
    ],
    "function_call": "auto"
}
```

- 在请求中加入了 function 可选字段，可以传入 function 的描述信息。描述格式需要遵守：https://json-schema.org/understanding-json-schema/
- function_call 字段，当function字段为空时，默认值为 none，表示模型应该直接与用户交互，而不需要调用function。当 function 字段不为空时，默认值为 auto，表示模型应该自行决定需要调用function还是应该与用户交互。

1. 初始 Response:

```JSON
{
    "id": "chatcmpl-7RcnJ99VLnqvEF0w8wj9xzVrT03Zg",
    "object": "chat.completion",
    "created": 1686818337,
    "model": "gpt-3.5-turbo-0613",
    "choices": [
        {
            "index": 0,
            "message": {
                "role": "assistant",
                "content": null,
                "function_call": {
                    "name": "get_current_weather",
                    "arguments": "{\n  \"location\": \"Boston, MA\",\n  \"unit\": \"celsius\"\n}"
                }
            },
            "finish_reason": "function_call"
        }
    ],
    "usage": {
        "prompt_tokens": 82,
        "completion_tokens": 26,
        "total_tokens": 108
    }
}
```

- 返回的 finish_reason 是 function_call，代表模型经过思考，决定调用 function
- 可以从 message 字段中解析出模型决定调用的函数及函数参数。

1. 包含 function 调用结果 Request:

```JSON
{
    "model": "gpt-3.5-turbo-0613",
    "messages": [
        {
            "role": "user",
            "content": "What is the weather like in Boston?"
        },
        {
            "role": "assistant",
            "content": null,
            "function_call": {
                "name": "get_current_weather",
                "arguments": "{ \"location\": \"Boston, MA\"}"
            }
        },
        {
            "role": "function",
            "name": "get_current_weather",
            "content": "{\"temperature\": "22", \"unit\": \"celsius\", \"description\": \"Sunny\"}"
        }
    ],
    "functions": [
        {
            "name": "get_current_weather",
            "description": "Get the current weather in a given location",
            "parameters": {
                "type": "object",
                "properties": {
                    "location": {
                        "type": "string",
                        "description": "The city and state, e.g. San Francisco, CA"
                    },
                    "unit": {
                        "type": "string",
                        "enum": [
                            "celsius",
                            "fahrenheit"
                        ]
                    }
                },
                "required": [
                    "location",
                    "unit"
                ]
            }
        }
    ]
}
```

- 把 function 调用结果传递给模型。注意 message 的 role 需要为 function。message 的 name 字段指定 function 名称，content 字段代表 function 调用结果。

1. 最终 Response:

```JSON
{
    "id": "chatcmpl-7RcnL9YOs4uAsE6yu6IV0VbibSQgP",
    "object": "chat.completion",
    "created": 1686818339,
    "model": "gpt-3.5-turbo-0613",
    "choices": [
        {
            "index": 0,
            "message": {
                "role": "assistant",
                "content": "The current weather in Boston, MA is 72 degrees Fahrenheit (approximately 22 degrees Celsius). The forecast for today is sunny and windy."
            },
            "finish_reason": "stop"
        }
    ],
    "usage": {
        "prompt_tokens": 78,
        "completion_tokens": 28,
        "total_tokens": 106
    }
}
```

- finish_reason 为 stop，代表模型希望直接与用户交互，而不是调用 function。

对比未经过微调的调用方式：

- 未经过微调的调用方式需要在 prompt 中指定需要调用的 function、指定模型整体的链式工作流程、约定模型的输出格式。微调之后的模型只需要按照API调用的格式填写 funtion 字段即可，不需要指定工作流程和输出格式，简化了 prompt 的编写难度。
- 微调之后的模型对 function 的支持更好，模型幻觉更少（如字段未按要求返回、字段的类型不正确、返回格式错误等）。
- 未经过微调的调用方式需要自行解析模型输出，当模型输出不符合约定的规范时会直接出错。微调之后的模型不会出现这种情况。

# 使用 LangChain 实现支持上下文 Memory 的 ChatBot

代码：

```Python
from langchain.chat_models.openai import ChatOpenAI
from langchain.memory import ConversationBufferWindowMemory
from langchain.chains import ConversationChain

if __name__ == '__main__':
    open_ai_parameters = {
        'openai_api_base': '***',
        'openai_api_key': 'sk-***'
    }

    open_ai = ChatOpenAI(model_name="gpt-3.5-turbo-0613", streaming=True, temperature=0, **open_ai_parameters)
    memory = ConversationBufferWindowMemory(k=10, memory_key="history")

    chain = ConversationChain(llm=open_ai, memory=memory, verbose=True)
    print(chain.run("Hi, i am Bob."))
    print(chain.run("What's my name?"))
```

输出结果：

```Plain
> Entering new ConversationChain chain...
Prompt after formatting:
The following is a friendly conversation between a human and an AI. The AI is talkative and provides lots of specific details from its context. If the AI does not know the answer to a question, it truthfully says it does not know.

Current conversation:

Human: Hi, i am Bob.
AI:

> Finished chain.

Hello Bob! How can I assist you today?

> Entering new ConversationChain chain...
Prompt after formatting:
The following is a friendly conversation between a human and an AI. The AI is talkative and provides lots of specific details from its context. If the AI does not know the answer to a question, it truthfully says it does not know.

Current conversation:
Human: Hi, i am Bob.
AI: Hello Bob! How can I assist you today?
Human: What's my name?
AI:

> Finished chain.

Your name is Bob.
```

最后一次提问Prompt：

```Plain
The following is a friendly conversation between a human and an AI. The AI is talkative and provides lots of specific details from its context. If the AI does not know the answer to a question, it truthfully says it does not know.

Current conversation:
Human: Hi, i am Bob.
AI: Hello Bob! How can I assist you today?
Human: What's my name?
AI:
```

附：

使用 Chinese-LLaMA-2 本地模型

参考：

- https://python.langchain.com/docs/integrations/llms/llamacpp
- https://github.com/ymcui/Chinese-LLaMA-Alpaca-2/wiki/llamacpp_zh

目前(2023.08.07) 在M1 Mac 上 LangChain 存在Bug，使用过程中会报错。使用 Llama.cpp 正常。

使用 Hugging Face Local Pipelines 本地模型，基本都需要GPU。

参考

- https://python.langchain.com/docs/integrations/llms/huggingface_pipelines

# 使用 LangChain 实现可以搜索信息的 ChatBot

代码：

```Python
from langchain import GoogleSearchAPIWrapper
from langchain.agents import initialize_agent, AgentType
from langchain.chat_models.openai import ChatOpenAI
from langchain.memory import ConversationBufferWindowMemory
from langchain.tools import Tool

if __name__ == '__main__':
    open_ai_parameters = {
        "openai_api_base": "***",
        "openai_api_key": "sk-***"
    }

    open_ai = ChatOpenAI(model_name="gpt-3.5-turbo-0613", streaming=True, temperature=0, **open_ai_parameters)
    memory = ConversationBufferWindowMemory(k=10, memory_key="chat_history")

    google_search_api_parameters = {
        "google_api_key": "***",
        "google_cse_id": "***"
    }
    google_search = GoogleSearchAPIWrapper(**google_search_api_parameters)

    tool = Tool(
        name="Google Search",
        description="Search Google for recent results.",
        func=google_search.run,
    )

    agent = initialize_agent([tool], open_ai, agent=AgentType.ZERO_SHOT_REACT_DESCRIPTION, verbose=True)
    agent.run("What's the weather like in Beijing?")
```

输出结果：

```Plain
> Entering new AgentExecutor chain...
I should search for the current weather in Beijing.
Action: Google Search
Action Input: "current weather in Beijing"
Observation: Beijing, Beijing, China Weather Forecast, with current conditions, wind, air quality, and what to expect for the next 3 days. TodayHourly14 DaysPastClimate. Currently: 86 °F. Haze. (Weather station: Beijing, China). See more current weather. ×. Advertising: Content continues below ... Dongcheng District, People's Republic of China Weather. 2. Today · Hourly · 10 Day · Radar · Video. 10 Day Weather-Dongcheng District, People's Republic of ... Beijing, People's Republic of China Hourly Weather Forecaststar_ratehome ... Thank you for reporting this station. We will review the data in question. You are ... Today's and tonight's Xicheng District, People's Republic of China weather forecast, weather conditions and Doppler radar from The Weather Channel and ... Weather Forecasts. Weather Underground provides local & long-range weather forecasts, weatherreports, maps & tropical weather conditions for the area. 10 Day Weather-Xicheng District, People's Republic of China. As of 2:42 pm CST. Today. 90°/81°. 5%. Thu 03 | Day. 90°. 5%. SSW 7 mph. Jul 12, 2023 ... What is the current weather in Beijing? ; Weather, Shower rain ; Temperature, 22°C ; Humidity, 100% ; Wind, 3.6 km/h ; Pressure, 1004 mbar ... The starting point for official government weather forecasts, warnings, meteorological products for ... Current Weather Conditions: Beijing, China. Current, Past 48 hours data, Min, Max ... 88, Beijing h (humidity) measured by Citizen Weather Observer Program ... Share: “How polluted is the air today?
Thought:I have found the current weather in Beijing.
Final Answer: The current weather in Beijing is 86 °F with haze.

> Finished chain.
```

最后一次提问Prompt:

```Plain
Answer the following questions as best you can. You have access to the following tools:

Google Search: Search Google for recent results.

Use the following format:

Question: the input question you must answer
Thought: you should always think about what to do
Action: the action to take, should be one of [Google Search]
Action Input: the input to the action
Observation: the result of the action
... (this Thought/Action/Action Input/Observation can repeat N times)
Thought: I now know the final answer
Final Answer: the final answer to the original input question

Begin!

Question: What's the weather like in Beijing?
Thought:I should search for the current weather in Beijing.
Action: Google Search
Action Input: "current weather in Beijing"
Observation: Beijing, Beijing, China Weather Forecast, with current conditions, wind, air quality, and what to expect for the next 3 days. TodayHourly14 DaysPastClimate. Currently: 86 °F. Haze. (Weather station: Beijing, China). See more current weather. ×. Advertising: Content continues below ... Dongcheng District, People's Republic of China Weather. 2. Today · Hourly · 10 Day · Radar · Video. 10 Day Weather-Dongcheng District, People's Republic of ... Beijing, People's Republic of China Hourly Weather Forecaststar_ratehome ... Thank you for reporting this station. We will review the data in question. You are ... Today's and tonight's Xicheng District, People's Republic of China weather forecast, weather conditions and Doppler radar from The Weather Channel and ... Weather Forecasts. Weather Underground provides local & long-range weather forecasts, weatherreports, maps & tropical weather conditions for the area. 10 Day Weather-Xicheng District, People's Republic of China. As of 2:42 pm CST. Today. 90°/81°. 5%. Thu 03 | Day. 90°. 5%. SSW 7 mph. Jul 12, 2023 ... What is the current weather in Beijing? ; Weather, Shower rain ; Temperature, 22°C ; Humidity, 100% ; Wind, 3.6 km/h ; Pressure, 1004 mbar ... The starting point for official government weather forecasts, warnings, meteorological products for ... Current Weather Conditions: Beijing, China. Current, Past 48 hours data, Min, Max ... 88, Beijing h (humidity) measured by Citizen Weather Observer Program ... Share: “How polluted is the air today?
Thought:
```

# 使用 LangChain 构建本地知识库问答机器人

构建本地知识库的大致流程如下（目前大家的做法基本都是这样）（图源 宝玉xp）：

![image-20240204161437868](assets/LangChain%20--%20AI%E5%BA%94%E7%94%A8%E5%BC%80%E5%8F%91%E5%B7%A5%E5%85%B7%E5%BA%93/image-20240204161437868.jpg)

![image-20240204161440797](assets/LangChain%20--%20AI%E5%BA%94%E7%94%A8%E5%BC%80%E5%8F%91%E5%B7%A5%E5%85%B7%E5%BA%93/image-20240204161440797.jpg)

GitHub上有很多开源的项目，都是基于上述流程，如 https://github.com/StanGirard/quivr 等

简单的例子：https://github.com/gkamradt/langchain-tutorials/blob/main/data_generation/Custom%20Files%20Question%20%26%20Answer.ipynb

代码：

```Python
import langchain
from langchain.chat_models import ChatOpenAI
from langchain.embeddings.openai import OpenAIEmbeddings
from langchain.vectorstores import Chroma
from langchain.text_splitter import CharacterTextSplitter
from langchain.document_loaders import DirectoryLoader
from langchain.chains import RetrievalQA

if __name__ == '__main__':
    langchain.debug = True

    open_ai_parameters = {
        "openai_api_base": "***",
        "openai_api_key": "sk-***"
    }

    open_ai = ChatOpenAI(model_name="gpt-3.5-turbo-0613", streaming=True, temperature=0, **open_ai_parameters)
    open_ai_embeddings = OpenAIEmbeddings(**open_ai_parameters)

    loader = DirectoryLoader('./drugs', glob='**/*.txt')
    documents = loader.load()

    text_splitter = CharacterTextSplitter(chunk_size=500, chunk_overlap=10)
    split_docs = text_splitter.split_documents(documents)

    documents_db = Chroma.from_documents(split_docs, open_ai_embeddings, persist_directory="./drug_chroma_db")

    qa_chain = RetrievalQA.from_chain_type(llm=open_ai, chain_type="stuff", retriever=documents_db.as_retriever(),
                                           return_source_documents=True, verbose=True)

    result = qa_chain({"query": "青霉素的试用症是什么？"})
    print(result)
```

最终结果：

```Plain
青霉素适用于敏感细菌所致各种感染，如脓肿、菌血症、肺炎和心内膜炎等。具体来说，青霉素适用于以下感染：

1. 溶血性链球菌感染，如咽炎、扁桃体炎、猩红热、丹毒、蜂窝织炎和产褥热等。
2. 肺炎链球菌感染，如肺炎、中耳炎、脑膜炎和菌血症等。
3. 不产青霉素酶葡萄球菌感染。
4. 炭疽。
5. 破伤风、气性坏疽等梭状芽孢杆菌感染。
6. 梅毒（包括先天性梅毒）。
7. 钩端螺旋体病。
8. 回归热。
9. 白喉。
10. 青霉素与氨基糖苷类药物联合用于治疗草绿色链球菌心内膜炎。

此外，青霉素还可用于治疗流行性脑脊髓膜炎、放线菌病、淋病、奋森咽峡炎、莱姆病、多杀巴斯德菌感染、鼠咬热、李斯特菌感染以及除脆弱拟杆菌以外的许多厌氧菌感染。此外，在风湿性心脏病或先天性心脏病患者进行口腔、牙科、胃肠道或泌尿生殖道手术和操作前，青霉素可用于预防感染性心内膜炎的发生。
```

执行过程：

```SQL
[chain/start] [1:chain:RetrievalQA] Entering Chain run with input:
{
  "query": "青霉素的试用症是什么？"
}
[chain/start] [1:chain:RetrievalQA > 3:chain:StuffDocumentsChain] Entering Chain run with input:
[inputs]
[chain/start] [1:chain:RetrievalQA > 3:chain:StuffDocumentsChain > 4:chain:LLMChain] Entering Chain run with input:
{
  "question": "青霉素的试用症是什么？",
  "context": "01、注射用青霉素钠 【适应症】 青霉素适用于敏感细菌所致各种感染，如脓肿、菌血症、肺炎和心内膜炎等。 其中青霉素为以下感染的首选药物：1．溶血性链球菌感染，如咽炎、扁桃体炎、猩红热、丹毒、蜂窝织炎和产褥热等。2．肺炎链球菌感染如肺炎、中耳炎、脑膜炎和菌血症等。3．不产青霉素酶葡萄球菌感染。4．炭疽。5．破伤风、气性坏疽等梭状芽孢杆菌感染。6．梅毒（包括先天性梅毒）。7．钩端螺旋体病。8．回归热。9．白喉。10．青霉素与氨基糖苷类药物联合用于治疗草绿色链球菌心内膜炎。青霉素亦可用于治疗：1．流行性脑脊髓膜炎。2．放线菌病。3．淋病。4．奋森咽峡炎。5．莱姆病。6．多杀巴斯德菌感染。7．鼠咬热。8．李斯特菌感染。9．除脆弱拟杆菌以外的许多厌氧菌感染。风湿性心脏病或先天性心脏病患者进行口腔、牙科、胃肠道或泌尿生殖道手术和操作前，可用青霉素预防感染性心内膜炎发生。 【用法和用量】 青霉素由肌内注射或静脉滴注给药。1．成人：肌内注射，一日80万～200万单位，分3～4次给药；静脉滴注：一日200万～2000万单位，分2～4次给药。2．小儿：肌内注射，按体重2.5万单位/kg，每12小时给药1次；静脉滴注：每日按体重5万～20万/kg，分2～4次给药。3．新生儿（足月产）：每次按体重5万单位/kg，肌内注射或静脉滴注给药；出生第一周每12小时1次，一周以上者每8小时1次，严重感染每6小时1次。4．早产儿：每次按体重3万单位/kg，出生第一周每12小时1次，2～4周者每8小时1次；以后每 【不良反应】 1．过敏反应 2．毒性反应。3．赫氏反应和治疗矛盾；4．二重感染。5．应用大剂量青霉素钠可因摄入大量钠盐而导致心力衰竭。 【禁忌】    有青霉素类药物过敏史或青霉素皮肤试验阳性患者禁用。 【规格】0.96g(160万单位)\n\n05、氨苄西林(氨苄青霉素)\n\n【作用与用途】  本品为广谱半合成青霉素，毒性极低。抗菌谱与青霉素相似，对青霉素敏感的细菌效力较低，对草绿色链球菌的抗菌作用与青霉素相仿或略强。对白喉杆菌、破伤风杆菌和放线菌其效能基本和青霉素相同。对肠球菌及李司忒菌的作用则优于苄青霉素。对耐药葡萄球菌及其它能产生青霉素酶的细菌均无抗菌作用。对革兰阴性菌有效，但易产生耐药性。\n\n本品主要用于敏感菌所致的泌尿系统、呼吸系统、胆道、肠道感染以及脑膜炎、心内膜炎等。\n\n【剂量与用法】 口服，2g～6g/日，分3～4次，空腹服用。儿童，每日100mg/kg，分3～4次，空腹服用。肌注或静注，成人，2g～4g/日；儿童，每日50mg～100mg/kg，一般每4～6小时1次。静注给药可分次徐缓静脉推注或静滴；静滴，1次1g～2g，溶于100ml输液中，滴注1/2～1小时，2～4次/日。儿童，每日100mg～150mg/kg，分次给予。\n\n【副作用】1 本品可致过敏性休克，皮疹发生率较青霉素为高。有时也发生药热。 2 本品注射前必须做皮试，阴性者方可使用。有青霉素过敏史者禁用。\n\n（二）、头孢菌素类\n\n09、头孢呋新 【作用与用途】本品为一种半合成第二代头孢菌素。对金葡菌、链球菌、脑膜炎球菌、流感杆菌、克雷白杆菌、大肠杆菌、奇异变形杆菌、沙门菌、志贺菌等有高度抗菌作用。本品可对抗β内酰胺酶，对耐青霉素的金葡菌有效。临床主要用于敏感菌所致的呼吸道感染、肾盂肾炎、尿路感染及骨、关节、耳鼻咽喉、软组织等的感染。本品在脑膜炎症时有足量进入脑脊液中，对脑膜炎球菌所致的脑膜炎疗效显著。对革兰阳性菌(包括耐青霉素金葡萄)的活性与第一代头孢相仿；对革兰阴性菌的作用较第一代头孢强。     【剂量与用法】肌注、静注或静滴，成人，0.25g～0.75g/次，3～4次/日；儿童，每日30mg～60mg/kg，分3～4次。肌注时以0.5g～0.75g加注射用水3ml，振摇使成混悬液。用粗针头作深部肌注。静脉给药时，注射用水量应加倍或更多，使充分溶解，溶液澄明，缓慢静注或静滴。 【副作用】1 对青霉素有时有交叉变态反应，对青霉素过敏者慎用。2 本品毒性较小，对肝、肾一般无损害，但肾功能不全者应减量。3 一般有胃肠道反应及皮肤过敏，肌注时可有局部疼痛。4 长期使用，可导致菌群失调。 5 对头孢菌素类过敏者禁用。\n\n06、头孢氨苄\n\n【作用与用途】本品为半合成的第一代口服头孢霉素，抗菌谱与头孢噻吩、头孢噻啶基本相同，抗菌效力较两者弱，但本品的特点是耐酸，口服吸收良好。对耐药金葡菌有良好抗菌作用。\n\n主要用于敏感菌所致的呼吸道感染、泌尿道感染、妇产科感染、皮肤及软组织感染、淋病等。\n\n【剂量与用法】口服，成人，0.25g～1g/次，3～4次/日；儿童，每日30mg～100mg/kg，分4次。\n\n【副作用】1 对青霉素过敏者，也可发生过敏反应，但发生率较低，主要有皮疹、全身瘙痒及药物热等。 2 常见有胃肠道反应如恶心、呕吐、腹泻及食欲减退等。"
}
[llm/start] [1:chain:RetrievalQA > 3:chain:StuffDocumentsChain > 4:chain:LLMChain > 5:llm:ChatOpenAI] Entering LLM run with input:
{
  "prompts": [
    "System: Use the following pieces of context to answer the users question. \nIf you don't know the answer, just say that you don't know, don't try to make up an answer.\n----------------\n01、注射用青霉素钠 【适应症】 青霉素适用于敏感细菌所致各种感染，如脓肿、菌血症、肺炎和心内膜炎等。 其中青霉素为以下感染的首选药物 (此处内容同上，省略)...... \nHuman: 青霉素的试用症是什么？"
  ]
}
[llm/end] [1:chain:RetrievalQA > 3:chain:StuffDocumentsChain > 4:chain:LLMChain > 5:llm:ChatOpenAI] [22.40s] Exiting LLM run with output:
{
  "generations": [
    [
      {
        "text": "青霉素适用于敏感细菌所致各种感染，如脓肿、菌血症、肺炎和心内膜炎等。具体来说，青霉素适用于以下感染：\n\n1. 溶血性链球菌感染，如咽炎、扁桃体炎、猩红热、丹毒、蜂窝织炎和产褥热等。\n2. 肺炎链球菌感染，如肺炎、中耳炎、脑膜炎和菌血症等。\n3. 不产青霉素酶葡萄球菌感染。\n4. 炭疽。\n5. 破伤风、气性坏疽等梭状芽孢杆菌感染。\n6. 梅毒（包括先天性梅毒）。\n7. 钩端螺旋体病。\n8. 回归热。\n9. 白喉。\n10. 青霉素与氨基糖苷类药物联合用于治疗草绿色链球菌心内膜炎。\n\n此外，青霉素还可用于治疗流行性脑脊髓膜炎、放线菌病、淋病、奋森咽峡炎、莱姆病、多杀巴斯德菌感染、鼠咬热、李斯特菌感染以及除脆弱拟杆菌以外的许多厌氧菌感染。此外，在风湿性心脏病或先天性心脏病患者进行口腔、牙科、胃肠道或泌尿生殖道手术和操作前，青霉素可用于预防感染性心内膜炎的发生。",
        "generation_info": null,
        "message": {
          "lc": 1,
          "type": "constructor",
          "id": [
            "langchain",
            "schema",
            "messages",
            "AIMessageChunk"
          ],
          "kwargs": {
            "content": "青霉素适用于敏感细菌所致各种感染，如(此处内容同上，省略)......",
            "additional_kwargs": {}
          }
        }
      }
    ]
  ],
  "llm_output": null,
  "run": null
}
[chain/end] [1:chain:RetrievalQA > 3:chain:StuffDocumentsChain > 4:chain:LLMChain] [22.40s] Exiting Chain run with output:
{
  "text": "青霉素适用于敏感细菌所致各种感染，如(此处内容同上，省略)......"
}
[chain/end] [1:chain:RetrievalQA > 3:chain:StuffDocumentsChain] [22.41s] Exiting Chain run with output:
{
  "output_text": "青霉素适用于敏感细菌所致各种感染，如(此处内容同上，省略)......"
}
[chain/end] [1:chain:RetrievalQA] [23.08s] Exiting Chain run with output:
[outputs]
{'query': '青霉素的试用症是什么？', 'result': '青霉素适用于敏感细菌所致各种感染，如(此处内容同上省略)......', 'source_documents': [Document(page_content='01、注射用青霉素钠 【适应症】 青霉素适用于敏感细菌所致各种感染，如脓肿、菌血症、肺炎和心内膜炎等。 其中青霉素为以下感染的首选药物：1．溶血性链球菌感染(原文省略)......', metadata={'source': 'drugs/01.txt'}), Document(page_content='05、氨苄西林(氨苄青霉素)\n\n【作用与用途】  本品为广谱半合成青霉素，毒性极低。抗菌谱与青霉素相似，对青霉素敏感的细菌效力较低，(原文省略)......', metadata={'source': 'drugs/05.txt'}), Document(page_content='09、头孢呋新 【作用与用途】本品为一种半合成第二代头孢菌素。对金葡菌、链球菌、脑膜炎球菌、流感杆菌、克雷白杆菌、大肠杆菌、奇异变形杆菌、沙门菌、志贺菌等有高度抗菌作用。本品可对抗β内酰胺酶，对耐青霉素的金葡菌有效。(原文省略)......', metadata={'source': 'drugs/09.txt'}), Document(page_content='06、头孢氨苄\n\n【作用与用途】本品为(原文省略)......【副作用】1 对青霉素过敏者，也可发生过敏反应，但发生率较低，(原文省略)......', metadata={'source': 'drugs/06.txt'})]}
```

## 从 HuggingFace 下载 Embeddings 模型

代码：

```Python
import langchain
from langchain.chat_models import ChatOpenAI
from langchain.embeddings import HuggingFaceEmbeddings
from langchain.vectorstores import Chroma
from langchain.text_splitter import CharacterTextSplitter
from langchain.document_loaders import DirectoryLoader
from langchain.chains import RetrievalQA

if __name__ == '__main__':
    open_ai_parameters = {
        "openai_api_base": "***",
        "openai_api_key": "sk-***"
    }

    open_ai = ChatOpenAI(model_name="gpt-3.5-turbo-0613", streaming=True, temperature=0, **open_ai_parameters)
    embeddings = HuggingFaceEmbeddings(model_name="all-MiniLM-L6-v2", model_kwargs={'device': 'cpu'})

    loader = DirectoryLoader('./drugs', glob='**/*.txt')
    documents = loader.load()

    text_splitter = CharacterTextSplitter(chunk_size=500, chunk_overlap=10)
    split_docs = text_splitter.split_documents(documents)

    documents_db = Chroma.from_documents(split_docs, embeddings)

    qa_chain = RetrievalQA.from_chain_type(llm=open_ai, chain_type="stuff", retriever=documents_db.as_retriever(),
                                           return_source_documents=True, verbose=False)

    result = qa_chain({"query": "青霉素的试用症是什么？"})
    print(result['result'])
    for doc in result['source_documents']:
        print(doc.metadata)
```

运行结果同OpenAI Embeddings 基本一致。（可以看到 souce 有所差异，SentenceTransformer 对中文的支持不太好。可以换用对中文支持比较高的 https://huggingface.co/GanymedeNil/text2vec-large-chinese/tree/main）

```Plain
青霉素适用于敏感细菌所致各种感染，如脓肿、菌血症、肺炎和心内膜炎等。具体来说，青霉素是以下感染的首选药物：

1. 溶血性链球菌感染，如咽炎、扁桃体炎、猩红热、丹毒、蜂窝织炎和产褥热等。
2. 肺炎链球菌感染，如肺炎、中耳炎、脑膜炎和菌血症等。
3. 不产青霉素酶葡萄球菌感染。
4. 炭疽。
5. 破伤风、气性坏疽等梭状芽孢杆菌感染。
6. 梅毒（包括先天性梅毒）。
7. 钩端螺旋体病。
8. 回归热。
9. 白喉。
10. 青霉素与氨基糖苷类药物联合用于治疗草绿色链球菌心内膜炎。

此外，青霉素还可用于治疗其他感染，如流行性脑脊髓膜炎、放线菌病、淋病、奋森咽峡炎、莱姆病、多杀巴斯德菌感染、鼠咬热、李斯特菌感染以及除脆弱拟杆菌以外的许多厌氧菌感染。此外，在风湿性心脏病或先天性心脏病患者进行口腔、牙科、胃肠道或泌尿生殖道手术和操作前，可以使用青霉素预防感染性心内膜炎的发生。

{'source': 'drugs/03.txt'}
{'source': 'drugs/01.txt'}
{'source': 'drugs/05.txt'}
{'source': 'drugs/08.txt'}
```

注：模型会在第一次运行时自动下载，模型存储路径规则如下：

文档：[SentenceTransformer.py#L53](https://github.com/UKPLab/sentence-transformers/blob/master/sentence_transformers/SentenceTransformer.py#L53)

![image-20240204161453576](assets/LangChain%20--%20AI%E5%BA%94%E7%94%A8%E5%BC%80%E5%8F%91%E5%B7%A5%E5%85%B7%E5%BA%93/image-20240204161453576.jpg)

即默认存储位置`~/.cache/torch/sentence_transformers`

## LangChain 支持的 Q&A Chain Type

![image-20240204161457255](assets/LangChain%20--%20AI%E5%BA%94%E7%94%A8%E5%BC%80%E5%8F%91%E5%B7%A5%E5%85%B7%E5%BA%93/image-20240204161457255.jpg)

Stuff documents chain 会把找到的所有文档拼接起来，插入到 Prompt 中。这是最直接的一种方式，适用于文档上下文比较小的情况。

![image-20240204161500542](assets/LangChain%20--%20AI%E5%BA%94%E7%94%A8%E5%BC%80%E5%8F%91%E5%B7%A5%E5%85%B7%E5%BA%93/image-20240204161500542.jpg)

Refine documents chain 通过循环遍历输入文档并迭代更新答案来生成最终回复。

对于每个文档，它会将用户输入、当前文档和目前迭代生成的中间答案传递给 LLM 以更新答案。

由于 refine documents chain 一次仅将单个文档传递给 LLM，因此它非常适合需要上下文文档比较多的任务。但是它也会进行更多的 LLM 调用，消耗更多的 token。

当文档频繁相互引用或任务需要同时从许多文档中获取详细信息时，refine documents chain 可能表现不佳。

![image-20240204161503375](assets/LangChain%20--%20AI%E5%BA%94%E7%94%A8%E5%BC%80%E5%8F%91%E5%B7%A5%E5%85%B7%E5%BA%93/image-20240204161503375.jpg)

Map reduce documents chain 使用 LLM 对每个文档进行总结。然后，它会将总结后的文档进行拼接，作为上下文传递给 LLM 用于生成答案。如果文档上下文特别多，整个 Map reduce 的流程可以进行多次。

![image-20240204161506601](assets/LangChain%20--%20AI%E5%BA%94%E7%94%A8%E5%BC%80%E5%8F%91%E5%B7%A5%E5%85%B7%E5%BA%93/image-20240204161506601.jpg)

Map re-rank documents chain 使用每一个文档上下文生成一个答案，并要求 LLM 为自己生成的答案打分。最终会选择得分最高的答案返回给用户。



# 参考链接

- https://python.langchain.com/docs/get_started/introduction.html
- https://liaokong.gitbook.io/llm-kai-fa-jiao-cheng/
- https://mp.weixin.qq.com/s/3coFhAdzr40tozn8f9Dc-w
- https://api.python.langchain.com/en/latest/api_reference.html#
- https://platform.openai.com/docs/api-reference
