// Viz for game 1 guess winning pattern interaction
(function () {
    var manager = {
      margin: { top: 40, right: 40, bottom: 40, left: 80 },
      offsetX: 180,
      offsetY: 40,
    };
  
    var actualData = {
      age: { median: 25, min: 21, max: 29, range: [15, 40] },
      height: { median: 175, min: 170, max: 180, range: [150, 200] },
      weight: { median: 70, min: 65, max: 75, range: [45, 100] }
    };

    var showAnswer = false;
    var score = null;

    let circles = [
      { x: 200, y: 50, dragging: false, lineY: 50, label: 'Age', actual: actualData.age, unit: '' },
      { x: 400, y: 150, dragging: false, lineY: 150, label: 'Height', actual: actualData.height, unit: 'cm' },
      { x: 300, y: 250, dragging: false, lineY: 250, label: 'Weight', actual: actualData.weight, unit: 'kg' }
    ];

    new p5(function (p) {
      p.setup = function () {
        var canvas = p.createCanvas(1000, 450);
        canvas.parent('viz_game1');
        p.textFont('Inria Serif');
      };
  
      p.draw = function () {
        p.clear();
        p.background(0);
  
        p.fill(255, 204, 0);
        p.textSize(24);
        p.text("Drag sliders to guess the Olympic medalist profile", 320, 55);
  
        drawSliders(p);
        drawButton(p);
      };
  
      function drawSliders(p) {
        p.push();
        p.translate(manager.offsetX, 100);

        var lineWidth = 600;
  
        circles.forEach((circle, idx) => {
          // Draw line track
          p.stroke(60);
          p.strokeWeight(8);
          p.line(0, circle.lineY, lineWidth, circle.lineY);
          
          // Draw answer range if showing
          if (showAnswer) {
            var rangeStart = p.map(circle.actual.min, circle.actual.range[0], circle.actual.range[1], 0, lineWidth);
            var rangeEnd = p.map(circle.actual.max, circle.actual.range[0], circle.actual.range[1], 0, lineWidth);
            
            // Green zone
            p.stroke(50, 200, 100, 150);
            p.strokeWeight(16);
            p.line(rangeStart, circle.lineY, rangeEnd, circle.lineY);
            
            // Median marker
            var medianX = p.map(circle.actual.median, circle.actual.range[0], circle.actual.range[1], 0, lineWidth);
            p.stroke(50, 255, 100);
            p.strokeWeight(3);
            p.line(medianX, circle.lineY - 15, medianX, circle.lineY + 15);
          }
          
          // Draw handle
          p.noStroke();
          var isHovered = p.dist(p.mouseX - manager.offsetX, p.mouseY - 100, circle.x, circle.lineY) < 15;
          
          if (circle.dragging || isHovered) {
            p.fill(255, 220, 50);
            p.circle(circle.x, circle.lineY, 22);
          }
          
          p.fill(255, 204, 0);
          p.circle(circle.x, circle.lineY, 18);
          
          // Inner dot
          p.fill(40);
          p.circle(circle.x, circle.lineY, 8);
        });
  
        // Labels and values
        p.noStroke();
        p.fill(255);
        p.textSize(18);
        p.textAlign(p.RIGHT, p.CENTER);
        
        circles.forEach((circle) => {
          p.text(circle.label, -20, circle.lineY);
        });
  
        // Current values
        p.textAlign(p.LEFT, p.CENTER);
        circles.forEach((circle) => {
          var value = Math.round(p.map(circle.x, 0, 600, circle.actual.range[0], circle.actual.range[1]));
          p.fill(255, 204, 0);
          p.textSize(20);
          p.text(value + circle.unit, 620, circle.lineY);
        });

        // Range labels
        p.fill(150);
        p.textSize(12);
        p.textAlign(p.CENTER, p.TOP);
        circles.forEach((circle) => {
          p.text(circle.actual.range[0] + circle.unit, 0, circle.lineY + 15);
          p.text(circle.actual.range[1] + circle.unit, 600, circle.lineY + 15);
        });

        // Answer feedback
        if (showAnswer) {
          p.textAlign(p.LEFT, p.TOP);
          p.textSize(14);
          
          circles.forEach((circle) => {
            var value = Math.round(p.map(circle.x, 0, 600, circle.actual.range[0], circle.actual.range[1]));
            var isCorrect = value >= circle.actual.min && value <= circle.actual.max;
            
            if (isCorrect) {
              p.fill(50, 255, 100);
              p.text('Correct!', 0, circle.lineY + 30);
            } else {
              var diff = Math.abs(value - circle.actual.median);
              var range = circle.actual.max - circle.actual.min;
              if (diff <= range * 1.5) {
                p.fill(255, 200, 50);
              } else {
                p.fill(255, 100, 100);
              }
              p.text('Actual: ' + circle.actual.min + '-' + circle.actual.max + circle.unit, 0, circle.lineY + 30);
            }
          });
        }
  
        p.pop();
      }

      function drawButton(p) {
        var btnX = 400;
        var btnY = 380;
        var btnW = 200;
        var btnH = 50;
        
        var btnHovered = p.mouseX > btnX && p.mouseX < btnX + btnW && 
                         p.mouseY > btnY && p.mouseY < btnY + btnH;

        // Button
        p.noStroke();
        if (btnHovered) {
          p.fill(100, 180, 100);
        } else {
          p.fill(80, 150, 100);
        }
        p.rect(btnX, btnY, btnW, btnH, 8);

        // Button text
        p.fill(255);
        p.textSize(18);
        p.textAlign(p.CENTER, p.CENTER);
        p.text(showAnswer ? 'Try Again' : 'Check Answer', btnX + btnW / 2, btnY + btnH / 2);
      }

      p.mousePressed = function () {
        // Check sliders
        circles.forEach((circle) => {
            let d = p.dist(p.mouseX - manager.offsetX, p.mouseY - 100, circle.x, circle.lineY);
            if (d < 18) {
                circle.dragging = true;
            }
        });

        // Check button
        var btnX = 400;
        var btnY = 380;
        var btnW = 200;
        var btnH = 50;
        
        if (p.mouseX > btnX && p.mouseX < btnX + btnW && 
            p.mouseY > btnY && p.mouseY < btnY + btnH) {
          if (showAnswer) {
            showAnswer = false;
          } else {
            showAnswer = true;
          }
        }
      };

      p.mouseDragged = function () {
          circles.forEach((circle) => {
              if (circle.dragging) {
                  circle.x = p.constrain(p.mouseX - manager.offsetX, 0, 600);
              }
          });
      };

      p.mouseReleased = function () {
          circles.forEach((circle) => {
              circle.dragging = false;
          });
      };
    });
  })();