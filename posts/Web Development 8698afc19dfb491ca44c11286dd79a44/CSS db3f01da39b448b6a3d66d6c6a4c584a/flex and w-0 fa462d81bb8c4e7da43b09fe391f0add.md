---
layout: post1
date:   Fri Feb 16 2024 13:39:46 GMT+0000 (Coordinated Universal Time)
---
# flex and w-0

> 在弹性布局中，一个 flex 子项的最终尺寸是基础尺寸（或内容尺寸）、弹性增长或收缩、最大最小尺寸共同作用的结果。
最终尺寸计算的优先级是：
最大最小尺寸限制 > 弹性增长或收缩 > 基础尺寸
> 
> - 基础尺寸由 `flex-base` 属性或 `width` 属性，以及 `box-sizing` 盒模型共同决定；
> - 内容尺寸最指最大内容宽度，当没有设置基础尺寸是会顶替基础尺寸的角色；
> - 弹性增长指的是 `flex-grow` 属性，弹性收缩指的是 `flex-shrink` 属性；
> - 最大尺寸主要受 `max-width` 属性限制；最小尺寸则比较复杂，受最小内容宽度、`width` 属性和 `min-width` 属性共同影响。

![https://yogwang.site/2022/CSS-flex-container-stretched-by-content/problem_preview.png#center](https://yogwang.site/2022/CSS-flex-container-stretched-by-content/problem_preview.png#center)

很早之前就遇到过这个问题但没有整理，当时处理完问题之后就没有管了。昨天又遇到了同样的问题，因为嵌套的层次很深折腾了有2个小时，所以还是需要记录下来以免未来又忘了。

> 其实很简单，容器使用 width:0;flex:1; 即可解决问题。
> 

但是稍微有点没有理解的是：为什么设置宽度为 `0` 时，使用 `flex-grow:1` 可以使容器放大，但是设置宽度为 `100%` 时，使用 `flex-shrink:1` 并不会让容器缩小。

---

## **先来看一下问题复现吧:**

[https://codepen.io/yogwang/embed/YzErENN?height=600&amp;theme-id=dark&amp;slug-hash=YzErENN&amp;default-tab=result](https://codepen.io/yogwang/embed/YzErENN?height=600&amp;theme-id=dark&amp;slug-hash=YzErENN&amp;default-tab=result)

在正常内容的时候不会出现问题（可以点击 Demo 的 [EDIT ON CODEPEN](https://codepen.io/yogwang/pen/YzErENN) 最大化预览正常情况），但当元素内部的文字内容增多时，或者视窗缩小时 `flex` 容器的宽度就会被内容撑开。

看起来是不是十分复杂？因为我嵌套了 2 层 `flex` 容器，最内部的容器 `.list-item` 因为内容太多被撑开了，并没有如愿按照剩余空间缩小子元素 `.text` 的宽度，同时宽度变大的 `.list-item` 导致外部的 `.container` 和 `.wrap` 也被撑开了。

被撑开的 `flex` 容器比较多，不好说明，那么看一下简略版的复现 Demo 👇

[https://codepen.io/yogwang/embed/oNoGEqK?height=600&amp;theme-id=dark&amp;slug-hash=oNoGEqK&amp;default-tab=resul](https://codepen.io/yogwang/embed/oNoGEqK?height=600&amp;theme-id=dark&amp;slug-hash=oNoGEqK&amp;default-tab=resul)

这个就很简单明了了，因为 `.text` 的内容太多，致使 `.container` 容器被撑开了，并且 `.container` 的宽度变大使 `.wrap` 的宽度也增大了，并不是按照设想的 `100vw`。同时文本标题超出省略的样式也没有应用到。

**其实解决问题很简单，容器使用 `width:0;flex:1;` 即可解决问题。**

---

但是我疑惑的是，为什么宽度设置为 `0`，flex布局可以使容器放大，设置为 `100%` 就不能实现缩小了。找了一圈也没见原因，问了一下肉大，他说可能和内容宽度有关系，让我看看张大佬的《CSS新世界》。

### **🎉 果然在 `6.2.12` 这一节找到了类似的例子，并在 `6.3` 这一节中找到了具体解释。**

### **那设置了 `flex:1` 属性（[简写的 flex:1 具体简写了些什么？](https://yogwang.site/2022/CSS-what-happens-when-set-flex-1)）后，容器为什么和预期表现不一致？**

因为设置了 `flex-basis` 属性的元素的最小尺寸是最小内容的宽度（文字内容在所有换行点换行后的尺寸），而我设置了标题不换行导致最小尺寸比较大，最终尺寸大于 `flex:1` 给到的 `flex-basis:0%`。(如果我们把标题设置会换行容器就不会被撑开了）。
具体解释为：

> flex-basis 属性下的最小尺寸是由内容决定的，而 width 属性下的最小尺寸是由 width 属性的计算值决定的。
> 

这里出现的 **“最小尺寸”** 表示最终尺寸的最小值，所以在标题不换行的时候如果不设置 `width` 为 `0` 那么，`flex` 容器的宽度就会被内容撑开。当设置 `width:0` 之后，最小尺寸就为设置的 `width` 值了，就可以被 `flex-grow:1` 放大。

ok，以上就是 `flex` 容器被内容撑开的全部内容了，有条件的小伙伴可以入手一本 [《CSS新世界》](https://item.jd.com/13356308.html) 看看，里边的内容有很多讲些CSS新特性的实用例子，确实可以节约不少时间。

> 以上内容来自https://yogwang.site/2022/CSS-flex-container-stretched-by-content/
>