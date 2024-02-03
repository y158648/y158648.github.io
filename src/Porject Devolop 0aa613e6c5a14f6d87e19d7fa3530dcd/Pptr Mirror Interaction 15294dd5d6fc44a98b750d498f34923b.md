# Pptr Mirror Interaction

> **背景**：
> 
> 
> 在技术升级过程中，需要比对升级前后页面是否存在问题，当前只能自己在页面上点击查看，效率比较低，且如果是不熟悉的页面，也很难判断跟线上是否存在不同
> 
> **期望**：
> 
> 1. 脚本会打开两个窗口，分别访问本地和胡桃街的master特征环境，在一个窗口的操作可以立刻同步到另外一个窗口
> 2. 两个窗口会共享接口请求，所有请求的返回值都是一样的
> 3. 脚本会对比发起请求的参数，如果不一样先在命令行console一下，后面看看怎么优化下交互
> 4. 支持返回值的mock能力，允许指定一个mock目录，并自动加载里面的json，json格式可以设计下

# 一、开发

## 1. 分屏

### a. 考虑 iframe

1. ~~手动给 cookie: 监听不到 iframe 中的 request~~
2. ~~每个 iframe 手动登录: iframe 感知不到网关~~
3. 手动登录后直接替换当前页面的html, 保持同源, 留住登录状态

```jsx
const html = `<html lang="en">
  <iframe src=${PAGE_URL} style="width:calc(100vw - 30px);height:50vh;"></iframe>
  <iframe src=${PAGE_URL} style="width:calc(100vw - 30px);height:50vh;"></iframe>
  <style>* {margin: 0}</style>
</html>  `;
```

### b. 考虑开启多个window

1. ~~每个 window 单独登录: oms是单点登录两个独立的window环境~~
2. ~~window 共享 `userDataDir` : 不被 `puppeteer` 允许~~
3. 还得是手动分屏

## 2. 镜像操作

### a. 整体流程

1. ~~页面 A 操作 -> pptr context 拿到操作记录 -> pptr api 操作页面 B~~
可以通过 `page.on("console", ...)` 拿到 `page` 的输出, 但拿到输出是异步的, 页面如果因为操作刷新了页面, 会拿不到 `console` 的内容
2. 创建一个中间页面 A, 保持接收消息; 页面 B 的操作同步给 A → A 同步给 pptr → pptr 镜像给页面 C

### b. tab之间传递信息

有几种方式:

1. [postMessage](https://developer.mozilla.org/en-US/docs/Web/API/Window/postMessage)
这里只能通过 `window.open` 给向被打开的页面 `postMessage`
2. [Broadcast Channel API](https://developer.mozilla.org/en-US/docs/Web/API/Broadcast_Channel_API)
3. [Window: storage event](https://developer.mozilla.org/en-US/docs/Web/API/Window/storage_event)
4. service worker

这里采用 `Broadcast` 

> The **Broadcast Channel API** allows basic communication between [browsing contexts](https://developer.mozilla.org/en-US/docs/Glossary/Browsing_context) (that is, *windows*, *tabs*, *frames*, or *iframes*) and workers on the same [origin](https://developer.mozilla.org/en-US/docs/Glossary/Origin). 2. 接口 mock
> 

### c. 事件的镜像

并没有搜到合适的包做这个事情. 之前有了解过 [rrweb](https://github.com/rrweb-io/rrweb/), 但这个包主要作用是记录 dom 节点因交互产生的变化, 不太适用于这里的情况.
这里自己实现一些简单的镜像交互

- mouse
    
    包括 `click` `down` `drag` `dragAndDrop` `dragOver` `dragOver` `drop` `move` `reset` `up` `wheel` , 但不需要都处理
    
    1. mousedown / mouseup
    处理除了双击之外的事件
    2. click
    `mousedown` / `mouseup` 的 pptr api 的 `count` 属性已经废弃, 这里用 `click` 去触发.
    `click` 就是 “Shortcut for `mouse.move`, `mouse.down` and `mouse.up`.”. `count` 设置为 2 对应浏览器的 `dblclick` 事件
    3. wheel
    
    > Note: Do not confuse the wheel event with the scroll event. The default action of a wheel event is implementation-defined. Thus, a wheel event doesn't necessarily dispatch a scroll event. Even when it does, that doesn't mean that the delta* values in the wheel event necessarily reflect the content's scrolling direction. Therefore, do not rely on delta* properties to get the content's scrolling direction. Instead, detect value changes to scrollLeft and scrollTop of the target in the scroll event.
    > 
    
    MDN 提到 `wheel` 事件不是很靠谱, 比如滚到极限位置的时候 `deltaX` / `deltaY` 仍然有值, 但 `scroll` 的值并不会发生变化.
    
    实际应用中还发现了另一个问题: `wheel` 事件的 `delta*` 其实是鼠标物理滚动距离, 应用到页面会有个实际滚动距离. 比如我这里:
    100% zoom 的情况下, `wheel` 触发一次, 页面滚动 **120px**, 但 `wheel event` 的 `deltaY` 是 **240px**; 通过 `page.mouse.wheel` 把这个 `deltaY` 应用到镜像页面, 会让镜像页面滚动 **240px**, 不清楚这里的比例关系是什么. 暂时全部按照 **1/2** 处理了
    
    1. keydown / keyup
    `keypress` 目前的状态是 `deprecated` , 并且监听不到 `Backspace` 等不会输入字符的按键. 这里监听 `keydown` 和 `keyup`
- keyboard
包括 `down` `press` `type` `up`
    
    

---

# 一、遇到的问题