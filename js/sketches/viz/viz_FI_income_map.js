let usMap = null;
let projection = null;
let fiDataBelow = {}; // % FI children in HH incomes ≤185% FPL
let fiDataAbove = {}; // % FI children in HH incomes >185% FPL
let currentView = 'below';
let hoveredState = null; // track which state is being hovered
let hoveredValue = null; // track the value of hovered state
let hoveredFeature = null; // track the hovered feature for outline drawing

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
    // Update hover state
    buttonHovered = isMouseOverButton(p);

    const buttonX = (p.width - buttonWidth) / 2;
    const buttonY = p.height - 90;

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
        ? 'View Above 185% FPL'
        : 'View Below 185% FPL';
    p.text(labelText, buttonX + buttonWidth / 2, buttonY + buttonHeight / 2);


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
    p.noStroke();
    p.fill(0);
    p.textSize(12);
    p.textAlign(p.CENTER, p.TOP);
    p.text('% Food Insecure', legendX + legendWidth - 15, legendY - 35);
    p.text('Children', legendX + legendWidth - 15, legendY - 21);

    // Draw 20 discrete color bins
    for (let i = 0; i < numBins; i++) {
        const normalizedValue = (i / (numBins - 1)) * 100;
        const color = getColor(normalizedValue);
        p.fill(color[0], color[1], color[2]);
        const y = legendY + (i * binHeight);
        p.rect(legendX, y, legendWidth, binHeight);
    }

    // Draw legend border
    p.noFill();
    p.stroke(0);
    p.strokeWeight(1);
    p.rect(legendX, legendY, legendWidth, legendHeight);

    // Draw percentage labels
    p.strokeWeight(0);
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

// Check if a point is inside a polygon (ray casting algorithm)
function pointInPolygon(point, polygon) {
    if (!polygon || polygon.length < 3) return false;

    let inside = false;
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
        let xi = polygon[i][0], yi = polygon[i][1];
        let xj = polygon[j][0], yj = polygon[j][1];

        let intersect = ((yi > point[1]) !== (yj > point[1]))
            && (point[0] < (xj - xi) * (point[1] - yi) / (yj - yi) + xi);
        if (intersect) inside = !inside;
    }
    return inside;
}

// Draw tooltip for hovered state
function drawTooltip(p) {
    if (!hoveredState || hoveredValue === null) return;

    const tooltipX = p.mouseX + 10;
    const tooltipY = p.mouseY - 20;
    const tooltipWidth = 200;
    const tooltipHeight = 50;

    // Tooltip background
    p.fill(0, 0, 0, 200);
    p.stroke(255);
    p.strokeWeight(1);
    p.rect(tooltipX, tooltipY, tooltipWidth, tooltipHeight, 4);

    // Tooltip text
    p.fill(255);
    p.textSize(12);
    p.textAlign(p.LEFT, p.TOP);
    p.text(hoveredState, tooltipX + 8, tooltipY + 6);
    p.text(`Food Insecurity: ${hoveredValue}%`, tooltipX + 8, tooltipY + 22);
}

function drawContextText(p) {
    const x = 150;
    const y = 100;
    const boxWidth = 420;

    p.fill(0);
    p.strokeWeight(0);

    p.textSize(12);
    p.textAlign(p.CENTER, p.TOP);

    const contextText = "* The 185% threshold is the common eligibility cutoff for programs like free or reduced-price school meals and WIC";
    const contextText2 = "Toggle the map to compare children who typically qualify for food assistance with those who do not, and see how hardship persists across both groups."

    p.text(contextText, x, y, boxWidth);
    p.fill(150);
    p.textSize(11)
    p.textStyle(p.ITALIC);
    p.text(contextText2, x - 30, y + 420, boxWidth);
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
                    .translate([p.width / 2, p.height / 2 + 15])
                    .scale(650);
            }

            // Use a subtle stroke to draw state boundaries on top of fills
            p.stroke(200);
            p.strokeWeight(0.8);
            p.strokeJoin(p.ROUND);

            // Reset hover state each frame
            hoveredState = null;
            hoveredValue = null;
            hoveredFeature = null;

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

                    // Draw state polygon(s) and check for hover
                    if (feature.geometry.type === 'Polygon') {
                        feature.geometry.coordinates.forEach(function(ring) {
                            p.beginShape();
                            let points = [];
                            ring.forEach(function(coord) {
                                let pt = projection([coord[0], coord[1]]);
                                if (pt) {
                                    p.vertex(pt[0], pt[1]);
                                    points.push(pt);
                                }
                            });
                            p.endShape(p.CLOSE);

                            // Check if mouse is hovering over this polygon
                            if (pointInPolygon([p.mouseX, p.mouseY], points)) {
                                hoveredState = stateName;
                                hoveredValue = value;
                                hoveredFeature = feature;
                            }
                        });
                    } else if (feature.geometry.type === 'MultiPolygon') {
                        feature.geometry.coordinates.forEach(function(polygon) {
                            polygon.forEach(function(ring) {
                                p.beginShape();
                                let points = [];
                                ring.forEach(function(coord) {
                                    let pt = projection([coord[0], coord[1]]);
                                    if (pt) {
                                        p.vertex(pt[0], pt[1]);
                                        points.push(pt);
                                    }
                                });
                                p.endShape(p.CLOSE);

                                // Check if mouse is hovering over this polygon
                                if (pointInPolygon([p.mouseX, p.mouseY], points)) {
                                    hoveredState = stateName;
                                    hoveredValue = value;
                                    hoveredFeature = feature;
                                }
                            });
                        });
                    }
                });

                // Draw outline for hovered state only (after all states are drawn)
                if (hoveredFeature && hoveredFeature.geometry) {
                    p.stroke(0);
                    p.strokeWeight(1);
                    p.noFill();

                    if (hoveredFeature.geometry.type === 'Polygon') {
                        hoveredFeature.geometry.coordinates.forEach(function(ring) {
                            p.beginShape();
                            ring.forEach(function(coord) {
                                let pt = projection([coord[0], coord[1]]);
                                if (pt) p.vertex(pt[0], pt[1]);
                            });
                            p.endShape(p.CLOSE);
                        });
                    } else if (hoveredFeature.geometry.type === 'MultiPolygon') {
                        hoveredFeature.geometry.coordinates.forEach(function(polygon) {
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
                }
            } catch (e) {
                console.error('Error rendering map:', e.message);
            }

            p.fill(0);
            p.textSize(24);
            p.textAlign(p.CENTER, p.TOP);

            const subtitle = currentView === 'below'
                ? 'Percent of Food-Insecure Children Below 185% FPL'
                : 'Percent of Food-Insecure Children Above 185% FPL';
            p.text(subtitle, p.width / 2, 70);

            drawContextText(p);


            // Draw the toggle button
            drawToggleButton(p);
            // Draw the legend
            drawLegend(p);

            // Draw tooltip if hovering over a state
            drawTooltip(p);

            p.pop();
        },

        mousePressed: function (p, manager, ai, progress) {
            if (isMouseOverButton(p)) {
                currentView = (currentView === 'below') ? 'above' : 'below';
                console.log('Switched to view:', currentView);
                return false;
            }
        }
    };
})();