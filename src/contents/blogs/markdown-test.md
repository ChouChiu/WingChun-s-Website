---
title: "1"
date: 2026-02-10
description: "1"
tags:
  - 公告
---

# Markdown 全样式测试文件
> 用于验证博客系统对 Markdown 语法的支持程度，包括 GFM 及常见扩展。

---

## 1. 标题（1–6 级）

# H1 一级标题
## H2 二级标题
### H3 三级标题
#### H4 四级标题
##### H5 五级标题
###### H6 六级标题

## 2. 段落与换行

这是一个段落。  
在行末添加两个空格可以强制换行（软换行）。

这是另一个段落，与上文通过空行分隔。

## 3. 强调

*斜体* 或 _斜体_  
**粗体** 或 __粗体__  
***粗斜体*** 或 ___粗斜体___  
~~删除线~~（GFM）  
==高亮==（需要扩展支持，如 `markdown-it` 的 `mark` 插件）

## 4. 引用块

> 单层引用块
> > 嵌套引用块
> > > 更深一层
>
> 引用内可包含其他语法：**粗体**、`代码`、[链接](#)

## 5. 列表

### 无序列表
- 项目一
- 项目二
  - 嵌套无序列表
  - 另一个嵌套项
- 项目三

### 有序列表
1. 第一项
2. 第二项
   1. 嵌套有序列表
   2. 嵌套第二项
3. 第三项

### 混合列表
- 无序项
  1. 有序子项
  2. 有序子项
- 另一个无序项
  - 继续无序

## 6. 任务列表（GFM）

- [x] 已完成任务
- [ ] 未完成任务
- [ ] 子任务
  - [x] 嵌套子任务已完成
  - [ ] 嵌套子任务未完成

## 7. 水平线

--- 
*** 
___

## 8. 链接

### 内联式
[GitHub](https://github.com)  
[带有标题的链接](https://example.com "示例网站")

### 引用式
[引用链接][1]  
[引用链接本身也作为文本][reference]  

[1]: https://example.com "引用链接示例"
[reference]: https://markdown.com

### 自动链接
<https://www.example.com>  
<fake@example.com>

### 相对链接（测试用）
[帮助文档](/help)

## 9. 图片

### 内联图片
![Alt 文本](https://placehold.co/400 "可选标题")

### 引用式图片
![引用图片][logo]

[logo]: https://placehold.co/400 "Logo"

## 10. 代码

### 行内代码
使用 `printf("Hello, World!");` 输出。

### 代码块（无语言标识）
```
这是一个普通代码块
没有语法高亮
```

### 代码块（带语言标识，GFM 语法高亮）
```javascript
function greet(name) {
    console.log(`Hello, ${name}!`);
}
greet('World');
```

```python
def greet(name):
    print(f"Hello, {name}!")

greet("World")
```

## 11. 表格（GFM）

| 左对齐 | 居中对齐 | 右对齐 |
|:-------|:--------:|-------:|
| 单元格1 | 单元格2  | 单元格3 |
| 较长内容 | 居中     |   12345 |
| 合并? | 不合并    | 支持`代码` |

## 12. 删除线（GFM）

~~这是错误的信息~~，请参考最新文档。

## 13. 表情符号（GFM Emoji）

:smile: :heart: :rocket: :octocat:  
（需要解析器支持 `:emoji:` 语法）

## 14. 脚注（扩展语法，如 Pandoc / PHP Markdown Extra）

这是一段带有脚注的文字[^1]。  
另一处引用同一个脚注[^1]。  
还可以定义第二个脚注[^note]。

[^1]: 这是脚注的内容，可以包含**格式**。  
[^note]: 多行脚注可以写在这里。

## 15. 定义列表（扩展语法）

<dl>
  <dt>Apple</dt>
  <dd>一种水果</dd>
  <dd>一家科技公司</dd>
  <dt>Orange</dt>
  <dd>柑橘类水果</dd>
</dl>

## 16. 下标与上标（扩展语法）

H<sub>2</sub>O（下标需要 `~` 包围，某些解析器如 `markdown-it-sub`）  
X<sup>2</sup>（上标需要 `^` 包围，某些解析器如 `markdown-it-sup`）

## 17. 数学公式（LaTeX 风格，需扩展支持）

行内公式：$E = mc^2$  
行间公式：
$$
\int_{a}^{b} f(x) \, dx = F(b) - F(a)
$$

## 18. 内嵌 HTML

<p style="color: red;">这是一段红色文字（通过内联HTML实现）。</p>

<details>
<summary>点击展开（HTML5 details）</summary>
这里是隐藏内容，依赖浏览器渲染。
</details>

## 19. 转义字符

\*星号不会被解释为强调\*  
\_下划线同理\_  
`反引号在代码块外显示需转义\``

## 20. 其他 GFM 特有功能

### 自动识别 URL
www.example.com 自动链接（某些解析器需协议前缀）  
https://github.com 自动链接

### 键盘样式（非标准，但常用）
<kbd>Ctrl</kbd> + <kbd>C</kbd>

### 特殊 Markdown 扩展
- `++插入文本++`（插入，`<ins>`）
- `~~删除~~` 已在删除线中演示
- `==高亮==` 已演示

## 21. 复杂嵌套示例

> 引用内包含列表：
> - 第一项
> - 第二项  
>   `代码块` 和 **粗体**
>
> 列表后可接段落。

1. 列表项包含引用块
   > 嵌套引用
2. 列表项包含代码块
   ```css
   .example { color: red; }
   ```

## 22. 边界情况测试

### 空标题（不推荐，但测试处理）

#

### 表格内换行（GFM 不支持原生换行，需用 `<br>`）
| 列1 | 列2 |
|-----|-----|
| 第一行<br>第二行 | 正常内容 |

## 23. GFM Callouts

> [!NOTE]
> A NOTE

### 长文本自动换行
这是一段非常长的文本，没有任何换行，用于测试博客系统是否会自动折行。请持续输入直到换行边界，例如：Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.