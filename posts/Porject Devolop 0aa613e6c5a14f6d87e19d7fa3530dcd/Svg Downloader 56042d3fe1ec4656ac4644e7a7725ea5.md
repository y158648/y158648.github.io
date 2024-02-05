---
layout: post1
date:   Fri Feb 16 2024 13:39:46 GMT+0000 (Coordinated Universal Time)
---
# Svg Downloader

<aside>
📖 **背景**: 想下载 `React` 官网 的图标, 发现是 `svg` 格式, 于是问了下AI怎么操作. 感觉发布一个Chrome Extension 就很合适

</aside>

---

> 参考
> 
> 1. [chrome-extensions-samples/api-samples/contextMenus](https://github.com/GoogleChrome/chrome-extensions-samples/tree/main/api-samples/contextMenus)
> 2. [https://developer.chrome.com/docs/extensions/mv3/manifest/](https://developer.chrome.com/docs/extensions/mv3/manifest/)

---

# Core Concepts

## 0. manifest.json

> Every extension requires a [JSON](https://developer.mozilla.org/docs/Glossary/JSON)-formatted file, named `manifest.json`, that provides important information. This file must be located in the extension's root directory.
> 

插件的配置文件, 类似于 `package.json`

## 1. background

> An optional manifest key used to specify a javascript file as the extension service worker. A service worker is a background script that acts as the extension's main event handler. For more information, visit the [more comprehensive introduction to service workers](https://developer.chrome.com/docs/extensions/mv3/service_workers/#manifest).
> 

运行在后台的脚本, 右键菜单的创建需要在这里

```jsx
// menifest.json
{
...
	"background": {
    "service_worker": "js/service-worker.js"
  },
...
}
```

## 2. **content scripts**

> The `"content_scripts"` key specifies a statically loaded JavaScript or CSS file to be used every time a page is opened that matches a certain [URL pattern](https://developer.chrome.com/docs/extensions/mv3/match_patterns/). Extensions can also inject content scripts programmatically, see [Injecting Scripts](https://developer.chrome.com/docs/extensions/mv3/content_scripts/) for details.
> 

每个页面独立的 js 或者 css

```jsx
// menifest.json
{
...
	"content_scripts": [
    {
      "matches": [
        "<all_urls>"
      ],
      "js": [
        "js/content-scripts.js"
      ],
      "css": [],
      "run_at": "document_start"
    }
  ],
...
}
```

## 3. **Message passing**

> Since content scripts run in the context of a web page and not the extension, they often need some way of communicating with the rest of the extension. For example, an RSS reader extension might use content scripts to detect the presence of an RSS feed on a page, then notify the background page in order to display a page action icon for that page.
> 

`background` 是在插件本身的上下文环境, 而 `content script` 是在页面的上下文, 通讯的话需要通过 `chrome.runtime.sendMessage` `chrome.runtime.onMessage` : [https://developer.chrome.com/docs/extensions/mv3/messaging/](https://developer.chrome.com/docs/extensions/mv3/messaging/)

# Developing

## 1. Init project

```bash
mkdir svg-downloader
cd svg-downloader
npm init
git init
touch .gitignore
echo "node_modules" > .gitignore

# install types
yarn add @types/chrome
```

## 2.

---

# 遇到的一些问题

- Manifest version 2 is deprecated, and support will be removed in 2023. See [https://developer.chrome.com/blog/mv2-transition/](https://developer.chrome.com/blog/mv2-transition/) for more details.
    
    > The Manifest V2 support timeline has been updated. See our [September 2022 blog post](https://developer.chrome.com/blog/more-mv2-transition/) and the [Manifest V2 support timeline](https://developer.chrome.com/docs/extensions/mv3/mv2-sunset/) page for more details.
    > 
    
    v2 的 `manifest` 已经不再用了, 需要改成 v3. v3 最低支持版本是 Chrome 88.
    
    文章中提到的一些特性已经不再支持, 详情参考 [Develop extensions](https://developer.chrome.com/docs/extensions/mv3/devguide/)
    
- Could not establish connection. Receiving end does not exist
    
    原因从 `background` 直接 `sendMessage` 到 `content scripts` , 两者在独立的环境下, 后者监听不到前者发的信息. 应该这么做
    
    ```jsx
    // Specify which tab to receive the message
    chrome.tabs.sendMessage(tab.id, { info });
    ```
    

---

- Refused to execute inline script…
    
    `popup.html` 等页面中不允许直接执行 script, 需要引用 `<script src="js/popup.js"></script>` 
    
- tabs 权限问题
    
    > Use the chrome.tabs API to interact with the browser's tab system. You can use this API to create, modify, and rearrange tabs in the browser. Permissions: The majority of the chrome.tabs API can be used without declaring any permission. However, the "tabs" permission is required in order to populate the url, title, and favIconUrl properties of Tab.
    > 
    
    根据介绍, 调用 `chrome.tabs` 不需要在 `permissions` 中添加 `tabs` , 添加了会导致上架审核失败:
    
    > …
    > 
    > - **违规行为**：无需为产品实现的方法/属性请求以下权限：
    >     - tabs
    > 
    > …
    >