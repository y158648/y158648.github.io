# React Server Components

[https://github.com/reactwg/server-components/discussions?discussions_q=](https://github.com/reactwg/server-components/discussions?discussions_q=)

[https://geekpaul.medium.com/lets-build-a-react-from-scratch-part-4-server-side-rendering-and-its-challenges-b7b87c84bbf](https://geekpaul.medium.com/lets-build-a-react-from-scratch-part-4-server-side-rendering-and-its-challenges-b7b87c84bbf)

[Making Sense of React Server Components](https://www.joshwcomeau.com/react/server-components/)

[https://react.dev/blog/2023/03/22/react-labs-what-we-have-been-working-on-march-2023#react-server-components](https://react.dev/blog/2023/03/22/react-labs-what-we-have-been-working-on-march-2023#react-server-components)

[https://nextjs.org/docs/app/building-your-application/rendering/server-components](https://nextjs.org/docs/app/building-your-application/rendering/server-components)

[https://vercel.com/blog/understanding-react-server-components](https://vercel.com/blog/understanding-react-server-components)

[https://github.com/reactwg/react-18/discussions/37](https://github.com/reactwg/react-18/discussions/37)

[https://vercel.com/templates/next.js/app-directory](https://vercel.com/templates/next.js/app-directory)

[Copy from Github](React%20Server%20Components%203b66afec10d94e46aa2ca5f9bd56c37e/Copy%20from%20Github%20a7630b8ee3ce45deb3d923403c63004f.md)

---

- what is RSC
- why use RSC
- how RSC works
- 
- RSC 是路由层级的?
- 为什么说 ssr 会在客户端和服务端执行2次? RSC只有服务端一次?
- defferences between RSC and SSR
    
    Server-Side Rendering (SSR) and React Server Components (RSC) are both techniques used in web development, particularly within the context of React applications, but they serve different purposes and operate in distinct ways:
    
    1. **Server-Side Rendering (SSR):**
        - **Purpose:** SSR is the process of rendering web pages on the server side and sending fully rendered HTML to the client/browser. This means that when a user requests a page, they receive a fully populated HTML document from the server.
        - **Benefits:**
            - Improved SEO: Search engines can easily crawl and index content since the page is already rendered.
            - Faster initial load: Users see content sooner as the initial HTML is sent from the server.
            - Better performance on slower devices or networks because the initial rendering is done on the server.
    2. **React Server Components (RSC):**
        - **Purpose:** RSC is a new experimental feature introduced by React to allow portions of a React component tree to be rendered on the server dynamically. It enables components to be rendered on the server and hydrated on the client side, allowing for server-rendered components to fetch data or interact with the server as needed.
        - **Benefits:**
            - Improved performance: RSC can potentially reduce the amount of data sent to the client by rendering only the necessary components.
            - Enhanced server-side logic: Allows components to execute server-side logic that doesn’t need to be sent to the client, enhancing security and reducing unnecessary client-side processing.
    
    **Key Differences:**
    
    - **Execution:** SSR renders the entire page on the server and sends it to the client, while RSC allows specific components to be rendered on the server and sent to the client dynamically.
    - **Granularity:** SSR renders the entire page, while RSC allows selective rendering of components, optimizing performance and resource usage.
    - **Flexibility:** RSC offers more control over which components are rendered on the server, allowing for better optimization of server-client interactions and reducing unnecessary data transfer.
    
    It's important to note that while SSR has been in use for a while and has established practices, React Server Components are still in the experimental phase and might evolve over time as they are further developed and adopted within the React ecosystem.
    
- client components 的 子组件默认都是 client components, 不需要声明 `use client` . nextjs 有个 dynamic rendering 不清楚是怎么个事, 可能和这个有点关系
- {cache: 'no-store'} 用于全局信息获取比如权限, 用户名?
- 某些选项之类的是服务端控制的, 是不是用 rsc?

> In practice, this model encourages developers to think about what they want to execute on the server first, before sending the result to the client and making the application interactive.
> 
- 路由层级, 参数在url params 和 searchParams
- 多了一个server components层, 这一层的信息是不包含交互的, 内容可以是不变的 static render 也可以是 每次刷新页面都变化的 dynamic render; 原本的client components在server components之下, 和之前一样, 会打包成不同的chunk, 包含带着交互的部分; 在整颗 react tree 中, client components 要尽量靠近下, 让其创造的 client boundary 尽可能小.
- 但 仅在服务端执行的代码 也可以在client components子组件中

> You can keep code on the server even though it's theoretically nested inside Client Components by interleaving Client and Server Components and [Server Actions](https://nextjs.org/docs/app/building-your-application/data-fetching/server-actions-and-mutations). See the [Composition Patterns](https://nextjs.org/docs/app/building-your-application/rendering/composition-patterns) page for more information.
> 
- RSC也可以嵌套在 client components 中: 通过children(或者其他任意prop)参数, 在客户端中创建 `slot` 给 RSC 使用
- Youtube断网也能加载layout, 体验就很棒, 虽然会陷入”我是否真的断网了”的疑问. RSC可以实现这种效果?

[Youtube 断网加载效果](React%20Server%20Components%203b66afec10d94e46aa2ca5f9bd56c37e/Youtube%20%E6%96%AD%E7%BD%91%E5%8A%A0%E8%BD%BD%E6%95%88%E6%9E%9C%20ecd70d04dcfe4ec1b5be79f375524929.md)