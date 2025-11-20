// Visualization 3 for top 10
(function () {
  var manager = {
    margin: { top: 40, right: 40, bottom: 40, left: 80 },
    offsetX: 80,
    offsetY: 40,
  };

  let data;
  let nameArr, yearArr, countryArr, ageArr, heightArr, weightArr, timeArr;

  new p5(function (p) {
    p.preload = function () {
      data = p.loadTable(
        "data/placeholder_table_viz_data.csv",
        "csv",
        "header"
      );
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
      let rowNames = [
        "Name",
        "Year",
        "Country",
        "Age",
        "Height",
        "Weight",
        "Time",
      ];

      nameArr = data.getColumn("Athlete");
      yearArr = data.getColumn("Year");
      countryArr = data.getColumn("Team");
      ageArr = data.getColumn("Age");
      heightArr = data.getColumn("Height");
      weightArr = data.getColumn("Weight");
      timeArr = data.getColumn("Results");

      let arrNames = [
        nameArr,
        yearArr,
        countryArr,
        ageArr,
        heightArr,
        weightArr,
        timeArr,
      ];

      let x_cell = 0;

      // first loop - horizontal cells
      for (i = 0; i < 7; i++) {
        let y_cell = 0;
        p.push();
        p.fill("#C80428");
        p.rect(x_cell, 0, 128, 50);
        p.fill("white");
        p.textSize(20);
        p.textAlign(p.CENTER, p.CENTER);
        p.text(rowNames[i], x_cell + 65, 30);
        p.pop();
        let selectedArr = arrNames[i];
        // second loop - fills in cells vertically
        for (j = 0; j < 10; j++) {
          p.rect(x_cell, y_cell + 50, 128, 50);
          p.push();
          p.fill("white");
          p.textSize(20);
          p.textAlign(p.CENTER, p.CENTER);
          p.text(selectedArr[j], x_cell + 70, y_cell + 75);
          p.pop();
          y_cell += 50;
        }
        x_cell += 128;
      }

      p.pop();
    }
  });
})();
