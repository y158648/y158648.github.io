---
layout: post1
date:   Fri Feb 16 2024 13:39:46 GMT+0000 (Coordinated Universal Time)
---
# 小组Code Review顺序的随机性讨论

在一个小组中, 考虑一种合理的常见的互相code review顺序:

> A review B, B review C, …., N review A
> 

也就是一个首尾相连的随机序列. 下面是一种计算这种序列的可用的算法:

```jsx
/** 生成 [0, n) 的随机整数 */
const rand = (n) => {
  return Math.floor(Math.random() * n)
}

/** 每次抽一个, 下一次从抽剩下的抽一个 */
const randomFunction = arr => {
  /** 抽剩下的 */
  const left = [...arr]

  return arr.reduce((ret, cur) => {
    const randomIndex = rand(left.length)
    return [...ret, ...left.splice(randomIndex, 1)]
  }, [])
}
```

考虑到code review的顺序在一定时间后会变化一次, 所以在这种算法下, 有2个很明显的缺陷:

- 相邻比较近的code review顺序中可能存在一个或者多个重复的review对.
也就是第一次是*A review B*, 第二次或者第三次重新随机review顺序又出现了*A review B*的情况
- 同一个review对再次遇到的间隔的分布可能是极其不合理的
也就是出现了一次*A review B,* 下次再次出现*A review B*可能是第2次, 也可能第200次

以下算法可以计算, 相邻的两次随机的review顺序中, 有大约 **66%** 的可能性存在一对个或者多对重复的次序. 如果将 *A review B/B review A* 也算重复, 这个数字则是 **91%.**

```jsx
// 这里假设有13个人
const LIST = ["a", "b", "c", "d", "e", "f", "g", "h", "i", "j", "k", "l", "m"];

/** 获取相邻的两个序列出现重复次序的比例 */
const getExistRepeatRate = (arr) => {
  const num = 100000;
  let lastArr = [];
  let existRepeatNum = 0;
  for (let i = 0; i < num; i++) {
    lastArr.push(lastArr[0]);
    const curArr = randomFunction(arr);
    const curArrStr = [...curArr, curArr[0]].join("");
  
    if (lastArr.length) {
      let existRepeat = false;

      lastArr.reduce((last, cur) => {
        existRepeat =
          existRepeat ||
          curArrStr.includes(`${last}${cur}`)

        return cur;
      });

      if (existRepeat) {
        existRepeatNum += 1;
      }
    }
  
    lastArr = curArr;
  }
  console.log(existRepeatNum / num);
}

getExistRepeatRate(LIST)
```

还是假设有13个人, 在 `randomFunction` 算法下, 进行50000次模拟, 计算出现相邻的 *A review B* 之间间隔了几轮随机, 以及每个间隔出现了几次

![imgimage-20210912151050930.png](%E5%B0%8F%E7%BB%84Code%20Review%E9%A1%BA%E5%BA%8F%E7%9A%84%E9%9A%8F%E6%9C%BA%E6%80%A7%E8%AE%A8%E8%AE%BA%20ee7c20db6bdb4bdeb5da0380d6a3da10/imgimage-20210912151050930.png)

第一个图是 *A review B* 的散点图, x轴是这次是第几次遇到 *A review B*, y轴是本次遇到和上次间隔是多少. 

其线性回归线大约是 `y=11`, 也就是 *A review B* 平均出现的平均频率是**每12次随机顺序出现1次**. 因为 A 有12人可以review, 所以在平均频率上面, 和预期是一致的.

第二个图是 *A review B* 遇到的间隔数的柱状图. x轴是遇到的间隔, y轴是这个间隔出现的次数.可以看出, *A review B* 出现的间隔分布是不合理的, 出现了700次在连续的两次code review顺序中存在 *A review B* 的情况, 也存在code review顺序调整了100多次 A 都没机会review B 的情况

我们的期望应该是这样的:

- 平均12次出现一次 *A review B*
- 最多间隔 22 次就应该出现1次 *A review B*, 并且间隔数和间隔数出现的次数是成正态分布的, 直观上讲就是间隔 0 和间隔 22 出现的概率最小, 间隔 11 出现的概率最大

考虑到这里的review顺序就是一个环形的随机序列, 在 n 个人的小组中, 有

$$
\frac {A^n_n}{n} = (n-1)!
$$

种可能性, 那么可以将所有可能得顺序记为一次循环, 将循环中的序列打乱, 依次取出一个顺序作为本次review顺序.

