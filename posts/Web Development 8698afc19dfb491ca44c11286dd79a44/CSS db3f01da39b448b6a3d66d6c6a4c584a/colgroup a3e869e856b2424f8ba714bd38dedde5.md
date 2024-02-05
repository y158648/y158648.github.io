---
layout: post1
date:   Fri Feb 16 2024 13:39:46 GMT+0000 (Coordinated Universal Time)
---
# colgroup

[colgroup](https://developer.mozilla.org/zh-CN/docs/Web/HTML/Element/colgroup)

> HTML 中的 表格列组（Column Group <colgroup>） 标签用来定义表中的一组列表。
> 

```html
<table>
    <caption>Superheros and sidekicks</caption>
    <colgroup>
        <col>
        <col span="2" class="batman">
        <col span="2" class="flash">
    </colgroup>
    <tr>
        <td> </td>
        <th scope="col">Batman</th>
        <th scope="col">Robin</th>
        <th scope="col">The Flash</th>
        <th scope="col">Kid Flash</th>
    </tr>
    <tr>
        <th scope="row">Skill</th>
        <td>Smarts</td>
        <td>Dex, acrobat</td>
        <td>Super speed</td>
        <td>Super speed</td>
    </tr>
</table>

```

```css
.batman {
    background-color: #d7d9f2;
}

.flash {
    background-color: #ffe8d4;
}

caption {
    padding: 8px;
    caption-side: bottom;
}

table {
    border-collapse: collapse;
    border: 2px solid rgb(100, 100, 100);
    letter-spacing: 1px;
    font-family: sans-serif;
    font-size: .7rem;
}

td,
th {
    border: 1px solid rgb(100, 100, 100);
    padding: 10px 10px;
}

td {
    text-align: center;
}

```

上述代码的结果是:

![https://y122972.oss-cn-shanghai.aliyuncs.com/imgimage-20210721203704112.png](https://y122972.oss-cn-shanghai.aliyuncs.com/imgimage-20210721203704112.png)

也就是, `colgroup` 中的 `col` 会根据 `span` 将所有的列分为多个组, 可以通过 `class` 给这些组设置一些属性