// sketch_global_trade_forecast.js
// Story: "Where Are We Headed? Global Trade Over Time"

(function () {
  var sketch = function (p) {
    var table;
    var years = [];
    var values = [];          // trillions USD
    var forecastYears = [];
    var forecastValues = [];  // trillions USD
    var growthSummary = "";

    p.preload = function () {
      table = p.loadTable("data/datasets/Improved_Dataset/trade_master_full.csv", "csv", "header");
    };

    p.setup = function () {
      // Responsive sizing to keep text from getting cut off.
      var w = Math.min(1200, Math.max(900, window.innerWidth - 60));
      var h = Math.min(900, Math.max(650, window.innerHeight - 80));
      var c = p.createCanvas(w, h);
      var mount = document.getElementById("forecast-canvas");
      if (mount) c.parent("forecast-canvas");
      p.textFont("sans-serif");
      processGlobalTrade();
      computeForecast();
      computeSummary();
    };

    function processGlobalTrade() {
      var seen = {};
      for (var r = 0; r < table.getRowCount(); r++) {
        var year = parseInt(table.getString(r, "year"), 10);
        var tradeVal = table.getNum(r, "global_total_trade");
        if (!year || isNaN(tradeVal)) continue;
        if (seen[year]) continue;
        seen[year] = tradeVal;
      }
      var sortedYears = Object.keys(seen)
        .map(function (y) { return parseInt(y, 10); })
        .sort(function (a, b) { return a - b; });

      years = [];
      values = [];
      for (var i = 0; i < sortedYears.length; i++) {
        var y = sortedYears[i];
        years.push(y);
        values.push(seen[y] / 1e12); // trillions USD
      }
    }

    function computeForecast() {
      var n = years.length;
      if (n < 2) return;

      var sumX = 0, sumY = 0, sumXY = 0, sumXX = 0;
      for (var i = 0; i < n; i++) {
        var x = years[i];
        var y = values[i];
        sumX += x;
        sumY += y;
        sumXY += x * y;
        sumXX += x * x;
      }

      var denom = n * sumXX - sumX * sumX;
      if (denom === 0) return;

      var slope = (n * sumXY - sumX * sumY) / denom;
      var intercept = (sumY - slope * sumX) / n;

      var lastYear = years[years.length - 1];
      var endYear = 2030;

      forecastYears = [];
      forecastValues = [];
      for (var y = lastYear + 1; y <= endYear; y++) {
        var pred = slope * y + intercept;
        forecastYears.push(y);
        forecastValues.push(pred);
      }
    }

    function computeSummary() {
      if (years.length === 0 || values.length === 0) {
        growthSummary = "";
        return;
      }
      var startYear = years[0];
      var endYear = years[years.length - 1];
      var startVal = values[0];
      var endVal = values[values.length - 1];
      if (startVal <= 0) {
        growthSummary = "";
        return;
      }
      var pct = ((endVal - startVal) / startVal) * 100;
      growthSummary =
        "From " + startYear + " to " + endYear +
        ", total global trade grew about " + pct.toFixed(0) + "%.";
    }

    p.draw = function () {
      p.background(250);

      var marginLeft = 80;
      var marginRight = 40;
      var headerTop = 30;
      var headerGap = 80;  // vertical space reserved for title + subtitle
      var marginTop = headerTop + headerGap;
      var marginBottom = 80;

      var chartWidth = p.width - marginLeft - marginRight;
      var chartHeight = p.height - marginTop - marginBottom;

      // --------- HEADER TEXT (above chart) ----------
      p.noStroke();
      p.fill(20);
      p.textAlign(p.LEFT, p.TOP);
      p.textSize(20);
      p.text("Global Trade Over Time", marginLeft, headerTop);

      p.textSize(12);
      p.fill(60);
      var subtitle = "Solid line shows observed trade (imports + exports) in trillions of USD; the dashed line extends a simple linear forecast.";
      p.text(subtitle, marginLeft, headerTop + 26, chartWidth, 40);

      if (growthSummary) {
        p.text(growthSummary, marginLeft, headerTop + 50, chartWidth, 40);
      }

      if (years.length === 0) {
        p.fill(0);
        p.textSize(16);
        p.text("No global trade data found.", marginLeft, marginTop + 40);
        return;
      }

      // --------- SCALE + DATA ----------
      var allYears = years.concat(forecastYears);
      var minYear = Math.min.apply(null, allYears);
      var maxYear = Math.max.apply(null, allYears);

      var allVals = values.concat(forecastValues);
      var minVal = 0;
      var maxVal = Math.max.apply(null, allVals) * 1.15;

      // Forecast region shading
      if (forecastYears.length > 0) {
        var lastObservedYear = years[years.length - 1];
        var fxStart = p.map(lastObservedYear + 0.01, minYear, maxYear, marginLeft, marginLeft + chartWidth);
        var fxEnd = marginLeft + chartWidth;
        p.noStroke();
        p.fill(235, 241, 255);
        p.rect(fxStart, marginTop, fxEnd - fxStart, chartHeight);
      }

      // Chart frame
      p.noFill();
      p.stroke(0);
      p.strokeWeight(1);
      p.rect(marginLeft, marginTop, chartWidth, chartHeight);

      // Y grid + labels
      p.textSize(11);
      for (var t = 0; t <= 5; t++) {
        var val = p.map(t, 0, 5, minVal, maxVal);
        var yPos = p.map(val, minVal, maxVal, marginTop + chartHeight, marginTop);
        p.stroke(230);
        p.line(marginLeft, yPos, marginLeft + chartWidth, yPos);
        p.noStroke();
        p.fill(70);
        p.textAlign(p.RIGHT, p.CENTER);
        p.text(val.toFixed(1), marginLeft - 8, yPos);
      }

      // X ticks
      p.stroke(210);
      p.fill(70);
      p.textAlign(p.CENTER, p.TOP);
      for (var xi = 0; xi < years.length; xi++) {
        var yVal = years[xi];
        var xTick = p.map(yVal, minYear, maxYear, marginLeft, marginLeft + chartWidth);
        p.line(xTick, marginTop + chartHeight, xTick, marginTop + chartHeight + 4);
        if (xi % 2 === 0) {
          p.noStroke();
          p.text(yVal, xTick, marginTop + chartHeight + 6);
          p.stroke(210);
        }
      }

      // Axis labels
      p.noStroke();
      p.fill(0);
      p.textSize(12);
      p.textAlign(p.CENTER, p.CENTER);
      p.text("Year", marginLeft + chartWidth / 2, p.height - marginBottom + 32);

      p.push();
      p.translate(35, marginTop + chartHeight / 2);
      p.rotate(-p.HALF_PI);
      p.text("Total global trade (trillions of USD)", 0, 0);
      p.pop();
      p.textAlign(p.LEFT, p.BASELINE);

      // Actual line
      p.stroke(33, 114, 179);
      p.strokeWeight(3);
      p.noFill();
      p.beginShape();
      for (var i = 0; i < years.length; i++) {
        var xPos = p.map(years[i], minYear, maxYear, marginLeft, marginLeft + chartWidth);
        var yVal2 = values[i];
        var yPos = p.map(yVal2, minVal, maxVal, marginTop + chartHeight, marginTop);
        p.vertex(xPos, yPos);
      }
      p.endShape();

      // Endpoint label
      var lastIndex = years.length - 1;
      var lx = p.map(years[lastIndex], minYear, maxYear, marginLeft, marginLeft + chartWidth);
      var ly = p.map(values[lastIndex], minVal, maxVal, marginTop + chartHeight, marginTop);
      p.noStroke();
      p.fill(33, 114, 179);
      p.circle(lx, ly, 8);
      p.fill(30);
      p.textSize(11);
      p.textAlign(p.LEFT, p.BOTTOM);
      p.text(years[lastIndex] + ": " + values[lastIndex].toFixed(2) + "T USD", lx + 8, ly - 4);

      // Forecast line
      if (forecastYears.length > 0) {
        p.stroke(33, 114, 179);
        p.strokeWeight(2);
        p.drawingContext.setLineDash([6, 5]);
        p.noFill();
        p.beginShape();
        for (var fi = 0; fi < forecastYears.length; fi++) {
          var fx = p.map(forecastYears[fi], minYear, maxYear, marginLeft, marginLeft + chartWidth);
          var fv = forecastValues[fi];
          var fy = p.map(fv, minVal, maxVal, marginTop + chartHeight, marginTop);
          p.vertex(fx, fy);
        }
        p.endShape();
        p.drawingContext.setLineDash([]);
      }

      drawLegend(marginLeft + chartWidth - 210, marginTop - 55);
    };

    function drawLegend(x, y) {
      p.textSize(12);
      p.noStroke();
      p.fill(0);
      p.textAlign(p.LEFT, p.TOP);
      p.text("Legend", x, y);

      var y1 = y + 18;
      p.stroke(33, 114, 179);
      p.strokeWeight(3);
      p.line(x, y1, x + 40, y1);
      p.noStroke();
      p.fill(40);
      p.text("Observed global trade", x + 50, y1 - 7);

      var y2 = y1 + 20;
      p.stroke(33, 114, 179);
      p.strokeWeight(2);
      p.drawingContext.setLineDash([6, 5]);
      p.line(x, y2, x + 40, y2);
      p.drawingContext.setLineDash([]);
      p.noStroke();
      p.fill(40);
      p.text("Linear forecast", x + 50, y2 - 7);

      p.textAlign(p.LEFT, p.BASELINE);
    }
  };

  new p5(sketch);
})();
