/* Chess
 * version: 1.0.1
 */
class Chess {
    constructor(dom, width, height) {
        this.dom = dom;
        this.ctx = this.dom.getContext('2d');
        this.gridWidth = 50; // 每个格子的宽度
        this.padding = 50; // 棋盘距离canvas边缘的间距
        this.dom.width = width || 50 * 8 + this.padding * 2;
        this.dom.height = height || 50 * 8 + 50 + this.padding * 2;
        this.boardWidth = this.dom.width - this.padding * 2; // 棋盘宽度
        this.boardHeight = this.dom.height - this.padding * 2; // 棋盘高度
        this.positions = []; // 保存所有点的坐标
        this.bend = { // 炮和卒/兵位置的折线
            len: 10, // 折线长度
            gap: 3 // 折线距网格的距离
        };
        this.chessBound = this.dom.getBoundingClientRect(); // 象棋棋盘的位置top/left/bottom/right

        this.roles = {
            'r_ju': "車",
            'r_ma': "馬",
            'r_xiang': "相",
            'r_shi': "仕",
            'r_shuai': "帥",
            'r_pao': "炮",
            'r_bing': "兵",

            'b_ju': "車",
            'b_ma': "馬",
            'b_xiang': "象",
            'b_shi': "士",
            'b_shuai': "将",
            'b_pao': "炮",
            'b_bing': "卒"
        }; // 定义象棋的角色集合
        this.radius = 20; // 每个棋子的半径
        this.currentChessman = ""; // 当前棋子x/y/role
        this.isFirePao = 0; // 是否可以“开炮”标志，表示“炮”与目标之间的棋子数
        this.destPosition = ''; // 每次移动目标位置的角色
        this.overCallback = ""; // 用户传入的结束回调
        this.moveCallback = ""; // 用户传入的移动成功回调

        this.currentGroup = "r"; // 当前可以移动的阵营，r:红方，b:黑方，默认“红方”起手

    }
    
    start() {
        // 清空画布及初始化相应数据
        this.ctx.clearRect(0, 0, this.dom.width, this.dom.height);
        this.positions = [];
        this.currentChessman = "";
        this.isFirePao = 0;
        this.destPosition = '';
        this.currentGroup = "r";

        // 绑定鼠标事件
        this.bindEvent();

        this.initBoard(); // 初始化棋盘

        let redGroup = ['r_ju', 'r_ma', 'r_xiang', 'r_shi', 'r_shuai', 'r_shi', 'r_xiang', 'r_ma', 'r_ju', 'r_pao', 'r_pao', 'r_bing', 'r_bing', 'r_bing', 'r_bing', 'r_bing'];
        let blackGroup = ['b_ju', 'b_ma', 'b_xiang', 'b_shi', 'b_shuai', 'b_shi', 'b_xiang', 'b_ma', 'b_ju', 'b_pao', 'b_pao', 'b_bing', 'b_bing', 'b_bing', 'b_bing', 'b_bing'];
        this.initChessman(redGroup); // 初始化红棋
        this.initChessman(blackGroup); // 初始化黑棋
    }

    // 游戏结束
    gameover() {
        this.removeEvent();

        if(this.overCallback) {
            this.overCallback();
        } else {
            alert('game over');
        }
    }

    // 获取canvas某个位置上的角色
    getRole(x, y) {
        let chessman = "";

        for (let i = 0; i < this.positions.length; i++) {
            let position = this.positions[i];

            // 点击的点到每个棋盘点的距离
            let distance = Math.sqrt(Math.pow(Math.abs(x - position.x), 2) + Math.pow(Math.abs(y - position.y), 2));

            if (this.radius >= distance) {
                chessman = position;
            }
        }
        return chessman;
    }

    // 取消鼠标事件
    removeEvent() {
        this.dom.onmousedown = "";
    }

