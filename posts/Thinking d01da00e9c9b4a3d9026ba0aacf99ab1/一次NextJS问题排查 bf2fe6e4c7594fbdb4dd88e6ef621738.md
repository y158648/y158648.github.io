---
layout: post1
date:   Fri Feb 16 2024 13:39:46 GMT+0000 (Coordinated Universal Time)
---
# 一次NextJS问题排查

<aside>
📖 **背景:** 页面切换路由会触发强制刷新, 页面整体大刷, 和预期*仅刷新路由控制部分*不符

</aside>

# 1. Reproduce

我本地开发和测试环境调试没遇到过这个问题, 所以一直没注意这个问题.

经和同事的环境对比, 发现触发的前提条件是关闭浏览器 `Disable cache` , 然后切换路由, 之后页面就强刷了, 时间线是: 一些 css 文件跨域 → 页面强制刷新 → 之前跨域的 css 请求成功 →页面成功加载

![Untitled](%E4%B8%80%E6%AC%A1NextJS%E9%97%AE%E9%A2%98%E6%8E%92%E6%9F%A5%20bf2fe6e4c7594fbdb4dd88e6ef621738/Untitled.png)

# 2. Why

根本原因是项目配置了 CDN, 即 `next.config.js` 中配置了 `assetsPrefix` , 这样的话对于 `_next/static` 路径下的资源, NextJS 会去 CDN 获取; 而 CDN 和 项目地址不是同一个 origin, 由此 css 文件发生了跨域.

可以注意到, 上面的 2 次 css 请求: 第一次是路由切换的时候, type 为 `fetch` ; 第二次 type 为 `stylesheet` 也就是 `link` 标签, 是页面刷新的时候.

有几个问题:

- 为什么跨域?
- 为什么打开 `Disable cache` 跨域就消失了?
- 为什么是 `fetch` 请求?
- 为什么页面刷新了?

## 2.1 为什么跨域?

来看一下发生跨域报错的请求:

![关闭 Disable cache 触发跨域](%E4%B8%80%E6%AC%A1NextJS%E9%97%AE%E9%A2%98%E6%8E%92%E6%9F%A5%20bf2fe6e4c7594fbdb4dd88e6ef621738/Untitled%201.png)

关闭 Disable cache 触发跨域

发生跨域错误的请求看不到请求头, 并且有这么一个提示:

