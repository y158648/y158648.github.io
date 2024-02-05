---
layout: post1
date:   Fri Feb 16 2024 13:39:46 GMT+0000 (Coordinated Universal Time)
---
# Snippet

- Chrome override 数据生成
    
    ```jsx
    /* eslint-disable */
    
    // 这个脚本的作用有2个: 
    //   1. 根据interface定义生成mock数据: 用途是部分页面没有权限的时候, 用户会看到真实的页面+假的数据+一层模糊的mask, 脚本用来生成假数据; 也可以用来本地mock数据调试
    //     @usage yarn mock <relativeInterfaceFilePath | interfaceFileName> [interfaceName]
    //     @example yarn mock src/api/business_insight/interface.ts BrandGmvConstituteTableResult
    //     @example yarn mock business_insight BrandGmvConstituteTableResult
    // 
    //   2. 根据接口生成浏览器的override目录: Chrome 117 版本更新的 override 功能, 路径在下面
    //     @usage yarn override <apiUrl>
    //     @example yarn override https://dmp.htj.pdd.net/mmsapi/brandbank/promotion_effect_v2/overview
    //
    // NOTICE: 这两个功能依赖于本项目标准的 .ts, .interface 定义模式, 例如 src/api/rfm_analysis
    
    // https://github.com/google/intermock
    const { mock } = require("intermock");
    const fs = require("fs");
    const path = require("path");
    
    // 浏览器对应的 override 路径, 需手动在浏览器设置
    const OVERRIDE_PATH = "api_override/dmp.htj.pdd.net";
    
    // 暂时只有默认(空)和override两种模式
    const mockMode = process.env.MOCK_MODE;
    
    if (mockMode === "override") {
      // 要 mock 的接口, 格式: https://dmp.htj.pdd.net/mmsapi/brandbank/promotion_effect_v2/overview
      const apiLink = process.argv[2];
      const apiPath = new URL(apiLink).pathname.slice(1);
      const { interfaceName, filePath } = findApiInterfaceName(apiLink);
      const interfaceFileContent = fs.readFileSync(filePath, "utf-8");
    
      const mockData = mock({
        files: [["docs", interfaceFileContent]],
        output: "object",
        language: "typescript",
        isOptionalAlwaysEnabled: true,
        interfaces: interfaceName ? [interfaceName] : undefined,
      });
    
      const targetObject = mockData[interfaceName];
      decorateObject(targetObject);
    
      const result = JSON.stringify(
        { success: true, result: targetObject },
        null,
        2
      );
    
      fs.writeFileSync(path.resolve(OVERRIDE_PATH, apiPath), result);
    }
    
    /**
     * 查找api对应的返回结果的interface名称
     * @param {string} api https://dmp.htj.pdd.net/mmsapi/brandbank/promotion_effect_v2/overview
     * @return {string} QueryOverviewDataResult
     */
    function findApiInterfaceName(api) {
      const curDir = fs.readdirSync(__dirname);
      const apiPath = new URL(api).pathname.slice(1);
      const regExp = new RegExp(
        `Result<(I\\.)?([A-z]+)(123123)?>[^\\.]+requests\\.post\\(\\n?\\s*"/?${apiPath}`
      );
      let interfaceName = "";
      let filePath = "";
    
      curDir.some((dir) => {
        if (fs.statSync(path.resolve(__dirname, dir)).isDirectory()) {
          const fileList = fs.readdirSync(path.resolve(__dirname, dir));
          let found = false;
    
          fileList.some((fileName) => {
            const curFilePath = path.resolve(__dirname, dir, fileName);
    
            if (
              fs.statSync(curFilePath).isFile() &&
              fileName !== "interface.ts" &&
              fileName !== "mock.json"
            ) {
              const content = fs.readFileSync(curFilePath, "utf-8");
              const match = content.match(regExp);
    
              if (match) {
                interfaceName = match[2];
                found = true;
    
                // 有I.前缀
                if (match[1]) {
                  filePath = path.resolve(curFilePath, "../", "interface.ts");
                } else {
                  filePath = curFilePath;
                }
    
                return found;
              }
            }
          });
    
          return found;
        }
      });
    
      return { interfaceName, filePath };
    }
    
    ```
    
- `fetch` progress logger