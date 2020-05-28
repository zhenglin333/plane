// 元素
var container = document.getElementById('game');
var canvas = document.getElementById('canvas');
var context = canvas.getContext('2d');

//记录分数
var count = 0;
var score = document.createElement('div');
score.className = 's';
score.style.fontSize = '18px';
score.style.position = 'absolute';
score.style.left = '20px';
score.style.top = '10px';
score.innerHTML = '分数：' + count;
var div = document.getElementById('game');
div.appendChild(score);
var canvasHeight = canvas.clientHeight;
var canvasWidth = canvas.clientWidth;
var config = {
  level: 1, // 游戏默认等级
  totalLevel: 6, // 总共6关
  numPerLine: 6, // 游戏默认每行多少个怪兽
  canvasPadding: 30, // 默认画布的间隔
  bulletSize: 10, // 默认子弹长度
  bulletSpeed: 10, // 默认子弹的移动速度
  enemySpeed: 2, // 默认敌人移动距离
  enemySize: 50, // 默认敌人的尺寸
  enemyGap: 10, // 默认敌人之间的间距
  enemyIcon: './img/enemy.png', // 怪兽的图像
  enemyBoomIcon: './img/boom.png', // 怪兽死亡的图像
  enemyDirection: 'right', // 默认敌人一开始往右移动
  planeSpeed: 5, // 默认飞机每一步移动的距离
  planeSize: {
    width: 60,
    height: 100
  }, // 默认飞机的尺寸,
  planeIcon: './img/plane.png', //飞机的图像
};
var monster_direct = {
  LEFT: 'left',
  RIGHT: 'right',
}
var plane_move = {
  pressedLeft: false,
  pressedRight: false,
  pressedSpace: false,
}

var ENEMY_STATUS = {
  ALIVE: 'alive',
  BOOMING: 'booming',
  DEAD: 'dead',
}

/**
 * 整个游戏对象
 */