    // 绑定鼠标事件
    bindEvent() {
        let self = this;
        this.dom.onmousedown = function () {
            // 当前点击的位置在canvas中的相对位置
            let x = event.pageX - self.chessBound.left - self.padding;
            let y = event.pageY - self.chessBound.top - self.padding;

            // 获取当前位置最近的棋盘交叉点
            let currentPosition = self.getRole(x, y);
            console.log("当前点击的位置为：", currentPosition ? currentPosition : "空");
            if (!currentPosition) return;

            let currentPositionRole = currentPosition.role.split('_')[1]; // 当前点击角色
            let currentPositionGroup = currentPosition.role.split('_')[0]; // 当前点击阵营
            let isMoveSuccess = false; // 当前棋子是否移动成功

            // 先判断是否有已经被选中的棋子，如果有，当前点击则目标位置，如果没有当前点击则为起始位置
            if (self.currentChessman) {
                let currentRole = self.currentChessman.role.split('_')[0];
                let positionRole = currentPosition.role.split('_')[0];

                if (currentRole == positionRole) { // 判断是否相同阵营
                    self.currentChessman = currentPosition;
                } else {
                    // 移动棋子
                    isMoveSuccess = self.moveChessman(self.currentChessman.x, self.currentChessman.y, currentPosition.x, currentPosition.y);

                    // 移动成功切换阵营
                    if(isMoveSuccess) {
                        self.currentGroup = self.currentGroup == "r" ? "b" : "r";
                        self.moveCallback && self.moveCallback();
                    }
                }
            } else {
                if(currentPositionGroup != self.currentGroup) return; // 当前点击与可以动阵营不符
                self.currentChessman = currentPosition ? (currentPosition.role ? currentPosition : "") : "";
            }

            self.redraw();

            if(self.isGameover(currentPositionRole, isMoveSuccess)) self.gameover();

        }
    }

    /* 判断游戏是否结束
     * destRole —— 移动结束位置的角色
     * isMove —— 本次移动是否成功
     */
    isGameover(destRole, isMove) {
        // 如果目标为“shuai”且移动成功，则游戏结束
        if(destRole == "shuai" && isMove) {
            return true;
        }

        // 如果“将”和“帅”相对，则游戏结束
        let yNumCounts = [0,0,0,0,0,0,0,0,0]; // 记录9列中每列的棋子个数
        let xRShuai = ""; // 红方“帅”x坐标
        let xBShuai = ""; // 黑方“帅”x坐标

        for(let i=0; i<this.positions.length; i++) {
            let position = this.positions[i];
            if(position.role) {
                yNumCounts[position.x/this.gridWidth]++;
            }

            if(position.role == "r_shuai") xRShuai = position.x/this.gridWidth;
            if(position.role == "b_shuai") xBShuai = position.x/this.gridWidth;
        }

        if(xRShuai && xBShuai && xRShuai == xBShuai && yNumCounts[xRShuai] == 2) {
            return true;
        }

        return false;
    }

    // 重绘方法
    redraw() {
        this.ctx.clearRect(0, 0, this.dom.width, this.dom.height);
        this.initBoard(true);
        for (let i = 0; i < this.positions.length; i++) {
            let position = this.positions[i];

            if (this.currentChessman && this.currentChessman.x == position.x && this.currentChessman.y == position.y) {
                position.current = true;
            } else {
                position.current = false;
            }

            if (position.role) {
                this.drawChessman(position.x, position.y, position.role, position.current);
            }
        }
    }

