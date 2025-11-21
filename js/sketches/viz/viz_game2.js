// Viz for game 1 guess winning pattern interaction
(function () {
    var manager = {
      margin: { top: 40, right: 40, bottom: 40, left: 80 },
      offsetX: 60,
      offsetY: 60,
      data: null
    };
  
    new p5(function (p) {
      p.setup = function () {
        var canvas = p.createCanvas(900, 400);
        canvas.parent('viz_game2');
        p.textFont('Inria Serif');
      };
  
      p.draw = function () {
        p.clear();
        p.background(0);
  
        p.fill(255);
        p.textSize(24);
  
        drawAgeHeightRanges(p);
      };
  
      // function drawAgeHeightRanges(p) {
      //   p.push();
      //   p.translate(manager.offsetX, 100);
  
      //   p.stroke(255);
      //   p.line(0, 50, 600, 50);
      //   p.line(0, 150, 600, 150);
  
      //   p.noStroke();
      //   p.fill(255, 204, 0);
      //   p.circle(200, 50, 15);
      //   p.circle(400, 150, 15);
  
      //   p.fill(255);
      //   p.textSize(18);
      //   p.text("Age", -40, 55);
      //   p.text("Height", -40, 155);
  
      //   p.text("20–30", 640, 55);
      //   p.text("180–190cm", 640, 155);
  
      //   p.pop();
      // }
  
    });
  })();