var GAME = {
  /**
   * 初始化函数,这个函数只执行一次
   * @param  {object} opts
   * @return {[type]}      [description]
   */
  init: function(opt) {
    this.status = 'start';
    that = this;
    //配置的初始化
    var opts = Object.assign({}, config, opt);
    var imgUrls = [
      opts.enemyIcon,
      opts.enemyBoomIcon,
      opts.planeIcon,
    ];
    resourceOnload(imgUrls, (imgUrls) => {
      opts.enemyIcon = imgUrls[0];
      opts.enemyBoomIcon = imgUrls[1];
      opts.planeIcon = imgUrls[2];
    });
    this.opts = opts;
    this.bindEvent();
  },
  bindEvent: function() {
    var playBtn = document.querySelector('.js-play');
    var that = this;
    // 开始游戏按钮绑定
    playBtn.onclick = function() {
      that.play();
    };
  },
  /**
   * 更新游戏状态，分别有以下几种状态：
   * start  游戏前
   * playing 游戏中
   * failed 游戏失败
   * success 游戏成功
   * all-success 游戏通过
   * stop 游戏暂停（可选）
   */
  setStatus: function(status) {
    this.status = status;
    container.setAttribute("data-status", this.status);
  },

  play: function() {
    this.setStatus('playing');

    var {
      opts
    } = this;
    var {
      enemySpeed,
      enemySize,
      enemyGap,
      enemyIcon,
      enemyBoomIcon,
      enemyDirection,
      level,
      totalLevel,
      numPerLine,
      canvasPadding,
      enemyDirection,
      planeIcon,
      planeSize,
      planeSpeed,
    } = opts;
    //设置动画所需元素
    this.plane = new Plane({
      icon: planeIcon,
      size: planeSize,
      speed: planeSpeed,
      x: (canvasWidth - planeSize.width) / 2,
      y: canvasHeight - (2 * canvasPadding + planeSize.height / 2),
    });
    this.monsters = [];
    for (let i = 0; i < level; i++) {
      for (let j = 0; j < numPerLine; j++) {
        this.monsters.push(new Monsters({
          ctx: context,
          x: j * (enemySize + enemyGap) + canvasPadding,
          y: i * enemySize + canvasPadding,
          speed: enemySpeed,
          icon: enemyIcon,
          size: enemySize,
          iconBoomed: enemyBoomIcon,
          direction: enemyDirection,
        }));
      }
    };
    //开始监听用户输入

    this.update();

  },
  update: function() {
    //清空画布
    this.clearPic();
    //更新游戏数据
    this.updateMonsters();
    this.beginListenUserInput();
    var len = this.monsters.length - 1;
    //判断游戏结束条件
    if (!this.monsters.length) {
      this.success();
    } else if (this.monsters[len].y > this.plane.y - this.plane.size.height / 2) {
      this.failed();
    } else {
      //根据游戏数据绘制游戏画面
      this.draw();

      setTimeout(() => {
        this.update();
      }, 500 / 30);
    }
  },
  draw: function() {
    this.plane.draw();

    this.monsters.forEach((monster) => {
      monster.draw();
    });
  },
  beginListenUserInput: function() {
    //监听键盘
    var that = this;
    document.onkeydown = function(e) {
      var key = e.keyCode || e.whick || e.charCode;
      switch (key) {
        case 37:
          //飞机左移
          if (that.plane.x < 0) {
            that.plane.x = 0;
          }
          plane_move.pressedLeft = true;
          plane_move.pressedRight = false;
          plane_move.pressedSpace = false;
          break;
        case 39:
          //飞机右移
          if (that.plane.x > 640) {
            that.plane.x = 640;
          }
          plane_move.pressedRight = true;
          plane_move.pressedLeft = false;
          plane_move.pressedSpace = false;
          break;
        case 32:
          //绘制子弹
          // plane_move.pressedRight = false;
          // plane_move.pressedLeft = false;
          plane_move.pressedSpace = true;
          break;
      };
    };
    document.onkeyup = function(e) {
      var key = e.keyCode || e.whick || e.charCode;
      switch (key) {
        case 37:
          //飞机左移
          if (that.plane.x < 0) {
            that.plane.x = 0;
          }
          plane_move.pressedLeft = false;
          plane_move.pressedRight = false;
          plane_move.pressedSpace = false;
          break;
        case 39:
          //飞机右移
          if (that.plane.x > 640) {
            that.plane.x = 640;
          }
          plane_move.pressedRight = false;
          plane_move.pressedLeft = false;
          plane_move.pressedSpace = false;
          break;
        case 32:
          //绘制子弹
          // plane_move.pressedRight = false;
          // plane_move.pressedLeft = false;
          plane_move.pressedSpace = false;
          break;
      };
    };
      that.updatePlane();

  },
  clearPic: function() {
    context.clearRect(0, 0, canvas.width, canvas.height);
  },
  updateMonsters: function() {
    var {
      opts
    } = this;
    var {
      canvasPadding,
      enemySize,
      enemyDirection,
      count
    } = opts;
    var {
      minX,
      maxX
    } = getcoordinates(this.monsters);
    var isBoundary = false;
    if (minX < canvasPadding || maxX > canvasWidth - canvasPadding - enemySize) {
      opts.enemyDirection = enemyDirection === monster_direct.RIGHT ? monster_direct.LEFT : monster_direct.RIGHT;
      isBoundary = true;
    }
    this.monsters = this.monsters.map((monster) => {

      if (isBoundary) {
        monster.down();
      }
      monster.movement(opts.enemyDirection);
      //根据状态执行下一帧动作
      switch (monster.status) {
        case ENEMY_STATUS.ALIVE:
          if (this.plane.hasHit(monster)) {
            monster.booming();
          }
          break;
        case ENEMY_STATUS.BOOMING:
          monster.booming();
          break;
        case ENEMY_STATUS.DEAD:
          monster.__readyToDelete = true;

      }
      return monster;
    }).filter((monster) => {
      return !monster.__readyToDelete;
    })

  },
  updatePlane: function() {
    //this.beginListenUserInput();
    if (plane_move.pressedLeft && !plane_move.pressedRight) {
      this.plane.planemove(monster_direct.LEFT);
    }
    if (!plane_move.pressedLeft && plane_move.pressedRight) {
      this.plane.planemove(monster_direct.RIGHT);
    }
    if (plane_move.pressedSpace == true) {
      this.plane.shoot();
    }
  },
  failed: function() {
    this.setStatus('failed');
    var scoreFinal = document.querySelector('.score');
    scoreFinal.innerHTML = count;
    var jsReplay = document.querySelector('.js-replay');
    jsReplay.onclick = function(){
    that.setStatus('start');
    count = 0;
    score.innerHTML = '分数：' + count;
    };
  },
  success: function() {
    this.setStatus('success');
    config.level++;
    this.init();
    var jsNext = document.querySelector('.js-next');
    jsNext.onclick = function(){
      that.setStatus('start');
      count = 0;
      score.innerHTML = '分数：' + count;
    };

    var gameLevel = document.querySelector('.game-level');
    gameLevel.innerHTML ='当前Level:' + config.level;
  },
  allsuccess: function() {
    this.setStatus('all-success');
  }
};

