# 中国象棋——canvas版

## 1.示例图片

![](https://github.com/xhsdnn/canvas-chess/raw/master/assets/move.png)

> 更多图片在后面。

## 2.使用


```html
<canvas id="chess"></canvas>
```

```js
let chessDom = document.getElementById('chess');

let chess = new Chess(chessDom);

chess.start();
```

## 3.方法及属性

#### start()：

“开始游戏”以及“重新开始”的方法。

#### currentGroup（只读）：

表示当前移动的阵营：`r`表示红方，`b`表示黑方，默认红方起手。

#### overCallback：

“游戏结束”的回调，可以自定义方法赋值给`overCallback`，会在游戏结束时调用，默认为空。

#### moveCallback：

“本次移动结束”的回调，可以自定义方法赋值给`moveCallback`，会在当前移动棋子成功后调用，默认为空。

## 4.展示

![](https://github.com/xhsdnn/canvas-chess/raw/master/assets/start.png)
![](https://github.com/xhsdnn/canvas-chess/raw/master/assets/init.png)
![](https://github.com/xhsdnn/canvas-chess/raw/master/assets/over.png)
![](https://github.com/xhsdnn/canvas-chess/raw/master/assets/bg-move.png)
