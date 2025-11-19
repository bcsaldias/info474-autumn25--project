// Visualization 1 for gender performance gap
(function () {
  var manager = {
    margin: { top: 40, right: 40, bottom: 40, left: 80 },
    offsetX: 80,
    offsetY: 40,
    data: null,
  };

  let men_data;
  let women_data;
  let pix_per_sec = 15;

  new p5(function (p) {
    p.preload = function () {
      men_data = p.loadTable("../data/gap_viz_data_men.csv", "csv", "header");
      women_data = p.loadTable(
        "../data/gap_viz_data_women.csv",
        "csv",
        "header"
      );
    };

    p.setup = function () {
      var canvas = p.createCanvas(900, 400);
      canvas.parent("viz_gap");
      p.textFont("Inria Serif");
    };

    p.draw = function () {
      // background
      p.push();
      p.clear();
      p.background(0);
      p.pop();

      // axes
      p.push();
      p.fill(255);
      p.stroke(255);
      p.line(100, 350, 750, 350);
      p.line(100, 50, 100, 350);

      // text
      p.textSize(20);
      p.text("Year", 45, 45);
      p.text("Time (s)", 780, 380);
      p.pop();

      // p.plotData();
    };

    function plotData(p) {}
  });
})();
