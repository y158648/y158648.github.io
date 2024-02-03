# Keep Components Pure 扩展阅读

> [https://react.dev/learn/keeping-components-pure](https://react.dev/learn/keeping-components-pure)
> 

---

# 1. Pure Function

在了解 Waht is / How to do 之前, 先了解一下 Pure Function 的概念:

> Some JavaScript functions are *pure.* Pure functions only perform a calculation and nothing more.
> 

尽可能保证 Function 是 Pure Function, 可以有效避免 Bug. Pure Function 满足一下原则:

1. Deterministic - 相同的输入必定有相同的输出. 例如:

```jsx
function sum(a, b) {
  return a + b;
}

sum(1, 2) // always returns 3
```

1. No Side Effects - 不会改变方法作用于之外的状态. 例如:
    - 不改变外部变量;
    - 不修改 DOM;
    - 不写入 storage, 不发请求
    - 不 console
    - 不调用有 side-effects 的其他方法
2. Immutable - 不改变入参.

# 2. What is Purity

> **Components as formulas**
> 

组件如公式

> **React assumes that every component you write is a pure function.** This means that React components you write must always return the same JSX given the same inputs
> 

和 Pure Function 类似, 一样的 props 一定会渲染出相同的 JSX. **Just like a math formula.**

# 3. Side Effects

文档是这么说的:

> While functional programming relies heavily on purity, at some point, somewhere, *something* has to change. That’s kind of the point of programming! These changes—updating the screen, starting an animation, changing the data—are called **side effects.** They’re things that happen *“on the side”*, not during rendering.
> 

不在渲染过程中发生的 *changes* 叫做 **side effects**. 比如:

- 修改 DOM
- 调用 API

这部分应该放到 event handler 中, 或者 useEffect 中, 确保 side effects 发生的时机还在 React 控制范围内