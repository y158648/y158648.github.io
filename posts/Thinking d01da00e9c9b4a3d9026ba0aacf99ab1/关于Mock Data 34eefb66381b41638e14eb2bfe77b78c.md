---
layout: post1
date:   Fri Feb 16 2024 13:39:46 GMT+0000 (Coordinated Universal Time)
---
# 关于Mock Data

做了一个这样的需求:

> 站点用户分为有权限和无权限两种:
  - 如果有权限, 则正常渲染页面;
  - 如果没有权限, 则用假数据渲染页面;
> 

因为做的这个项目的类型定义是完备的, 所以我想寻找一个可以直接通过 `Typescript` 定义生成 mock data 的方法; 同时, 项目不会有太多的改动

问了问 ChatGPT, 刚开始描述的不全面, 他推荐了 https://github.com/faker-js/faker

> Generate massive amounts of fake (but realistic) data for testing and development.
> 

`faker.js` 强调 **massive** 和 **realistic**. 用法上是手动生成想要数据结构:

```jsx
import { faker } from '@faker-js/faker';

interface User { ... }

function createRandomUser(): User {
  return {
    _id: faker.datatype.uuid(),
    avatar: faker.image.avatar(),
    birthday: faker.date.birthdate(),
    email: faker.internet.email(),
    firstName: faker.person.firstName(),
    lastName: faker.person.lastName(),
    sex: faker.person.sexType(),
    subscriptionTier: faker.helpers.arrayElement(['free', 'basic', 'business']),
  };
}

const user = createRandomUser();
```

并不满足我的需求. 我又重新问了一下:

> ur anwser doesnt quite meet my requirement. what i want is just one mock data match the existing ts defination. i dont want to write the data structure again like `id: faker.random.number()`. what i want is: 1, give the ts interface 2. get one mock data to render the page without error
> 

这次 ChatGPT 推荐了 https://github.com/Typescript-TDD/ts-auto-mock, 看了下, 是满足我需求的:

```jsx
import { createMock } from 'ts-auto-mock';

interface Person {
    id: string;

    getName(): string;

    details: {
        phone: number
    }
}

const mock = createMock<Person>();
mock.id // ""
mock.getName() // ""
mock.details // "{ phone: 0 }"
```

但[用起来](https://typescript-tdd.github.io/ts-auto-mock/installation)有点麻烦了, 对项目有些比较大的改动:

> To make this library work you need to apply the `ts-auto-mock` transformer at compile time.
Unfortunately, TypeScript itself does not currently provide any easy way to use custom transformers out of the box.
> 

然后, Google 了一下还有其他包也做类似的功能

- https://github.com/NagRock/ts-mockito 周下载 180k, 没细看, 说是用于**单元测试**的
- https://github.com/google/intermock 这个包是 Google 的, 是 **node** 端针对 **ts 定义文件**生成 mock data

`intermock` 这个包就挺合适的, 官方推荐用 CLI

```bash
node ./node_modules/intermock/build/src/cli/index.js --files ./example-file.ts --interfaces "Admin"
```

或者, 也提供了一个API:

```tsx
mock(options: Options): object|string

export interface Options {
 // Array of file tuples. (filename, data)
 files?: Array<[string, string]>;

 // TypeScript is currently the only supported language
 language?: SupportedLanguage;

 // Specific interfaces to write to output
 interfaces?: string[];

 // Used for testing mode,
 isFixedMode?: boolean;

 // One of object|json|string. Strings have their object's functions
 // stringified.
 output?: OutputType;

 // Should optional properties always be enabled
 isOptionalAlwaysEnabled?: boolean;
}
```

考虑到需要 mock 的接口和定义非常多, 逐一排查并生成 mock data 的 ts 文件或者让所有接口都生成一份 ts 文件都不太优雅. 所以准备这么做:

1. 通过 `Next.js` 的 `API Routes` (`Next13` 中的 `Route Handlers`) 创建一个 `/api/mock`
2. 给统一的请求方法加一个 `isMock` 参数, 为 `true` 则走 `/api/mock` , 否则正常请求

`/api/mock` 的代码:

```tsx
import { NextApiRequest, NextApiResponse } from "next";
import fs from "fs";
// https://github.com/google/intermock
import { mock } from "intermock";

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const apiDirName = (req.query.url as string).split("/")[0];
  const resultInterfaceName = req.query.result as string;

  const interfaceFileContent = fs.readFileSync(
    `${process.cwd()}/src/api/${apiDirName}/interface.ts`,
    "utf-8"
  );

  const mockData = mock({
    files: [["docs", interfaceFileContent]],
    output: "object",
    language: "typescript",
    interfaces: [resultInterfaceName],
    isOptionalAlwaysEnabled: true,
  });

  res.status(200).json({
    success: true,
    result: mockData[resultInterfaceName],
  });
}
```

理想很美好, dev 环境跑的很良好. *但是*, `interface` 定义只是**开发时**的类型检查, 默认情况下并不会打包这部分代码. 另外, 考虑到数据类型和代码的安全问题, 这部分也不太适合打包到最终产物中.

最后, 还是针对不同的接口产出一份 mockData:

```jsx
/* eslint-disable */

// @usage node src/api/mock.js <relativeFilePath> [interfaceName]

// https://github.com/google/intermock
const { mock } = require("intermock");
const fs = require("fs");
const path = require("path");

const filePath = path.resolve(process.cwd(), process.argv[2]);
const interfaceName = process.argv[3];
const interfaceFileContent = fs.readFileSync(filePath, "utf-8");

const mockData = mock({
  files: [["docs", interfaceFileContent]],
  output: "object",
  language: "typescript",
  isOptionalAlwaysEnabled: true,
  interfaces: interfaceName ? [interfaceName] : undefined,
});

const originJson = fs.existsSync(path.resolve(filePath, "../mock.json"))
  ? JSON.parse(fs.readFileSync(path.resolve(filePath, "../mock.json")))
  : {};

fs.writeFileSync(
  path.resolve(filePath, "../mock.json"),
  JSON.stringify({ ...originJson, ...mockData }, null, 2)
);
```