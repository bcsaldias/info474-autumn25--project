// Visualization 1 for gender performance gap
(function () {
    var manager = {
      margin: { top: 40, right: 40, bottom: 40, left: 80 },
      offsetX: 80,
      offsetY: 40,
      data: null
    };
  
    new p5(function (p) {
      p.setup = function () {
        var canvas = p.createCanvas(900, 400);
        canvas.parent('viz_gap');
        p.textFont('Inria Serif');
      };
  
      p.draw = function () {
        p.clear();
        p.background(0);
  
        drawGap(p);
      };
  
      function drawGap(p) {
        
        p.push();
        p.translate(manager.offsetX, manager.offsetY);
  
        p.stroke(255);
        p.line(0, 300, 700, 300);
  
        p.fill(255);
        p.noStroke();
        p.textSize(24);
        p.text('Year', 0, 0);
        p.text('Time (s)', 400, 320);
  
        // etc...
        p.pop();
      }
  
    });
  })();