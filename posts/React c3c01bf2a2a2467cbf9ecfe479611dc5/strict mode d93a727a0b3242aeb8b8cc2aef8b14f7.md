---
layout: post1
date:   Fri Feb 16 2024 13:39:46 GMT+0000 (Coordinated Universal Time)
---
# strict mode

> https://react.dev/reference/react/StrictMode
> 

> Strict Mode enables the following checks in development:
> 
> - Your components will [re-render an extra time](https://react.dev/reference/react/StrictMode#fixing-bugs-found-by-double-rendering-in-development) to find bugs caused by impure rendering.
> - Your components will [re-run Effects an extra time](https://react.dev/reference/react/StrictMode#fixing-bugs-found-by-re-running-effects-in-development) to find bugs caused by missing Effect cleanup.
> - Your components will [be checked for usage of deprecated APIs.](https://react.dev/reference/react/StrictMode#fixing-deprecation-warnings-enabled-by-strict-mode)
> 
> **All of these checks are development-only and do not impact the production build.**
> 

这是一个只在*开发*环境生效的功能, 目的是通过上述的 **checks** 来更好的发现潜在的bug

React Core 团队成员 [Dan Abramov](https://twitter.com/dan_abramov) 是这么说的:

> It is expected that setState updaters will run twice in strict mode in development. This helps ensure the code doesn't rely on them running a single time (which wouldn't be the case if an async render was aborted and alter restarted). If your setState updaters are pure functions (as they should be) then this shouldn't affect the logic of your application.
> 
> 
> [https://github.com/facebook/react/issues/12856#issuecomment-390206425](https://github.com/facebook/react/issues/12856#issuecomment-390206425)
> 

[reactStrictMode](https://nextjs.org/docs/app/api-reference/next-config-js/reactStrictMode) 在 Next 是默认开启的, 并且*强烈建议*开启, 老项目实在开不了可以只给新页面开启:

```
<React.StrictMode>
  // Your newly added component
  ...
</React.StrictMode>
```