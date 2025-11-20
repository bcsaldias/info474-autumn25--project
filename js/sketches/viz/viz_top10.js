// Visualization 3 for top 10
(function () {
  var manager = {
    margin: { top: 40, right: 40, bottom: 40, left: 80 },
    offsetX: 80,
    offsetY: 40,
  };

  new p5(function (p) {
    p.preload = function () {
      // data = p.loadTable("../data/table_viz_data.csv", "csv", "header");
    };

    p.setup = function () {
      var canvas = p.createCanvas(900, 400);
      canvas.parent("viz_top10");
      p.textFont("Inria Serif");
    };

    p.draw = function () {
      // rows:
      // Name, Year, Country, Age, Weight, Height, Speed
      // canvas is 900 wide and 400 long
      // each cell is 128px wide and px long
      p.clear();
      p.background(0);

      drawTable(p);
    };

    function drawTable(p) {
      p.push();
      p.stroke(255);
      p.noFill();

      let x_cell = 0;
      for (i = 0; i < 7; i++) {
        let y_cell = 0;
        p.rect(x_cell, 0, 128, 50);
        for (j = 0; j < 10; j++) {
          p.rect(x_cell, y_cell + 50, 128, 50);
          y_cell += 50;
        }
        x_cell += 128;
      }

      p.pop();
    }
  });
})();
