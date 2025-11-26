// sketch_tariffs_consumers.js
// Instance-mode p5 version.
// Story: "How Tariffs Affect Consumers: Which Goods Are Most Exposed?"

(function () {
    var sketch = function (p) {
        var table;
        var usaData = {};
        var years = [];
        var groups = [];
        var tariffYears = [];
        var statusMessage = "";
        var storyHighlight = "";

        // Main consumer-facing categories — we’ll fall back to whatever exists if these aren't present.
        var targetGroups = [
            "electronics",
            "chemicals",
            "mineral_fuels",
            "manufactures",
            "vehicles",
            "metals",
            "textiles",
            "food_agriculture"
        ];

        p.preload = function () {
            table = p.loadTable("data/datasets/Improved_Dataset/trade_master_full.csv", "csv", "header");
        };

        p.setup = function () {
            // Compact canvas so the full chart fits without huge vertical whitespace.
            var w = Math.min(1000, Math.max(850, window.innerWidth - 80));
            var h = 550; // shorter height to avoid extra white space
            var c = p.createCanvas(w, h);
            var mount = document.getElementById("tariffs-canvas");
            if (mount) c.parent("tariffs-canvas");
            p.textFont("sans-serif");
            try {
                processData();
                computeStoryHighlight();
            } catch (err) {
                years = [];
                groups = [];
                statusMessage = "Something went wrong while processing data.";
            }
        };

        function processData() {
            if (!table || typeof table.getRowCount !== "function") {
                years = [];
                groups = [];
                statusMessage = "Failed to load data table.";
                return;
            }

            var yearSet = new Set();
            var groupSet = new Set();
            var tariffByYear = {};
            var foundUSA = false;

            for (var r = 0; r < table.getRowCount(); r++) {
                var isoRaw = table.getString(r, "country_iso");
                var iso = (isoRaw || "").trim().toUpperCase();
                if (iso !== "USA") continue;
                foundUSA = true;

                var year = parseInt(table.getString(r, "year"), 10);
                var groupRaw = table.getString(r, "commodity_group");
                var group = (groupRaw || "").trim().toLowerCase();
                var imp = parseFloat(table.getString(r, "import_value"));
                var tariffChange = parseFloat(table.getString(r, "tariff_change_value"));

                if (!year || isNaN(imp)) continue;
                if (targetGroups.indexOf(group) === -1) continue;

                yearSet.add(year);
                groupSet.add(group);

                if (!usaData[group]) usaData[group] = {};
                if (!usaData[group][year]) usaData[group][year] = 0;
                usaData[group][year] += imp;

                if (!tariffByYear[year]) tariffByYear[year] = [];
                if (!isNaN(tariffChange)) tariffByYear[year].push(tariffChange);
            }

            years = Array.from(yearSet).sort(function (a, b) { return a - b; });
            groups = targetGroups.filter(function (g) { return groupSet.has(g); });
            if (groups.length === 0 && groupSet.size > 0) {
                groups = Array.from(groupSet); // fallback: whatever we actually have
            }

            if (!foundUSA) {
                statusMessage = "No United States trade rows found in this dataset.";
            } else if (groups.length === 0) {
                statusMessage = "No matching consumer categories found for the US.";
            } else {
                statusMessage = "";
            }

            tariffYears = [];
            for (var i = 0; i < years.length; i++) {
                var y = years[i];
                var arr = tariffByYear[y] || [];
                if (arr.length === 0) continue;
                var avgChange = arr.reduce(function (a, b) { return a + b; }, 0) / arr.length;
                if (avgChange > 0) tariffYears.push(y);
            }

            normalizeGroupValues();
        }

        function normalizeGroupValues() {
            var maxVal = 0;
            for (var gi = 0; gi < groups.length; gi++) {
                var g = groups[gi];
                for (var yi = 0; yi < years.length; yi++) {
                    var y = years[yi];
                    var v = (usaData[g] && usaData[g][y]) ? usaData[g][y] : 0;
                    if (v > maxVal) maxVal = v;
                }
            }
            if (maxVal === 0) maxVal = 1;

            for (var gj = 0; gj < groups.length; gj++) {
                var gg = groups[gj];
                for (var yj = 0; yj < years.length; yj++) {
                    var yy = years[yj];
                    var val = (usaData[gg] && usaData[gg][yy]) ? usaData[gg][yy] : 0;
                    usaData[gg][yy] = val / maxVal;
                }
            }
        }

        function prettyName(group) {
            return group.split("_").map(function (w) {
                return w.charAt(0).toUpperCase() + w.slice(1);
            }).join(" ");
        }

        function computeStoryHighlight() {
            if (!years || years.length < 2 || !groups || groups.length === 0) {
                storyHighlight = "";
                return;
            }
            var startYear = years[0];
            var endYear = years[years.length - 1];

            var bestGroup = null;
            var bestChange = -Infinity;

            for (var gi = 0; gi < groups.length; gi++) {
                var g = groups[gi];
                var sVal = (usaData[g] && usaData[g][startYear]) ? usaData[g][startYear] : 0;
                var eVal = (usaData[g] && usaData[g][endYear]) ? usaData[g][endYear] : 0;
                var diff = eVal - sVal;
                if (diff > bestChange) {
                    bestChange = diff;
                    bestGroup = g;
                }
            }

            if (bestGroup === null || bestChange <= 0) {
                storyHighlight = "Consumer-facing imports have shifted over time, but not all categories respond the same way to tariffs.";
                return;
            }

            // Since values are normalized [0–1], we interpret change in relative exposure, not literal %.
            var descriptiveGroup = prettyName(bestGroup);
            storyHighlight =
                descriptiveGroup +
                " shows the largest increase in relative import exposure from " +
                startYear + " to " + endYear +
                ", suggesting tariffs and demand pressures fall especially hard on that category.";
        }

        p.draw = function () {
            p.background(250);

            if (!table) {
                p.fill(0);
                p.noStroke();
                p.textAlign(p.LEFT, p.TOP);
                p.textSize(16);
                p.text("Failed to load data table.", 20, 20);
                return;
            }
            if (!years || years.length === 0) {
                p.fill(0);
                p.noStroke();
                p.textAlign(p.LEFT, p.TOP);
                p.textSize(16);
                p.text(statusMessage || "No USA data found for the selected commodity groups.", 20, 20);
                return;
            }

            var marginLeft = 80;
            var marginRight = 210; // still room for legend, but slightly tighter
            var marginTop = 70;
            var marginBottom = 60;

            // Title + subtitle
            p.noStroke();
            p.fill(20);
            p.textAlign(p.LEFT, p.TOP);
            p.textSize(22);

            p.fill(60);


            var chartWidth = p.width - marginLeft - marginRight;
            var chartHeight = p.height - marginTop - marginBottom;

            // Under-title story highlight, closer to the top of the plot
            if (storyHighlight) {
                p.textSize(12);
                p.fill(40);
                p.text(storyHighlight, marginLeft, marginTop - 28, chartWidth - 40, 48);
            }

            // Plot frame
            p.noFill();
            p.stroke(0);
            p.strokeWeight(1);
            p.rect(marginLeft, marginTop, chartWidth, chartHeight);

            var xMin = years[0];
            var xMax = years[years.length - 1];
            if (!isFinite(xMin) || !isFinite(xMax)) {
                p.fill(0);
                p.noStroke();
                p.textSize(16);
                p.textAlign(p.LEFT, p.TOP);
                p.text("Year values are invalid (NaN).", 20, 20);
                return;
            }

            // Tariff year bands
            p.noStroke();
            p.fill(255, 235, 235, 180);
            for (var ti = 0; ti < tariffYears.length; ti++) {
                var ty = tariffYears[ti];
                var tx = p.map(ty - 0.5, xMin, xMax, marginLeft, marginLeft + chartWidth);
                var tx2 = p.map(ty + 0.5, xMin, xMax, marginLeft, marginLeft + chartWidth);
                p.rect(tx, marginTop, (tx2 - tx), chartHeight);
            }

            // Grid + Y labels
            p.textSize(11);
            p.textAlign(p.RIGHT, p.CENTER);
            for (var t = 0; t <= 4; t++) {
                var norm = t / 4;
                var yPos = p.map(norm, 0, 1, marginTop + chartHeight, marginTop);
                p.stroke(230);
                p.line(marginLeft, yPos, marginLeft + chartWidth, yPos);
                p.noStroke();
                p.fill(70);
                p.text(norm.toFixed(2), marginLeft - 8, yPos);
            }
            p.textAlign(p.LEFT, p.BASELINE);

            // X axis ticks + labels
            p.stroke(210);
            p.fill(70);
            p.textSize(11);
            p.textAlign(p.CENTER, p.TOP);
            var tickStep = Math.max(1, Math.floor(years.length / 8));
            for (var xi = 0; xi < years.length; xi += tickStep) {
                var yVal = years[xi];
                var xTick = p.map(yVal, xMin, xMax, marginLeft, marginLeft + chartWidth);
                p.line(xTick, marginTop + chartHeight, xTick, marginTop + chartHeight + 4);
                p.noStroke();
                p.text(yVal, xTick, marginTop + chartHeight + 6);
                p.stroke(210);
            }
            p.textAlign(p.LEFT, p.BASELINE);

            // Axis labels
            p.noStroke();
            p.fill(0);
            p.textSize(12);
            p.textAlign(p.CENTER, p.CENTER);
            p.text("Year", marginLeft + chartWidth / 2, p.height - marginBottom + 35);
            p.push();
            p.translate(40, marginTop + chartHeight / 2);
            p.rotate(-p.HALF_PI);
            p.text("Relative import exposure (normalized 0–1)", 0, 0);
            p.pop();
            p.textAlign(p.LEFT, p.BASELINE);

            // Color palette for groups
            var colors = {
                electronics: p.color(33, 114, 179),
                vehicles: p.color(245, 122, 0),
                metals: p.color(120, 120, 120),
                textiles: p.color(178, 60, 160),
                food_agriculture: p.color(93, 180, 72),
                chemicals: p.color(200, 90, 30),
                mineral_fuels: p.color(80, 130, 200),
                manufactures: p.color(40, 160, 120)
            };

            // Draw category lines
            p.strokeWeight(2.2);
            p.noFill();
            for (var gi2 = 0; gi2 < groups.length; gi2++) {
                var g2 = groups[gi2];
                p.stroke(colors[g2] || p.color(0));
                p.beginShape();
                for (var yi2 = 0; yi2 < years.length; yi2++) {
                    var year = years[yi2];
                    var val = (usaData[g2] && usaData[g2][year]) ? usaData[g2][year] : 0;
                    var xPos = p.map(year, xMin, xMax, marginLeft, marginLeft + chartWidth);
                    var yMapped = p.map(val, 0, 1, marginTop + chartHeight, marginTop);
                    p.vertex(xPos, yMapped);
                }
                p.endShape();
            }

            // Legend + tariff legend
            // Keep legend within the canvas even on narrower screens.
            var legendX = Math.min(marginLeft + chartWidth + 10, p.width - 180);
            drawLegend(colors, legendX, marginTop);
            drawTariffLegend(legendX, marginTop + 160);

            // Footer label
            p.noStroke();
            p.fill(40);
            p.textSize(11);
            p.textAlign(p.LEFT, p.BOTTOM);
            p.text("US imports only; values normalized for comparison across categories.", marginLeft, p.height - 10);
        };

        function drawLegend(colors, x, y) {
            p.noStroke();
            p.fill(248);
            p.textSize(12);
            var title = "Categories (relative import exposure)";

            // Compute the widest label including title
            var maxLabelWidth = p.textWidth(title);
            for (var gi = 0; gi < groups.length; gi++) {
                var label = prettyName(groups[gi]);
                var w = p.textWidth(label);
                if (w > maxLabelWidth) maxLabelWidth = w;
            }

            var swatchW = 16;
            var swatchGap = 8;
            var boxPadding = 12;
            var boxWidth = Math.max(160, Math.ceil(maxLabelWidth) + swatchW + swatchGap + boxPadding * 2);

            var titleHeight = p.textAscent() + p.textDescent();
            var lineHeight = Math.max(18, Math.ceil(titleHeight) + 4);
            var boxHeight = boxPadding + titleHeight + 6 + lineHeight * groups.length + boxPadding;

            // Clamp the legend box so it's fully inside the canvas
            var rectX = Math.min(x, p.width - boxWidth - 10);
            rectX = Math.max(10, rectX);
            var rectY = y - 12;
            if (rectY + boxHeight > p.height - 10) {
                rectY = p.height - boxHeight - 10;
            }

            // Draw background with a subtle stroke so edges are obvious
            p.fill(248);
            p.stroke(200);
            p.rect(rectX, rectY, boxWidth, boxHeight, 6);
            p.noStroke();

            // Title
            p.fill(0);
            p.textAlign(p.LEFT, p.TOP);
            p.text(title, rectX + boxPadding, rectY + boxPadding);

            // Items
            for (var i2 = 0; i2 < groups.length; i2++) {
                var g2 = groups[i2];
                var cy = rectY + boxPadding + titleHeight + 6 + i2 * lineHeight;
                p.fill(colors[g2] || p.color(0));
                p.rect(rectX + boxPadding, cy, swatchW, Math.max(8, Math.round(swatchW * 0.6)));
                p.fill(40);
                p.text(prettyName(g2), rectX + boxPadding + swatchW + swatchGap, cy - 2);
            }
            p.textAlign(p.LEFT, p.BASELINE);
        }

        function drawTariffLegend(x, y) {
            p.textAlign(p.LEFT, p.TOP);
            p.textSize(12);
            p.noStroke();
            p.fill(0);
            var title = "Tariff signal";
            var label = "Years with average tariff increase";

            var boxPadding = 10;
            var titleW = p.textWidth(title);
            var labelW = p.textWidth(label);
            var boxW = Math.max(140, Math.ceil(Math.max(titleW, labelW)) + boxPadding * 2 + 32);
            var boxH = 40;

            var rectX = Math.min(x, p.width - boxW - 10);
            rectX = Math.max(10, rectX);
            var rectY = y;
            if (rectY + boxH > p.height - 10) rectY = p.height - boxH - 10;

            // Draw a subtle background for clarity and to avoid clipping
            p.fill(248);
            p.stroke(200);
            p.rect(rectX, rectY - 8, boxW, boxH, 6);
            p.noStroke();

            p.fill(0);
            p.text(title, rectX + boxPadding, rectY - 4);
            // Shaded band example
            var yBand = rectY + 8;
            p.fill(255, 235, 235);
            p.rect(rectX + boxPadding, yBand, 24, 10);
            p.noStroke();
            p.fill(40);
            p.text(label, rectX + boxPadding + 32, yBand - 1);
        }
    };

    new p5(sketch);
})();
