# position: sticky;

> The element is positioned according to the *normal flow* of the document, and then offset relative to its *nearest scrolling ancestor* and [containing block](https://developer.mozilla.org/en-US/docs/Web/CSS/Containing_block) (nearest block-level ancestor), including table-related elements, based on the values of `top`, `right`, `bottom`, and `left`. The offset does not affect the position of any other elements.
> 
> 
> This value always creates a new [stacking context](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_positioned_layout/Understanding_z-index/Stacking_context). Note that a sticky element "sticks" to its nearest ancestor that has a "scrolling mechanism" (created when `overflow` is `hidden`, `scroll`, `auto`, or `overlay`), even if that ancestor isn't the nearest actually scrolling ancestor.
> 

常遇到的问题:

1. 常用的是 `sticky` 到 `body` 或者比较大的祖先节点, 所以父节点或者比较小的节点不能有 `overflow` 属性
2. 不能在非 `normal flow` 布局里面, 比如 `flex` 元素