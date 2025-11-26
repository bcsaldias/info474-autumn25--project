let usMap = null;
let projection = null;
let fiDataBelow = {}; // % FI children in HH incomes ≤185% FPL
let fiDataAbove = {}; // % FI children in HH incomes >185% FPL
let currentView = 'below';

// Fetch GeoJSON
fetch('data/us-states.json')
    .then(response => response.json())
    .then(data => {
        usMap = data;
    })
    .catch(error => console.error('Failed to load GeoJSON:', error));

// Fetch and parse CSV
fetch('data/FI_income.csv')
  .then(response => response.text())
  .then(csvText => {
    const lines = csvText.trim().split('\n');
    const stateNameIndex = 1;
    const belowIndex = 4;
    const aboveIndex = 5;

    function parseVal(str) {
      let valueStr = (str || '').replace(/^"|"$/g, '').replace(/,/g, '').trim();
      let value = parseFloat(valueStr);
      if (!isNaN(value)) {
        if (value > 0 && value <= 1) value *= 100;
        return Math.round(value * 10) / 10;
      }
    }

    for (let i = 1; i < lines.length; i++) {
      const row = lines[i].split(',');
      const stateName = row[stateNameIndex]?.trim();
      if (!stateName) continue;

      fiDataBelow[stateName] = parseVal(row[belowIndex]);
      fiDataAbove[stateName] = parseVal(row[aboveIndex]);
    }

    console.log('Parsed fiDataBelow sample:', fiDataBelow['Alabama']);
    console.log('Parsed fiDataAbove sample:', fiDataAbove['Alabama']);
  })
  .catch(error => console.error('Failed to load CSV:', error));


// Color scale: 20 discrete blue bins (light to dark), normalized to 0-100%
function getColor(value) {
    if (value === undefined || value === null || isNaN(value)) return [220, 220, 220];

    const blueBins = [
        [240, 249, 255], [234, 246, 255], [227, 243, 255], [220, 240, 255], [213, 236, 255],
        [206, 233, 255], [199, 230, 255], [183, 215, 255], [166, 200, 255], [149, 185, 255],
        [132, 170, 240], [115, 150, 220], [98, 130, 200], [81, 110, 180], [64, 90, 160],
        [47, 70, 140], [38, 60, 125], [29, 50, 110], [20, 40, 95], [10, 30, 80]
    ];

    const normalized = Math.max(0, Math.min(1, value / 100));
    const binIndex = Math.min(19, Math.floor(normalized * 20));

    return blueBins[binIndex];
}


// Button dimensions and position
const buttonWidth = 165;
const buttonHeight = 40;
let buttonHovered = false;

// Check if mouse is over button
function isMouseOverButton(p) {
    const buttonX = (p.width - buttonWidth) / 2;
    const buttonY = p.height - 80;
    return p.mouseX >= buttonX && p.mouseX <= buttonX + buttonWidth &&
           p.mouseY >= buttonY && p.mouseY <= buttonY + buttonHeight;
}

// Draw toggle button on canvas
function drawToggleButton(p) {
    const buttonX = (p.width - buttonWidth) / 2;
    const buttonY = p.height - 80;

    // Button background
    p.fill(buttonHovered ? 5 : 0, 123, 255);
    p.stroke(0);
    p.strokeWeight(1);
    p.rect(buttonX, buttonY, buttonWidth, buttonHeight, 4);

    // Button text
    p.fill(255);
    p.textSize(13);
    p.textAlign(p.CENTER, p.CENTER);
    const labelText = currentView === 'below'
        ? 'Toggle: Below 185% FPL'
        : 'Toggle: Above 185% FPL';
    p.text(labelText, buttonX + buttonWidth / 2, buttonY + buttonHeight / 2);

    // Update hover state
    buttonHovered = isMouseOverButton(p);
}

