# 某项开发重构记录

<aside>
📖 **背景**: 从别的开发团队接手负责的一个对外面向商家的系统

原开发人员由于开发仓促以及水平问题, 代码一团糟: 没有注释、模糊命名、没有类型定义、驼峰下划线胡乱混用、乱用状态管理包(mobx)、魔数、不一致的代码/文件命名约定、字符串硬定义 (Hardcoded strings)、完全不封装组件/hooks/工具函数、混乱的文件结构、千行文件/组件不拆分、完全乱命名变量/方法/事件处理、各种重复的代码/无用的逻辑、useEffect滥用、用了一个内部fork的antd但满是bug的组件库, 等等

</aside>

---

### 重构思路

整体思路: 屎上雕花与代码重构一起进行; 业务需求做到哪里改到哪里, 保证需求测试的同时尽可能cover重构的代码

- 逐渐完善类型定义
- 需要重构的代码标注废弃 `@deprecated`
- 重要业务逻辑, 代码逻辑补充完整的注释
- 逐步和后端统一字段, 期间可能很长一段时间旧字段和新字段并存
- 对于乱用 `mobx` , 大部分可以将状态和组件进行绑定, 其他少部分放入 `context` 中, 全部移除掉之后再看整体状态管理情况使用 `reducer` 等

### 重构记录

[scss modules](%E6%9F%90%E9%A1%B9%E5%BC%80%E5%8F%91%E9%87%8D%E6%9E%84%E8%AE%B0%E5%BD%95%20efbb54a9bfda4fe9bd02e13784b02c8e/scss%20modules%201c7e3bc7fa9140b3b2fc876133601dd3.md)

[useEffect滥用](%E6%9F%90%E9%A1%B9%E5%BC%80%E5%8F%91%E9%87%8D%E6%9E%84%E8%AE%B0%E5%BD%95%20efbb54a9bfda4fe9bd02e13784b02c8e/useEffect%E6%BB%A5%E7%94%A8%205574635e854545c4a7e21c3b4d3036ec.md)

[组件拆分](%E6%9F%90%E9%A1%B9%E5%BC%80%E5%8F%91%E9%87%8D%E6%9E%84%E8%AE%B0%E5%BD%95%20efbb54a9bfda4fe9bd02e13784b02c8e/%E7%BB%84%E4%BB%B6%E6%8B%86%E5%88%86%20fb5ff435c6c04576afa17fd7ba636635.md)

[数据 Mock](%E6%9F%90%E9%A1%B9%E5%BC%80%E5%8F%91%E9%87%8D%E6%9E%84%E8%AE%B0%E5%BD%95%20efbb54a9bfda4fe9bd02e13784b02c8e/%E6%95%B0%E6%8D%AE%20Mock%20f3f0628acad048339c94f243a1c0b232.md)

[SSR](%E6%9F%90%E9%A1%B9%E5%BC%80%E5%8F%91%E9%87%8D%E6%9E%84%E8%AE%B0%E5%BD%95%20efbb54a9bfda4fe9bd02e13784b02c8e/SSR%20fb957c54a87b46babbac3e3f4918ace9.md)