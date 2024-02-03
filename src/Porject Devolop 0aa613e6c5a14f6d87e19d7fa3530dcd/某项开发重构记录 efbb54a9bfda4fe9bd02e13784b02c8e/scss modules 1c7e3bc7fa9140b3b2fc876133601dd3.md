# scss modules

scss modules 有一些不方便的点:

1. scss modules 容易出现一堆重复的样式文件, 在这个不规范的项目里尤为明显
2. 一般写 sass 都是和 dom 一样的嵌套结构, dom 结构变化的时候, sass 结构也要跟着变化
3. 同一个 scss 文件下的类命名需要考虑唯一性, 这就导致有些类名又臭又长
4. 同一个文件夹下有多个组件, 每个组件都创建一个 `.scss` 吗? 组件有部分共用属性呢? 1, 2条公用属性值得创建一个 `common.module.scss` 吗? 感觉怎样都不太合适

后面改用 `TailwindCss` 

1. tailwind 本就是原子化的类名, 可以说处处都在重复, 但又不存在重复的问题; 不过针对一些常用的项目通用的样式可以封装样式组件
2. 类名跟随 dom
3. 没有命名问题, 不过也会出现类名超长的情况

tailwind也有一些不太好的地方:

- 已有的 scss modules 和 inline styles 迁移起来有些困难