但是, (13-1)! 是多少? **479001600!**

> 这一步猜想有点问题貌似
> 

需要换一个思路, 将任意 a->b 限制在 n-1次顺序中必定出现一次, 针对 n=13 的情况来说就是, 每12次一定出现一次 a->b:

```jsx
const randomFunction = () => {
  // 每次生成n-1个序列, 调用的时候从这里拿一个, 直到为空再生成一次
  const restList = []
  // 每个元素的随机列表, { a: [b,c,d,...], b: [a,c,d,...] }
  const arrItemRandomList = {}

  const generateArrItemRandomList = (arr) => {
    for (let i = 0; i < arr.length; i++) {
      // 其他元素的随机序列
      const othersItemList = [...arr.slice(0, i), ...arr.slice(i + 1)]
      arrItemRandomList[arr[i]] = randomFunction(othersItemList)
    }
  }

  // 生成n-1个顺序
  const generateList = (arr) => {
    generateArrItemRandomList(arr)
    restList.push(...findPathList(arr, arrItemRandomList, [], ["a"], "a"))
  }

  return (arr) => {
    if (!restList.length) {
      generateList(arr)
    }
    return restList.pop()
  }
}
```

其中 `arrItemRandomList` 是下图形式:

![https://y122972.oss-cn-shanghai.aliyuncs.com/imgimage-20210913142732844.png](https://y122972.oss-cn-shanghai.aliyuncs.com/imgimage-20210913142732844.png)

`arrItemRandomList` 表示在这12次随机的序列中, 每一个元素都会随机遇到其他元素各一次, 当然上面n个数组按顺序各取一个是不行的, 所以要经过一定的计算, 算出合理的n-1个序列.

`findPathList` 则是通过 `DFS` 根据 `arrItemRandomList` 找出 n-1 个序列:

```jsx
/** 
  * @param arr 元素集合
  * @param arrItemRandomList 本次生成的 n-1 个序列中每个元素对应的随机其他元素的顺序
  * @param pathList 生成的顺序, 生成 n-1 个之后就返回
  * @param path 当前顺序, 从第arr中一个元素开始, 到path长度和arr长度一致结束
  * @param curItem 序列的当前元素, 根据当前元素查找下一个可用的元素
  */
const findPathList = (arr, arrItemRandomList, pathList, path, curItem) => {
  // 终止条件, 找到n-1个序列
  if(pathList.length === arr.length - 1) {
    return pathList
  }

  // path为空的话, 说明是下一个序列的开始, nextItem只能是"a"
  const availableNextItemIndexList =
        path.length
  ? arrItemRandomList[curItem].reduce((ret, item, index) => path.includes(item) ? ret : [...ret, index], [])
  : arrItemRandomList[curItem].includes("a") ? [arrItemRandomList[curItem].findIndex((item, index) => item === "a")] : false

  // 如果没有可用的下一个元素, 则返回上一层
  if(!availableNextItemIndexList.length) {
    return false
  }

  // 遍历所有可用的下一个元素
  for(let i = 0; i < availableNextItemIndexList.length; i ++) {
    const nextItemIndex = availableNextItemIndexList[i]
    const nextItem = arrItemRandomList[curItem][nextItemIndex]

    arrItemRandomList[curItem].splice(nextItemIndex, 1)
    path.push(nextItem)

    let ret
    if(path.length === arr.length) {
      // 找满了一个序列
      ret = findPathList(arr, arrItemRandomList, [...pathList, path], [], nextItem)
    } else {
      ret = findPathList(arr, arrItemRandomList, pathList, [...path], nextItem)
    }

    // availableNextItemIndexList中有一条路径满足条件就返回
    if(ret) {
      return ret
    }

    // 没找到, 恢复状态, 遍历下一个availableNextItem
    path.pop()
    arrItemRandomList[curItem].splice(nextItemIndex, 0, nextItem)
  }

  return false
}
```

再次进行50000次模拟:

![https://y122972.oss-cn-shanghai.aliyuncs.com/imgimage-20210913143010485.png](https://y122972.oss-cn-shanghai.aliyuncs.com/imgimage-20210913143010485.png)

可以看出, 图一的间隔散点图, 基本落在 $y=11$ 附近, 图二的柱状图可以看出, a->b的间隔最大是 22. **满足期望**!

> 参考
- [明日方舟特定六星干员出率理论值的蒙特卡洛仿真估计](https://rpubs.com/zyLiu6707/711321)
>