    // 初始化棋盘
    initBoard(isRedraw = false) {

        this.ctx.save();
        this.ctx.translate(this.padding, this.padding);

        this.ctx.strokeStyle = "#000";
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        // 初始化棋盘，采用纵向布局，为10行9列的二维矩阵（10*9）
        for (let i = 0; i < 10; i++) {
            for (let j = 0; j < 9; j++) {
                // 保存每个可用点位置
                if (!isRedraw) {
                    this.positions.push({
                        x: j * this.gridWidth,
                        y: i * this.gridWidth,
                        role: ''
                    });
                }

                // 取消最后一行的多余线条以及中间的“楚河 汉界”
                if ((i != 9 && i != 4) || (i == 4 && (j == 0 || j == 8))) {
                    // 向下
                    this.ctx.moveTo(j * this.gridWidth, i * this.gridWidth);
                    this.ctx.lineTo(j * this.gridWidth, (i + 1) * this.gridWidth);
                }
                // 取消最后一列的多余线条
                if (j != 8) {
                    // 向右
                    this.ctx.moveTo(j * this.gridWidth, i * this.gridWidth);
                    this.ctx.lineTo((j + 1) * this.gridWidth, i * this.gridWidth);
                }

                // 绘制“将”、“帅”部分的交叉线
                if ((i == 0 || i == 9) && (j == 3 || j == 5)) {
                    this.ctx.moveTo(j * this.gridWidth, i * this.gridWidth);
                    this.ctx.lineTo((j + (j == 3 ? 2 : -2)) * this.gridWidth, (i + (i == 0 ? 2 : -2)) * this.gridWidth);
                }

                // 绘制炮和卒/兵位置的折线
                if (((i == 2 || i == 7) && (j == 1 || j == 7)) || ((i == 3 || i == 6) && (j == 0 || j == 2 || j == 4 || j == 6 || j == 8))) {
                    this.drawBend(j * this.gridWidth, i * this.gridWidth, this.bend.gap, this.bend.len);
                }

            }
        }
        // 绘制“楚河 汉界”
        this.drawBound();

        this.ctx.stroke();
        this.ctx.closePath();
        this.ctx.restore();
    }

    // 添加背景(取消) —— 采用背景图片的形式
    drawBackground() {
        let img = new Image();
        img.src = "./assets/background.png";
        img.onload = () => {
            this.ctx.drawImage(img, 0, 0, this.dom.width, this.dom.height);
            this.initBoard(); // 初始化棋盘

            let redGroup = ['r_ju', 'r_ma', 'r_xiang', 'r_shi', 'r_shuai', 'r_shi', 'r_xiang', 'r_ma', 'r_ju', 'r_pao', 'r_pao', 'r_bing', 'r_bing', 'r_bing', 'r_bing', 'r_bing'];
            let blackGroup = ['b_ju', 'b_ma', 'b_xiang', 'b_shi', 'b_shuai', 'b_shi', 'b_xiang', 'b_ma', 'b_ju', 'b_pao', 'b_pao', 'b_bing', 'b_bing', 'b_bing', 'b_bing', 'b_bing'];
            this.initChessman(redGroup); // 初始化红棋
            this.initChessman(blackGroup); // 初始化黑棋
        }
    }

    /* 绘制折线
     * x —— 起始x坐标
     * y —— 起始y坐标
     * gap —— 与网格之间的距离
     * len —— 绘制的长度
     */
    drawBend(x, y, gap, len) {
        let quadrants = [ // 以x,y为原点四个象限的单位坐标
            [1, -1],
            [1, 1],
            [-1, 1],
            [-1, -1]
        ];

        for (let i = 0; i < quadrants.length; i++) {
            // 超出棋盘位置则不绘制
            if (x + gap * quadrants[i][0] < 0 || x + gap * quadrants[i][0] > this.boardWidth || y + gap * quadrants[i][1] < 0 || y + gap * quadrants[i][1] > this.boardHeight) {
                continue;
            }

            this.ctx.moveTo(x + gap * quadrants[i][0], y + gap * quadrants[i][1]);
            this.ctx.lineTo(x + gap * quadrants[i][0], y + (gap + len) * quadrants[i][1]);
            this.ctx.moveTo(x + gap * quadrants[i][0], y + gap * quadrants[i][1]);
            this.ctx.lineTo(x + (gap + len) * quadrants[i][0], y + gap * quadrants[i][1]);
        }
    }

