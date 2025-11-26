let usMap = null;
let projection = null;
let dataLoadedTime = null;

// Fetch the GeoJSON data immediately
fetch('data/us-states.json')
    .then(response => response.json())
    .then(data => {
        usMap = data;
        dataLoadedTime = Date.now();
    })
    .catch(error => console.error('Failed to load GeoJSON:', error));


(function () {
    window.FIIncomeMap = {
        draw: function (p, manager, ai, progress) {
            p.push();

            // p.background(240, 245, 250);

            if (!usMap) {
                p.fill(100);
                p.textSize(16);
                p.textAlign(p.CENTER, p.CENTER);
                p.text('Loading map data...', p.width / 2, p.height / 2);
                p.pop();
                return;
            }

            // Initialize projection on first draw
            if (!projection) {
                projection = d3.geoAlbersUsa()
                    .translate([p.width / 2, p.height / 2])
                    .scale(650);
            }

            // Draw the map
            p.noStroke();
            p.fill(180, 200, 220);

            try {
                usMap.features.forEach(function(feature) {
                    if (!feature.geometry || !feature.geometry.coordinates) return;

                    // Handle both Polygon and MultiPolygon
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
                console.error('FIIncomeMap render error:', e.message);
                p.fill(200, 0, 0);
                p.textSize(14);
                p.text('Error rendering map', 10, 20);
            }

            p.pop();
        }
    };
})();