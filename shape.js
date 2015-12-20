'use strict';

function Shape() {
    this.canvas = document.createElement('canvas');
    this.context = this.canvas.getContext('2d');
    this.fontSize = 100;
    this.dotGap = 15;
}

Shape.radius = 7;

Shape.point = function point(x, y)
{
    this.x = x;
    this.y = y;
    this.targetX = x;
    this.targetY = y;
    this.currentX = x;
    this.currentY = y;
    this.state = 0;
    this.r = Shape.radius;
    // -1 : dispearing
    // 0  : keeping
    // 1  : showing up
};

Shape.point.prototype.r = 7;

Shape.point.prototype.render = function (context) {
    context.beginPath();
    context.arc( this.currentX, this.currentY, this.r, 0, Math.PI * 2);
    context.closePath();
    context.fill();
};

Shape.point.prototype.update = function (ratio) {
    this.currentX = ratio * (this.targetX - this.x) + this.x;
    this.currentY = ratio * (this.targetY - this.y) + this.y;
    if (this.state === 0) {

    } else if (this.state === 1) {
        this.r = ratio * Shape.radius;
    } else {
        this.r = (1 - ratio) * Shape.radius;
    }
};

Shape.point.prototype.shake = function () {
    this.currentX = this.targetX + Math.random() * 2;
    this.currentY = this.targetY + Math.random() * 2;
};

Shape.prototype.resize = function () {
    var canvas = this.canvas;
    var context = this.context;
    canvas.height = window.innerHeight;
    canvas.width = window.innerWidth;
    canvas.style.height = window.innerHeight;
    canvas.style.width = window.innerWidth;
    context.fillStyle = 'red';
    context.textBaseline = 'middle';
    context.textAlign = 'center';
};

Shape.prototype.genDotMap = function () {
    var canvas = this.canvas;
    var context = this.context;
    var data = context.getImageData(0, 0, canvas.width, canvas.height).data;
    var dotc = [];
    var dotGap = this.dotGap;
    for (var y = 0; y < canvas.height; y += dotGap) {
        for (var x = 0; x< canvas.width; x += dotGap) {
            if (data[y * canvas.width * 4 + x * 4] != 0) {
                dotc.push(new Shape.point(x, y));
            }
        }
    }
    return dotc;
};

Shape.prototype.text = function(str) {
    var context = this.context;
    var canvas = this.canvas;
    var fontSize = this.fontSize;
    context.font = 'bold 30px sans-serif';
    var size = Math.min(0.22 * fontSize / context.measureText(str).width * canvas.width, 0.6 * canvas.height);
    context.font = 'bold ' + Math.floor(size) + 'px sans-serif';
    console.log(size);
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.fillText(str, canvas.width / 2, canvas.height / 2);
};


Shape.Engine = function (canvas) {
    canvas.height = window.innerHeight;
    canvas.width = window.innerWidth;
    this.width = canvas.width;
    this.height = canvas.height;

    this.context = canvas.getContext("2d");
    this.context.fillStyle = 'white';
    this.shapeFactory = new Shape();
    this.points = [];
    this.shapeFactory.resize();
    
    window.addEventListener('resize', (e) => {
        canvas.height = window.innerHeight;
        canvas.width = window.innerWidth;
        this.width = canvas.width;
        this.height = canvas.height;
        this.context.fillStyle = 'white';
        this.shapeFactory.resize();
    });
};

Shape.Engine.prototype.checkLife = function () {
    this.points = this.points.filter(function(point) {
        if (point.state === -1) {
            return false;
        } else {
            point.x = point.targetX;
            point.y = point.targetY;
            point.state = 0;
            return true;
        }
    });
};

Shape.Engine.prototype.clear = function () {
    return this._toShape([]);
};

Shape.Engine.prototype.shake = function (time) {
    var promise = new Promise((resolve, reject) => {
        time = time || 1000;
        var context = this.context;
        var width  = this.width;
        var height = this.height;
        var engine = this;
        var points = this.points;

        var totalProgress = 0.0;
        var step = 25 / time;
        var timer = setInterval(function(){
            if (totalProgress >= 1.0) {
                clearInterval(timer);
                timer = null;
                totalProgress = 1.0;
            }
            context.clearRect(0, 0, width, height);
            points.forEach((point) => {
                point.shake();
                point.render(context);
            });
            if (timer === null) {
                engine.checkLife();
                resolve();
            } else {
                totalProgress += step;
                if (totalProgress > 1.0) {
                    totalProgress = 1.0;
                }
            }
        }, 50);
    });
    return promise;
};


Shape.Engine.prototype.genText = function (text) {
    this.shapeFactory.text(text);
    return this.shapeFactory.genDotMap();
};

Shape.Engine.prototype.toText = function (text) {
    var points = this.genText(text);
    return this._toShape(points);
};

Shape.Engine.prototype.shuffle = function () {
    var points = this.points;
    for (let i = points.length - 1; i > 0; i -= 1) {
        let j = Math.floor(Math.random() * (i + 1))
        let temp = points[i];
        points[i] = points[j];
        points[j] = temp;
    }
}

Shape.Engine.prototype._toShape = function (targets) {
    var promise = new Promise((resolve, reject) => {

        var context = this.context;
        var width  = this.width;
        var height = this.height;
        var engine = this;
        var points = this.points;

        var len = Math.min(targets.length, points.length);
        for (let i = 0; i < len; i++) {
            points[i].targetX = targets[i].x;
            points[i].targetY = targets[i].y;
        }

        if (points.length > targets.length) {
            for (let i = len; i < points.length; i++) {
                points[i].state = -1;
                points[i].targetX = Math.random() * width;
                points[i].targetY = Math.random() * height;
            }
        } else {
            console.log('from ', len);
            for (let i = len; i < targets.length; i++) {
                points.push(targets[i]);
                targets[i].x = Math.random() * width;
                targets[i].y = Math.random() * height;
                points[i].state = 1;
            }
        }

        var totalProgress = 0.0;
        var timer = setInterval(function(){
            if (totalProgress >= 1.0) {
                clearInterval(timer);
                timer = null;
                totalProgress = 1.0;
            }
            context.clearRect(0, 0, width, height);
//            var progress = totalProgress * totalProgress;
            var progress = (2 - totalProgress) * totalProgress;

            points.forEach((point) => {
                point.update(progress);
                point.render(context);
            });
            if (timer === null) {
                engine.checkLife();
                engine.shuffle();
                resolve();
            } else {
                totalProgress += 0.02;
                if (totalProgress > 1.0) {
                    totalProgress = 1.0;
                }
            }
        }, 17);
    });
    return promise;
}