    // 绘制“楚河 汉界”
    drawBound() {
        let texts = ["楚河", "汉界"];

        for (let i = 0; i < texts.length; i++) {
            this.ctx.save();
            this.ctx.translate(this.boardWidth / 2, this.boardHeight / 2);
            // 旋转画布
            this.ctx.rotate((i % 2 == 0 ? -0.5 : 0.5) * Math.PI);

            this.ctx.fillStyle = "#000";
            this.ctx.font = '28px Airal';
            this.ctx.textBaseline = "hanging";
            this.ctx.textAlign = "center";
            this.ctx.fillText(texts[i].charAt(0), 0 * this.gridWidth, -3 * this.gridWidth);
            this.ctx.fillText(texts[i].charAt(1), 0 * this.gridWidth, -2 * this.gridWidth);

            this.ctx.restore();
        }
    }

    // 初始化棋子
    initChessman(team) {
        // 绘制红方棋子
        for (let i = 0; i < team.length; i++) {
            let isRed = team[i].indexOf('b_') == -1; // 判断是红棋(true)还是黑棋(false)

            if (i < 9) { // 底边10个棋子
                this.drawChessman(i * this.gridWidth, (isRed ? 0 : 9 - 0) * this.gridWidth, team[i]);
            } else if (i < 11) { // “炮”，位置分别为1、7
                this.drawChessman(((i - 9) * 6 + 1) * this.gridWidth, (isRed ? 2 : 9 - 2) * this.gridWidth, team[i]);
            } else { // “兵”
                this.drawChessman((i - 11) * 2 * this.gridWidth, (isRed ? 3 : 9 - 3) * this.gridWidth, team[i]);
            }
        }
    }

    /* 绘制一个棋子
     * x —— 棋子中心x坐标
     * y —— 棋子中心y坐标
     * role —— 棋子角色，即：车、马、炮...
     */
    drawChessman(x, y, role, current = false) {
        // 赋予当前点角色
        for (let i = 0; i < this.positions.length; i++) {
            let position = this.positions[i];
            if (position.x == x && position.y == y) {
                position.role = role;
            }
        }

        this.ctx.save();
        this.ctx.translate(this.padding, this.padding); // 将圆心移至棋盘左上角
        this.ctx.translate(x, y);

        role.indexOf('b_') == -1 && this.ctx.rotate(Math.PI); // 是红方才旋转

        if (current) {
            let lacuna = 2; // 选中边框距离象棋的空隙
            this.ctx.beginPath();
            this.ctx.strokeStyle = 'red';
            this.ctx.rect(-this.radius - lacuna, -this.radius - lacuna, (this.radius + lacuna) * 2, (this.radius + lacuna) * 2);
            this.ctx.stroke();
            this.ctx.closePath();
        }

        this.ctx.beginPath();
        this.ctx.fillStyle = '#eac419';
        this.ctx.arc(0, 0, this.radius, 0, 2 * Math.PI);
        this.ctx.fill();
        this.ctx.closePath();

        this.ctx.beginPath();
        this.ctx.fillStyle = role.indexOf('b_') == -1 ? 'red' : 'black';
        this.ctx.font = '20px Airal';
        this.ctx.textAlign = "center";
        this.ctx.textBaseline = "middle";
        this.ctx.fillText(this.roles[role], 0, 0);
        this.ctx.fill();
        this.ctx.closePath();

        this.ctx.restore();
    }

