let usMap = null;
let projection = null;
let fiData = {}; // State abbreviation -> % FI ≤ SNAP Threshold

// Map full state names to abbreviations (from GeoJSON to CSV)
const stateNameToAbbr = {
    'Alabama': 'AL', 'Alaska': 'AK', 'Arizona': 'AZ', 'Arkansas': 'AR', 'California': 'CA',
    'Colorado': 'CO', 'Connecticut': 'CT', 'Delaware': 'DE', 'District of Columbia': 'DC', 'Florida': 'FL',
    'Georgia': 'GA', 'Hawaii': 'HI', 'Idaho': 'ID', 'Illinois': 'IL', 'Indiana': 'IN',
    'Iowa': 'IA', 'Kansas': 'KS', 'Kentucky': 'KY', 'Louisiana': 'LA', 'Maine': 'ME',
    'Maryland': 'MD', 'Massachusetts': 'MA', 'Michigan': 'MI', 'Minnesota': 'MN', 'Mississippi': 'MS',
    'Missouri': 'MO', 'Montana': 'MT', 'Nebraska': 'NE', 'Nevada': 'NV', 'New Hampshire': 'NH',
    'New Jersey': 'NJ', 'New Mexico': 'NM', 'New York': 'NY', 'North Carolina': 'NC', 'North Dakota': 'ND',
    'Ohio': 'OH', 'Oklahoma': 'OK', 'Oregon': 'OR', 'Pennsylvania': 'PA', 'Rhode Island': 'RI',
    'South Carolina': 'SC', 'South Dakota': 'SD', 'Tennessee': 'TN', 'Texas': 'TX', 'Utah': 'UT',
    'Vermont': 'VT', 'Virginia': 'VA', 'Washington': 'WA', 'West Virginia': 'WV', 'Wisconsin': 'WI',
    'Wyoming': 'WY'
};

// Fetch GeoJSON
fetch('data/us-states.json')
    .then(response => response.json())
    .then(data => {
        usMap = data;
    })
    .catch(error => console.error('Failed to load GeoJSON:', error));

// Fetch and parse CSV (robust parsing: handles decimals like 0.34 or whole numbers like 34)
fetch('data/FI_income.csv')
    .then(response => response.text())
    .then(csvText => {
        const lines = csvText.trim().split('\n');
        const stateAbbrIndex = 2; // "State" column (0-indexed)
        const snapThresholdIndex = 4; // "% FI ≤ SNAP Threshold" column (0-indexed)

        for (let i = 1; i < lines.length; i++) {
            const row = lines[i].split(',');
            const stateAbbr = row[stateAbbrIndex]?.trim();
            let valueStr = row[snapThresholdIndex]?.trim() || '';

            // Sanitize string: remove surrounding quotes and commas
            valueStr = valueStr.replace(/^"|"$/g, '').replace(/,/g, '').trim();

            // Parse as float. Handle either a fraction (0.34) or a percentage (34)
            let value = parseFloat(valueStr);
            if (!isNaN(value)) {
                if (value > 0 && value <= 1) value = value * 100; // scale fractions
                value = Math.round(value * 10) / 10; // round to 1 decimal
                fiData[stateAbbr] = value;
            }
        }
    })
    .catch(error => console.error('Failed to load CSV:', error));

// Color scale: 20 discrete blue bins (light to dark), normalized to 0-100%
function getColor(value) {
    if (value === undefined || value === null || isNaN(value)) return [220, 220, 220];

    // 20 blue shades from light to dark
    const blueBins = [
        [240, 249, 255], [234, 246, 255], [227, 243, 255], [220, 240, 255], [213, 236, 255],
        [206, 233, 255], [199, 230, 255], [183, 215, 255], [166, 200, 255], [149, 185, 255],
        [132, 170, 240], [115, 150, 220], [98, 130, 200], [81, 110, 180], [64, 90, 160],
        [47, 70, 140], [38, 60, 125], [29, 50, 110], [20, 40, 95], [10, 30, 80]
    ];

    // Normalize across 0-100% (user requested): value of 0 -> bin 0, 100 -> bin 19
    const normalized = Math.max(0, Math.min(1, value / 100));
    const binIndex = Math.min(19, Math.floor(normalized * 20));

    return blueBins[binIndex];
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
                    // Convert name to abbreviation (e.g., "Alabama" -> "AL")
                    const stateAbbr = stateNameToAbbr[stateName];
                    // Look up % FI ≤ SNAP Threshold value from parsed CSV data
                    const value = fiData[stateAbbr];

                        // Debug logging for first few states
                        if (usMap.features.indexOf(feature) < 3) {
                            console.log(`Feature: ${stateName} -> Abbr: ${stateAbbr} -> Value: ${value} -> Color: ${getColor(value)}`);
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

            p.pop();
        }
    };
})();