// Draw discrete color legend on the right side (20 bins)
function drawLegend(p) {
    const legendX = p.width - 75;
    const legendY = 200;
    const legendWidth = 30;
    const binHeight = 10;
    const numBins = 20;
    const legendHeight = binHeight * numBins;

    // Draw legend label
    p.fill(0);
    p.textSize(12);
    p.textAlign(p.RIGHT, p.TOP);
    p.text('% Food', legendX + legendWidth + 5, legendY - 35);
    p.text('Insecure', legendX + legendWidth + 5, legendY - 21);

    // Draw 20 discrete color bins
    for (let i = 0; i < numBins; i++) {
        const normalizedValue = (i / (numBins - 1)) * 100;
        const color = getColor(normalizedValue);
        p.fill(color[0], color[1], color[2]);
        p.noStroke();
        const y = legendY + (i * binHeight);
        p.rect(legendX, y, legendWidth, binHeight);
    }

    // Draw legend border
    p.noFill();
    p.stroke(0);
    p.strokeWeight(1);
    p.rect(legendX, legendY, legendWidth, legendHeight);

    // Draw percentage labels
    p.fill(0);
    p.textSize(10);
    p.textAlign(p.LEFT, p.CENTER);

    // 0% label
    p.text('0%', legendX + legendWidth + 3, legendY);

    // 50% label (middle)
    p.text('50%', legendX + legendWidth + 3, legendY + legendHeight / 2);

    // 100% label
    p.text('100%', legendX + legendWidth + 3, legendY + legendHeight);
}

(function () {
    window.FIIncomeMap = {
        draw: function (p, manager, ai, progress) {
            p.push();

            if (!usMap) {
                p.fill(100);
                p.textSize(16);
                p.textAlign(p.CENTER, p.CENTER);
                p.text('Loading map data...', p.width / 2, p.height / 2);
                p.pop();
                return;
            }

            // Initialize projection once
            if (!projection) {
                projection = d3.geoAlbersUsa()
                    .translate([p.width / 2, p.height / 2])
                    .scale(650);
            }

            // Use a subtle stroke to draw state boundaries on top of fills
            p.stroke(200);
            p.strokeWeight(0.8);
            p.strokeJoin(p.ROUND);

            try {
                usMap.features.forEach(function(feature) {
                    if (!feature.geometry || !feature.geometry.coordinates) return;

                    // Get state name from GeoJSON properties
                    const stateName = feature.properties?.name;
                    // Choose dataset based on currentView
                    const value = (currentView === 'below')
                      ? fiDataBelow[stateName]
                      : fiDataAbove[stateName];

                        // Debug logging for first few states
                        if (usMap.features.indexOf(feature) < 3) {
                            console.log(`Feature: ${stateName} -> Value: ${value} -> Color: ${getColor(value)}`);
                        }

                    // Get color based on value (light blue = low, dark blue = high)
                    const color = getColor(value);
                    p.fill(color[0], color[1], color[2]);

                    // Draw state polygon(s)
                    if (feature.geometry.type === 'Polygon') {
                        feature.geometry.coordinates.forEach(function(ring) {
                            p.beginShape();
                            ring.forEach(function(coord) {
                                let pt = projection([coord[0], coord[1]]);
                                if (pt) p.vertex(pt[0], pt[1]);
                            });
                            p.endShape(p.CLOSE);
                        });
                    } else if (feature.geometry.type === 'MultiPolygon') {
                        feature.geometry.coordinates.forEach(function(polygon) {
                            polygon.forEach(function(ring) {
                                p.beginShape();
                                ring.forEach(function(coord) {
                                    let pt = projection([coord[0], coord[1]]);
                                    if (pt) p.vertex(pt[0], pt[1]);
                                });
                                p.endShape(p.CLOSE);
                            });
                        });
                    }
                });
            } catch (e) {
                console.error('Error rendering map:', e.message);
            }

            // Draw the toggle button
            drawToggleButton(p);

            // Draw the legend
            drawLegend(p);

            p.pop();
        },

        mousePressed: function (p, manager, ai, progress) {
            if (isMouseOverButton(p)) {
                currentView = (currentView === 'below') ? 'above' : 'below';
                console.log('Switched to view:', currentView);
                return false; // prevent default
            }
        }
    };
})();