//
class Element {
  constructor(opts = {}) {
    //位置
    this.x = opts.x;
    this.y = opts.y;
    //速度
    this.speed = opts.speed;
    //方向
    this.direction = opts.direction;
    //大小
    this.size = opts.size;
    this.ctx = opts.ctx;
    this.count = opts.count;
  }
  move(dataX, dataY) {
    this.x += dataX;
    this.y += dataY;
    return this;
  }
  draw() {
    //throw new Error('You should implement draw function');
  }
}


//飞机实例
class Plane extends Element {
  //子弹数组
  //移动方法
  constructor(opts) {
    super(opts);
    this.icon = opts.icon;
    this.bullets = [];
    this.bulletSize = opts.bulletSize;
    this.bulletSpeed = opts.bulletSpeed;
    this.overheated = false;
  }
  shoot() {
    if (this.overheated) {
      return;
    }
    this.overheated = true;
    this.bullets.push(new Bullet({
      //获取飞机当前位置
      //默认子弹的速度
      x: this.x + this.size.width / 2,
      y: this.y,
      size: this.bulletSize,
      speed: this.bulletSpeed,
    }))

    setTimeout(() => {
      this.overheated = false;
    }, 100)
  }
  hasHit(monster) {
    const idx = this.bullets.findIndex((bullet) => {
      return bullet.hasHit(monster);
    });
    if (idx > -1) {
      this.bullets.splice(idx, 1);
      return true;
    }

    return false;
  }
  planemove(direct) {
    var dataX = direct === monster_direct.RIGHT ? this.speed : -this.speed;
    return this.move(dataX, 0);
  }
  draw() {
    //绘制飞机的位置
    //绘制子弹的位置
    context.drawImage(this.icon, this.x, this.y, this.size.width, this.size.height);
    this.bullets.forEach((bullet) => {
      bullet.fly();
      bullet.draw();
    });
  }

}



// 怪兽实例
class Monsters extends Element {
  constructor(opts) {
    super(opts);
    this.icon = opts.icon;
    this.iconBoomed = opts.iconBoomed;
    this.speed = opts.speed;
    this.status = ENEMY_STATUS.ALIVE;

  }
  movement(direct = monster_direct.RIGHT) {
    var dataX = direct === monster_direct.RIGHT ? this.speed : -this.speed;
    return this.move(dataX, 0);
  }
  booming() {
    // this.g = document.getElementsByClassName('s');
    this.boomCount = this.boomCount ? this.boomCount + 1 : 1;
    this.status = ENEMY_STATUS.BOOMING;
    if (this.boomCount > 4) {
      this.status = ENEMY_STATUS.DEAD;
      count += 1;
      score.innerHTML = '分数：' + count;
    }
  }
  down() {
    return this.move(0, this.size);
  }
  draw() {
    var icon = this.status === ENEMY_STATUS.ALIVE ? this.icon : this.iconBoomed;
    this.ctx.drawImage(icon, this.x, this.y, this.size, this.size);
  }
}


//子弹实例
class Bullet extends Element {
  constructor(opts) {
    super(opts);
  }
  fly() {
    this.move(0, -10);
  }
  hasHit(monster) {
    return this.x > monster.x && this.x < monster.x + monster.size &&
      this.y > monster.y && this.y < monster.y + monster.size;
  }
  draw() {
    //根据子弹的位置绘制子弹
    const {
      ctx
    } = this;
    context.beginPath(); //开始路径
    context.moveTo(this.x, this.y); //设置路径原点
    context.lineTo(this.x, this.y - 10); //设置路径到达的点
    context.strokeStyle = 'white';
    context.closePath();
    context.stroke(); //输出路径的轮廓
  }
}


//资源加载
function resourceOnload(resources, callback) {
  var total = resources.length;
  var finish = 0;
  var images = [];
  for (var i = 0; i < total; i++) {
    images[i] = new Image();
    images[i].src = resources[i];
    //图片加载完成
    images[i].onload = function() {
      //加载完成
      finish++;
      if (finish == total) {
        callback(images);
      }
    };
  }
}
//获取目标对象实例中最小的横坐标和最大的横坐标
function getcoordinates(arrs) {
  var minX, maxX;
  arrs.forEach(function(item) {
    if (!minX && !maxX) {
      minX = item.x;
      maxX = item.x;
    } else {
      if (item.x < minX) {
        minX = item.x;
      }
      if (item.x > maxX) {
        maxX = item.x;
      }
    }
  });
  return {
    minX: minX,
    maxX: maxX,
  };
}
// 初始化
GAME.init();