    // 移动棋子
    moveChessman(sx, sy, dx, dy) {
        this.isFirePao = 0;

        let group = this.currentChessman.role.split('_')[0]; // 棋子的阵营（红/黑）
        let role = this.currentChessman.role.split('_')[1]; // 棋子的角色（无关红/黑）

        // 根据不同角色（role）的规则选择对应的判断方法
        let moveStatus = false;

        // 如果两个点相同则返回false
        if (sx == dx && sy == dy) {
            moveStatus = false;
        } else {
            let startGroup = this.currentChessman.role.split("_")[0]; // 起始位置棋子阵营
            let destGroup = ''; // 目标位置棋子阵营
            let isForbid = false; // 判断路径上是否有其他棋子

            for (let i = 0; i < this.positions.length; i++) {
                let position = this.positions[i];

                switch (role) {
                    case "ju":
                        isForbid = this.isForbidJu(sx, sy, dx, dy, position);
                        break;
                    case "ma":
                        isForbid = this.isForbidMa(sx, sy, dx, dy, position);
                        break;
                    case "xiang":
                        isForbid = this.isForbidXiang(sx, sy, dx, dy, position);
                        break;
                    case "shi":
                        isForbid = this.isForbidShi(sx, sy, dx, dy, position);
                        break;
                    case "shuai":
                        isForbid = this.isForbidShuai(sx, sy, dx, dy, position);
                        break;
                    case "pao":
                        isForbid = this.isForbidPao(sx, sy, dx, dy, position);
                        break;
                    case "bing":
                        isForbid = this.isForbidBing(sx, sy, dx, dy, this.currentChessman);
                        break;
                    default:
                        isForbid = true;
                        console.log('+++ 没有对应的规则 +++');
                }

                if (isForbid) {
                    break;
                }

                if (position.x == dx && position.y == dy) {
                    destGroup = position.role ? position.role.split("_")[0] : "";
                }
            }

            if (isForbid) {
                moveStatus = false;
            } else if (startGroup != destGroup) { // 判断是否相同阵营
                moveStatus = true;
            } else {
                moveStatus = false;
            }
        }

        if (!moveStatus) return false;

        for (let i = 0; i < this.positions.length; i++) {
            let position = this.positions[i];

            if (position.x == sx && position.y == sy) {
                position.role = "";
            }
            if (position.x == dx && position.y == dy) {
                position.role = group + "_" + role;
            }
        }

        this.currentChessman = '';

        return true;
    }

    /* 游戏规则 */

