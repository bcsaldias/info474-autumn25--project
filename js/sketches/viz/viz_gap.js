// Visualization 1 for gender performance gap
(function () {
  var manager = {
    margin: { top: 40, right: 40, bottom: 40, left: 80 },
    offsetX: 80,
    offsetY: 40,
    data: null,
  };

  let men_data, women_data, menYearArr, menTimeArr, womenYearArr, womenTimeArr;
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
      menYearArr = men_data.getColumn("Year");
      menTimeArr = men_data.getColumn("Results");
      womenYearArr = women_data.getColumn("Year");
      womenTimeArr = women_data.getColumn("Results");

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
      p.line(100, 350, 770, 350);
      p.line(100, 50, 100, 350);

      // text
      p.textSize(20);
      p.text("Year", 45, 45);
      p.text("Time (s)", 780, 380);
      p.text("40s", 80, 380);

      // axis ticks
      for (i = 1; i < 45; i++) {
        p.line(100 + i * pix_per_sec, 345, 100 + i * pix_per_sec, 355);
      }

      p.pop();

      plotData();
    };

    function plotData() {
      year_px = 100;
      time_px_baseline = 100;
      for (i = 0; i < menYearArr.length; i++) {
        console.log(menYearArr[i]);

        // year labels
        p.push();
        p.fill("#C80428");
        p.textSize(20);
        p.text(menYearArr[i], 50, year_px);
        p.pop();

        // data plotting

        let men_time_loc =
          time_px_baseline + pix_per_sec * (menTimeArr[i] - 40);
        let women_time_loc =
          time_px_baseline + pix_per_sec * (womenTimeArr[i] - 40);

        p.push();
        p.stroke(255);
        p.line(men_time_loc, year_px - 7, women_time_loc, year_px - 7);
        p.pop();

        p.push();
        p.ellipse(men_time_loc, year_px - 7, 10, 10);
        p.fill("#0281C8");
        p.textSize(16);
        p.text(menTimeArr[i], men_time_loc - 15, year_px + 14);
        p.pop();

        p.push();
        p.ellipse(women_time_loc, year_px - 7, 10, 10);
        p.fill("#FCB131");
        p.textSize(16);
        p.text(womenTimeArr[i], women_time_loc - 15, year_px + 14);
        p.pop();

        // set up for next loop
        year_px += 40;
      }
    }
    // 1912, 1932, 1952, 1972, 1992, 2012
    // 1916, 1944 olympics canclled bc of ww1
  });
})();
