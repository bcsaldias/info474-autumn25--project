// Visualization 2 for women participation evolution
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
        canvas.parent('viz_evolution');
        p.textFont('Inria Serif');
      };
  
      p.draw = function () {
        p.clear();
        p.background(0);
  
        drawEvolution(p);
      };
  
      function drawEvolution(p) {
        
        p.push();
        p.translate(manager.offsetX, manager.offsetY);
  
        p.stroke(255);  
        p.fill(255);
        p.noStroke();
        p.textSize(24);
        
  
        // etc...
        p.pop();
      }
  
    });
  })();