    /* 車
     * sx —— startX起点x坐标
     * sy —— startY起点y坐标
     * dx —— destinationX目标x坐标
     * dy —— destinationY目标y坐标
     * position —— 当前位置信息
     */
    isForbidJu(sx, sy, dx, dy, position) {
        if (sx != dx && sy != dy) return true;

        let arrX = upSort([sx, dx]); // 将x坐标升序排列
        let arrY = upSort([sy, dy]); // 将y坐标升序排列

        let isForbid = sx == dx ? position.x == sx && position.y > arrY[0] && position.y < arrY[1] && position.role : position.y == sy && position.x > arrX[0] && position.x < arrX[1] && position.role;
        return isForbid;
    }
    // 馬
    isForbidMa(sx, sy, dx, dy, position) {
        let isForbid = false;
        let isPossibleSize = [ // 可能要移动位置的相对格数
            { x: 1, y: 2 },
            { x: -1, y: 2 },
            { x: 1, y: -2 },
            { x: -1, y: -2 },
            { x: 2, y: 1 },
            { x: -2, y: 1 },
            { x: 2, y: -1 },
            { x: -2, y: -1 }
        ];

        for (let i = 0; i < isPossibleSize.length; i++) {
            let size = isPossibleSize[i];
            let x = sx + size.x * this.gridWidth;
            let y = sy + size.y * this.gridWidth;

            if (x >= 0 && x <= 8 * this.gridWidth && y >= 0 && y <= 9 * this.gridWidth && x == dx && y == dy) {
                if (Math.abs(size.y) == 2 && position.x == sx && position.y == y - 1 * size.y / 2 * this.gridWidth && position.role) {
                    return true;
                }

                if (Math.abs(size.x) == 2 && position.y == sy && position.x == x - 1 * size.x / 2 * this.gridWidth && position.role) {
                    return true;
                }

                return false;
            }
        }
        // 点的位置不在可能移动的范围内
        return true;
    }
    // 相/像
    isForbidXiang(sx, sy, dx, dy, position) {
        let isForbid = false;

        // 不能过“楚河 汉界”
        if (sy <= 4 * this.gridWidth && dy >= 5 * this.gridWidth) return true;
        if (sy >= 5 * this.gridWidth && dy <= 4 * this.gridWidth) return true;

        let isPossibleSize = [ // 可能要移动位置的相对格数
            { x: 2, y: 2 },
            { x: 2, y: -2 },
            { x: -2, y: 2 },
            { x: -2, y: -2 }
        ];

        for (let i = 0; i < isPossibleSize.length; i++) {
            let size = isPossibleSize[i];
            let x = sx + size.x * this.gridWidth;
            let y = sy + size.y * this.gridWidth;

            if (x >= 0 && x <= 8 * this.gridWidth && y >= 0 && y <= 9 * this.gridWidth && x == dx && y == dy) {
                if (position.x == sx + size.x / 2 * this.gridWidth && position.y == sy + size.y / 2 * this.gridWidth && position.role) {
                    return true;
                }

                return false;
            }
        }
        // 点的位置不在可能移动的范围内
        return true;
    }
    // 仕/士
    isForbidShi(sx, sy, dx, dy, position) {
        // 限定“士”的整个活动区域
        if (dx < 3 * this.gridWidth || dx > 5 * this.gridWidth) return true;
        if (sy < 4 * this.gridWidth && dy > 2 * this.gridWidth) return true;
        if (sy > 5 * this.gridWidth && dy < 7 * this.gridWidth) return true;

        let isPossibleSize = [
            { x: 1, y: 1 },
            { x: -1, y: 1 },
            { x: 1, y: -1 },
            { x: -1, y: -1 }
        ];

        for (let i = 0; i < isPossibleSize.length; i++) {
            let size = isPossibleSize[i];
            let x = sx + size.x * this.gridWidth;
            let y = sy + size.y * this.gridWidth;

            if (x >= 0 && x <= 8 * this.gridWidth && y >= 0 && y <= 9 * this.gridWidth && x == dx && y == dy) {
                return false;
            }
        }
        return true;
    }
    // 帥/将
    isForbidShuai(sx, sy, dx, dy, position) {
        if (sx != dx && sy != dy) return true;
        // 限定“将”的整个活动区域
        if (dx < 3 * this.gridWidth || dx > 5 * this.gridWidth) return true;
        if (sy < 4 * this.gridWidth && dy > 2 * this.gridWidth) return true;
        if (sy > 5 * this.gridWidth && dy < 7 * this.gridWidth) return true;

        return sx == dx ? Math.abs(sy - dy) != this.gridWidth : Math.abs(sx - dx) != this.gridWidth;
    }
    // 炮
    isForbidPao(sx, sy, dx, dy, position) {
        if (sx != dx && sy != dy) return true;

        let arrX = upSort([sx, dx]);
        let arrY = upSort([sy, dy]);

        if (sx == dx && position.x == sx && position.y >= arrY[0] && position.y <= arrY[1] && position.role) {
            this.isFirePao++;
        }
        if (sy == dy && position.y == sy && position.x >= arrX[0] && position.x <= arrX[1] && position.role) {
            this.isFirePao++;
        }

        // 如果是最后一个位置切isFirePao仍然为0，则为true
        let lastPosition = this.positions[this.positions.length - 1];

        if (position.x == lastPosition.x && position.y == lastPosition.y && this.isFirePao != 3 && this.isFirePao != 1) return true;

        return false;
    }
    // 兵/卒
    isForbidBing(sx, sy, dx, dy, position) {
        if (sx != dx && sy != dy) return true;

        let isForbid = false;
        let group = position.role.split("_")[0];

        if (group == "r") { // 红
            if (sy / this.gridWidth <= 4) {
                isForbid = sx != dx || (sx == dx && position.x == sx && dy != sy + this.gridWidth);
            } else {
                isForbid = sx == dx ?
                    position.x == sx && dy != sy + this.gridWidth :
                    position.y == sy && Math.abs(dx - sx) != this.gridWidth;
            }
        } else { // 黑
            if (sy / this.gridWidth >= 5) {
                isForbid = sx != dx || (sx == dx && position.x == sx && dy != sy - this.gridWidth);
            } else {
                isForbid = sx == dx ?
                    position.x == sx && dy != sy - this.gridWidth :
                    position.y == sy && Math.abs(dx - sx) != this.gridWidth;
            }
        }

        return isForbid;
    }

}

// 数组从小到大排序，返回从小到大排序的数组
function upSort(arr) {
    return arr.sort((a, b) => {
        return a > b;
    });
}