> **Provisional headers are shown.** [Learn more](https://developer.chrome.com/docs/devtools/network/reference/?utm_source=devtools#provisional-headers)
> 

打开是 Chrome Devoloper 文档, 告诉了我们看不见 request headers 的原因是请求被缓存了, 但缓存内容不包括请求头:

> The request wasn't sent over the network but was served from a local cache, which doesn't store the original request headers. In this case, you can [disable caching](https://developer.chrome.com/docs/devtools/network/reference/?utm_source=devtools#disable-cache) to see the full request headers.
> 

这里我们可以通过控制台手动 `fetch` 来查看被缓存的文件:

```jsx
fetch("...", {
  "body": null,
  "method": "GET",
  "mode": "no-cors",
});
```

![被缓存的 css 文件的 Response Headers](%E4%B8%80%E6%AC%A1NextJS%E9%97%AE%E9%A2%98%E6%8E%92%E6%9F%A5%20bf2fe6e4c7594fbdb4dd88e6ef621738/Untitled%202.png)

被缓存的 css 文件的 Response Headers

请求头看不到, 但可以看到响应头: `Cache-Control` 设置了过期时间为 365 天, 并且是没有 `Access-Control-Allow-Origin` 头的.

所以, 为什么发生跨域的第一层原因就是: **缓存了一个没有 `Access-Control-Allow-Origin` 的请求, 二次请求 `origin` 不一致导致跨域.**

那么是什么时候被缓存的, 又是为什么没有 `Access-Control-Allow-Origin` 又被正常请求并缓存了呢?

对于什么时候, 显然, 是第一次访问项目地址的时候; 至于为什么没发生跨域问题, 是因为 `link` / `script` 默认是可以加载跨域资源的.

可以无痕环境看一下首次访问项目地址的资源请求:

![Untitled](%E4%B8%80%E6%AC%A1NextJS%E9%97%AE%E9%A2%98%E6%8E%92%E6%9F%A5%20bf2fe6e4c7594fbdb4dd88e6ef621738/Untitled%203.png)

对于同样的 css 文件, 第一次访问页面, `type` 为 `stylesheet` 即以 `link` 标签获取资源, 然后 css 文件被缓存. `link` 的请求头是这样的:

![Untitled](%E4%B8%80%E6%AC%A1NextJS%E9%97%AE%E9%A2%98%E6%8E%92%E6%9F%A5%20bf2fe6e4c7594fbdb4dd88e6ef621738/Untitled%204.png)

可以看到, 请求的模式是 `no-cors` , 所以资源可以正常被加载.

所以跨域问题的原因: **首次加载页面, 静态资源文件通过 `link` 标签, 以 `no-cors` 的模式被请求并被缓存了下来, 并且 `Response Headers`中没有 `Access-Control-Allow-Origin` 字段; 二次请求时, `origin` 不一致, 缓存的资源有没有跨域头, 然后导致了跨域问题.**

这看起来像一个 bug. 实际上, 继续深入了解, 发现这就是一个 bug!

## 2.2 为什么打开 `Disable cache` 跨域就消失了?

对比一下打开与不打开, 请求方式上并无区别, 都是 `fetch` 

![Untitled](%E4%B8%80%E6%AC%A1NextJS%E9%97%AE%E9%A2%98%E6%8E%92%E6%9F%A5%20bf2fe6e4c7594fbdb4dd88e6ef621738/Untitled%205.png)

看一下请求头:

![打开 Disable cache 未触发跨域 - Request Headers](%E4%B8%80%E6%AC%A1NextJS%E9%97%AE%E9%A2%98%E6%8E%92%E6%9F%A5%20bf2fe6e4c7594fbdb4dd88e6ef621738/Untitled%206.png)

打开 Disable cache 未触发跨域 - Request Headers

可以看到, 关闭缓存后的请求头中, 请求模式为 `cors` , 标记请求来源的字段除了 `Referer` 还多了一个 `Origin` 字段, 再看一下响应头可以发现, 控制跨域的字段也都有:

![打开 Disable cache 未触发跨域 - Response Headers](%E4%B8%80%E6%AC%A1NextJS%E9%97%AE%E9%A2%98%E6%8E%92%E6%9F%A5%20bf2fe6e4c7594fbdb4dd88e6ef621738/Untitled%207.png)

打开 Disable cache 未触发跨域 - Response Headers

所以这里为什么跨域问题消失: **关闭缓存时, `fetch` 请求模式为 `cors` ,  但响应头中包含 `Access-Control-Allow-Origin` 字段.**

至于为什么响应头多了跨域相关字段, 后文会提到.

## 2.3 为什么是 `fetch` 请求?

一个关键的问题, 为什么首次加载页面很正常的使用了 `link` 标签, 路由跳转的时候却用了 `fetch` 去请求?

浏览器并没有类似的机制, 所以问题应该是出在 NextJS 中.

这里出问题的 NextJS 版本是 `11.1.4` . 搜索源码能发现这样的代码

```tsx
// packages/next/client/route-loader.ts
function fetchStyleSheet(href: string): Promise<RouteStyleSheet> {
  let prom: Promise<RouteStyleSheet> | undefined = styleSheets.get(href)
  if (prom) {
    return prom
  }

  styleSheets.set(
    href,
    (prom = fetch(href)
      .then((res) => {
        if (!res.ok) {
          throw new Error(`Failed to load stylesheet: ${href}`)
        }
        return res.text().then((text) => ({ href: href, content: text }))
      })
      .catch((err) => {
        throw markAssetError(err)
      }))
  )
  return prom
}
```

每次切换路由的时候 NextJS 通过 `fetch` api 预先加载 css 资源.

`Link` 标签可以配置 `prefetch` 来预加载, 路由切换的时候通过 `fetch` 加载 css 的操作没看明白是为什么. 可能是为了让 css 和 页面对应的 bundle js 同步加载.

## 2.4 为什么页面刷新了?

同样是 NextJS 的代码:

```tsx
// packages/next/shared/lib/router/router.ts
if (isAssetError(err) || loadErrorFail) {
  Router.events.emit('routeChangeError', err, as, routeProps)

  // If we can't load the page it could be one of following reasons
  //  1. Page doesn't exists
  //  2. Page does exist in a different zone
  //  3. Internal error while loading the page

  // So, doing a hard reload is the proper way to deal with this.
  window.location.href = as

  // Changing the URL doesn't block executing the current code path.
  // So let's throw a cancellation error stop the routing logic.
  throw buildCancellationError()
}
```

> So, doing a hard reload is the proper way to deal with this.
> 

NextJS 对于资源错误或者加载错误做了统一的处理: **刷新试试**

# 3. How to Resolve

总结一下切换路由导致资源跨域页面刷新的原因:

1. 首次加载页面. 静态资源文件通过 `link` 标签, 以 `no-cors` 的模式被请求, 并被缓存了下来.
2. 切换路由, NextJS 通过 `fetch` prefetch 静态资源文件.
3. 浏览器找到并拿到缓存, 但 `origin` 匹配不上, 缓存的 `Response Headers` 中也没有 CORS 头, 报错
4. 报错信息被 NextJS catch, 刷新页面.

从这个时间线分析, 可以找到几种可能的解决办法

## 3.1 首次加载

前面的分析可以知道, 跨域的一个重要原因就是首次和二次加载资源的模式不一致, 即 Request Headers 中的 `Sec-Fetch-Mode` 字段: `no-cors` 和 `cors` :

> `[cors](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Sec-Fetch-Mode#cors)`
> 
> 
> The request is a [CORS protocol](https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS) request.
> 
> `[no-cors](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Sec-Fetch-Mode#no-cors)`
> 
> The request is a no-cors request (see `[Request.mode](https://developer.mozilla.org/en-US/docs/Web/API/Request/mode#value)`).
> 

要修改首次加载的模式, 自然是将 `no-cors` 改为 `cors` . 首次加载用的是 `link` 标签加载的.

### 3.1.1 请求拦截

查无此法. `link` 标签用的不是 `fetch` 也不是 `XHR` , browser js 不能拦截.

### 3.1.2 修改 link 的 request mode

 来看一下 `[link` 标签的文档](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/link#crossorigin), 可以看到有个属性 `crossorigin` , 其值可以填 `anonymous` :

> `[anonymous](https://developer.mozilla.org/en-US/docs/Web/HTML/Attributes/crossorigin#anonymous)`
> 
> 
> Request uses CORS headers and credentials flag is set to `'same-origin'`. There is no exchange of **user credentials** via cookies, client-side TLS certificates or HTTP authentication, unless destination is the same origin.
> 

也就是说, `link` 标签加上 `crossorigin="anonymous"` , 请求的模式就是 `CORS` 了.

这里的 `link` 标签是 NextJS 生成的, 搜索 NextJS 文档, 并无结果:

![Untitled](%E4%B8%80%E6%AC%A1NextJS%E9%97%AE%E9%A2%98%E6%8E%92%E6%9F%A5%20bf2fe6e4c7594fbdb4dd88e6ef621738/Untitled%208.png)

但是 Google 搜索 `nextjs crossorigin` 是能搜到[对应文档](https://nextjs.org/docs/messages/doc-crossorigin-deprecated)的:

> Add the config option:
> 
> 
> ```jsx
> module.exports = {
>   crossOrigin: 'anonymous',
> }
> ```
> 

不过文档没详细写加了这个配置会有什么作用, 搜索 NextJS 代码能看到其实就是把这个属性加到了 `link` 标签:

```tsx
// packages/next/build/webpack-config.ts
const crossOrigin = config.crossOrigin
...
'process.env.__NEXT_CROSS_ORIGIN': JSON.stringify(crossOrigin),

// packages/next/client/route-loader.ts
link!.crossOrigin = process.env.__NEXT_CROSS_ORIGIN!
```

修改 `next.config.js` , 重新发布后就能看到 `crossorigin` 已经加到 `link` 标签, 并且 request mode 改为了 `cors` :

![Untitled](%E4%B8%80%E6%AC%A1NextJS%E9%97%AE%E9%A2%98%E6%8E%92%E6%9F%A5%20bf2fe6e4c7594fbdb4dd88e6ef621738/Untitled%209.png)

![Untitled](%E4%B8%80%E6%AC%A1NextJS%E9%97%AE%E9%A2%98%E6%8E%92%E6%9F%A5%20bf2fe6e4c7594fbdb4dd88e6ef621738/Untitled%2010.png)

而且 `Response Headers` 中也有了 `Access-Control-Allow-Origin` 等字段. 同样, 至于为什么之前没有这些字段, 改为 `cors` 之后又有了, 下面会讲.

一切看起来都按照预期发展, 但刷新却发现部分页面样式全部丢失, 控制台报错信息也是 cors.

细想一下发现问题还是缓存造成的:

- 页面并不是第一次访问, 所有的资源文件都有缓存.
- 缓存的 css 是通过 `link` 标签以 `no-cors` 模式请求的, `Response Headers` 没有跨域相关字段.
- 修改配置之后, css 通过 `cors` 请求, 但因为缓存还没过期, `origin` 不匹配造成跨域

这里自然不能要求用户清除缓存. 需要让缓存失效的话, 有几种办法:

- 修改静态资源文件名.
这里针对的就是 css 文件, NextJS 的构建出的 css 文件名由 `MiniCssExtractPlugin` 配置生成的: `chunkFilename: 'static/css/[contenthash].css'` , 但 NextJS 并没有暴露方法让用户配置.
- 修改每一个 css 文件的内容.
应该是可以的, 但很不优雅, 没试.
- 修改静态资源文件路径.
CDN 就是把 `_next/static/` 下的文件传到另一个服务器的某个 dir, 修改一下这个 dir 就可以了.

至此, 问题解决, 很简单:

**1. `next.config.js` 添加 `crossOrigin` 配置.**

**2. 修改 CDN 路径**

## 3.2 手动将 fetch 改为 `no-cors` 模式

`fetch` 的 `request` 部分是由 `Request` 对象构建:

> The Fetch API uses `[Request](https://developer.mozilla.org/en-US/docs/Web/API/Request)` and `[Response](https://developer.mozilla.org/en-US/docs/Web/API/Response)` objects (and other things involved with network requests), as well as related concepts such as CORS and the HTTP Origin header semantics.
> 

对于 `Request` 构建的请求, `Sec-Fetch-Mode` 字段默认为 `cors` :

> For example, when a `Request` object is created using the `[Request()](https://developer.mozilla.org/en-US/docs/Web/API/Request/Request)` constructor, the value of the `mode` property for that `Request` is set to `cors`.
> 

NextJS 的 prefetch 逻辑中, 由 `fetch` 请求的静态资源都没传参数, mode 都是 `cors` .

可以通过 override fetch api, 将所有对 css 的请求改为 `no-cors` :

```tsx
const originFetch = window.fetch;
window.fetch = (...args) => {
  const url = args[0];

  if (typeof url === "string" && url.match(/static\/css\/[0-9A-z]+\.css/)) {
    return originFetch(url, { mode: "no-cors" });
  }
};
```

试了一下, 上述代码可以很好的运行, `fetch` 对 `css` 的请求也改为了 `no-cors` , 浏览器也能看到返回结果, 但是客户端却拿不到任何内容:

![Untitled](%E4%B8%80%E6%AC%A1NextJS%E9%97%AE%E9%A2%98%E6%8E%92%E6%9F%A5%20bf2fe6e4c7594fbdb4dd88e6ef621738/Untitled%2011.png)

继续看文档, 发现原来通过 `fetch` 请求的内容, 即使将 mode 设置为 `no-cors` , 也不能拿到 `Response` :

> `[no-cors](https://developer.mozilla.org/en-US/docs/Web/API/Request/mode#no-cors)`
> 
> 
> Prevents the method from being anything other than `HEAD`, `GET` or `POST`, and the headers from being anything other than [CORS-safelisted request headers](https://developer.mozilla.org/en-US/docs/Glossary/CORS-safelisted_request_header). If any ServiceWorkers intercept these requests, they may not add or override any headers except for those that are [CORS-safelisted request headers](https://developer.mozilla.org/en-US/docs/Glossary/CORS-safelisted_request_header). In addition, JavaScript may not access any properties of the resulting `[Response](https://developer.mozilla.org/en-US/docs/Web/API/Response)`. This ensures that ServiceWorkers do not affect the semantics of the Web and prevents security and privacy issues arising from leaking data across domains.
> 

**所以, 对 `fetch` 下手是行不通的**

## 3.3 静态资源服务设置跨域头

前面提到, 在默认状态下, 通过 `link` 标签 `no-cors` 模式加载 css, `Response Headers` 中没有 `Access-Control-Allow-Origin` 字段, 导致后续通过 `fetch` 请求 css 报错.

其实最简单的做法就是静态资源服务手动设置一下, 例如, `nginx` 配置:

```
location /static {
    alias /path/to/your/static/files;
    expires 30d; # Cache files for 30 days (adjust as needed)

    # CORS configuration
    add_header 'Access-Control-Allow-Origin' '*' always;
    add_header 'Access-Control-Allow-Methods' 'GET, OPTIONS' always;
    add_header 'Access-Control-Allow-Headers' 'DNT,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Range' always;

    # Other relevant settings like gzip_static, etc.
}
```

不过, 这里 CDN 不是我控制的, 没操作空间.

<aside>
💡 另外, 在 NextJS 源码中, 有这么一段处理 `cors` 的逻辑:

```tsx
// packages/next/server/dev/hot-reloader.ts
function addCorsSupport(req: IncomingMessage, res: ServerResponse) {
  const isApiRoute = req.url!.match(API_ROUTE)
  // API routes handle their own CORS headers
  if (isApiRoute) {
    return { preflight: false }
  }

  if (!req.headers.origin) {
    return { preflight: false }
  }

  res.setHeader('Access-Control-Allow-Origin', req.headers.origin)
  res.setHeader('Access-Control-Allow-Methods', 'OPTIONS, GET')
  // Based on https://github.com/primus/access-control/blob/4cf1bc0e54b086c91e6aa44fb14966fa5ef7549c/index.js#L158
  if (req.headers['access-control-request-headers']) {
    res.setHeader(
      'Access-Control-Allow-Headers',
      req.headers['access-control-request-headers'] as string
    )
  }

  if (req.method === 'OPTIONS') {
    res.writeHead(200)
    res.end()
    return { preflight: true }
  }

  return { preflight: false }
}
```

除了标记 `preflight`  请求, 如果请求中有 `origin` 字段, 则认为这是一个 `cors` 请求, 响应中也会加入与 `origin` 相同的 `Access-Control-Allow-Origin` .

回顾前面提到的 `cors` 和 `no-cors` 请求 css, 除了 `Sec-Fetch-Mode` 字段, 还有一个区别就是 `cors` 加入了 `origin` 字段. 这个逻辑可以在[W3C 文档](https://fetch.spec.whatwg.org/#origin-header)查到:

> If request’s [response tainting](https://fetch.spec.whatwg.org/#concept-request-response-tainting) is "`cors`" or request’s [mode](https://fetch.spec.whatwg.org/#concept-request-mode) is "`websocket`", then [append](https://fetch.spec.whatwg.org/#concept-header-list-append) (``Origin``, serializedOrigin) to request’s [header list](https://fetch.spec.whatwg.org/#concept-request-header-list).
> 

> A [request](https://fetch.spec.whatwg.org/#concept-request) has an associated response tainting, which is "`basic`", "`cors`", or "`opaque`". Unless stated otherwise, it is "`basic`".
> 

而加入了对于有 `origin` Request Headers 的请求, 静态资源服务返回了和 `origin` 相同的 `Access-Control-Allow-Origin` 这和上面 NextJS 的逻辑相同.

虽然 `[origin` 头不能手动修改](https://fetch.spec.whatwg.org/#forbidden-header-name), 但浏览器插件还是可以强行插入这个头的.

经过测试, 手动加入 `origin` Request Headers, 即使 `mode` 为 `no-cors` 也能拿到并缓存带有 `cors` 头的 css 文件.

![Untitled](%E4%B8%80%E6%AC%A1NextJS%E9%97%AE%E9%A2%98%E6%8E%92%E6%9F%A5%20bf2fe6e4c7594fbdb4dd88e6ef621738/Untitled%2012.png)

![Untitled](%E4%B8%80%E6%AC%A1NextJS%E9%97%AE%E9%A2%98%E6%8E%92%E6%9F%A5%20bf2fe6e4c7594fbdb4dd88e6ef621738/Untitled%2013.png)

</aside>

# 4. 后记

最开始提到, 这看起来是一个 bug, 于是翻看一下新版的 NextJS 代码, 发现 `v13.5.3` 合并了[这么一个PR](https://github.com/vercel/next.js/pull/55622/files), 将 `crossOrigin` 字段默认值设置为了 `''` , 效果和 `anonymous` 一样:

> Setting the attribute name to an empty value, like `crossorigin` or `crossorigin=""`, is the same as `anonymous`.
> 

```tsx
crossOrigin: nextConfig.crossOrigin || '',
```

NextJS 团队似乎也发现了问题, 但这次 PR 没有详细解释这一行的改动.

有一个 [2022 年初的 issue](https://github.com/vercel/next.js/issues/34225) , 最近有不少讨论, 可能是 Chrome 安全策略又有所更新. 其中有一些人提到, 上述代码改动导致没办法将 `crossOrigin` 设置为 `undefined` , 这会导致上面提到的由 `no-ors` 改为 `cors` 使得曾经缓存过资源文件发生跨域问题.