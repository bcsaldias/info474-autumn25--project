// viz_heatmap.js
// World choropleth (heatmap) showing tariff rates per country.
// Expects a GeoJSON FeatureCollection at `data/countries.geo.json` (or set
// `manager._countriesGeoJsonUrl` to a different path). Uses a simple
// equirectangular projection. Place hard-coded tariffs in
// `VizHeatmap.hardcodedTariffs` or `manager._tariffRates`.
(function () {
    window.VizHeatmap = {
        // Example place to hard-code tariffs by ISO3 country code.
        // Edit or extend these values as needed. Values should be between 0.5 and 15.
        hardcodedTariffs: {
            USA: 2.5,
            CHN: 8.0,
            RUS: 4.2,
            IND: 10.0,
            BRA: 6.5,
            CAN: 1.8,
            AUS: 3.0,
            ZAF: 5.0,
            GBR: 2.0,
            DEU: 1.7
        },

        draw: function (p, manager, ai, progress) {
            p.push();
            var left = manager.offsetX || 0;
            var top = manager.offsetY || 0;
            var width = manager.width || 600;
            var height = manager.height || 520;

            // Source GeoJSON path (user can override on manager)
            var geoUrl = manager._countriesGeoJsonUrl || 'data/countries.geo.json';

            // Tariff mapping: manager override -> hardcoded -> empty
            var tariffs = manager._tariffRates || VizHeatmap.hardcodedTariffs || {};

            // Color scale domain
            var minVal = 0.5;
            var maxVal = 15;

            // Helpers
            function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
            function lerp(a, b, t) { return a + (b - a) * t; }
            function hexToRgb(hex) {
                hex = hex.replace('#','');
                var bigint = parseInt(hex,16);
                return [(bigint>>16)&255, (bigint>>8)&255, bigint&255];
            }
            function rgbToHex(r,g,b){
                return '#'+((1<<24)+(r<<16)+(g<<8)+b).toString(16).slice(1);
            }
            // Color interpolation from light yellow to dark red
            var cold = hexToRgb('#ffffcc');
            var hot = hexToRgb('#800026');
            function colorForValue(v) {
                if (v === null || v === undefined) return [200,200,200,220]; // gray for missing
                var t = clamp((v - minVal) / (maxVal - minVal), 0, 1);
                var r = Math.round(lerp(cold[0], hot[0], t));
                var g = Math.round(lerp(cold[1], hot[1], t));
                var b = Math.round(lerp(cold[2], hot[2], t));
                return [r, g, b, 220];
            }

            // Simple equirectangular projection: lon/lat -> x/y within manager box
            function projectLonLat(lon, lat) {
                var x = left + ((lon + 180) / 360) * width;
                var y = top + ((90 - lat) / 180) * height;
                return [x, y];
            }

            // Load GeoJSON if needed
            if (!manager._countriesGeoJson) {
                // kick off async load
                try {
                    manager._countriesGeoJson = null; // flag that we've requested it
                    p.loadJSON(geoUrl, function (json) {
                        manager._countriesGeoJson = json;
                    }, function (err) {
                        // keep null, will show error message
                        manager._countriesGeoJson = { __loadError: true };
                    });
                } catch (e) {
                    manager._countriesGeoJson = { __loadError: true };
                }
            }

            // If still loading or error, display message and exit
            if (!manager._countriesGeoJson) {
                p.fill(255);
                p.textAlign(p.CENTER, p.CENTER);
                p.textSize(16);
                p.text('Loading country shapes...', left + width/2, top + height/2);
                p.pop();
                return;
            }
            if (manager._countriesGeoJson.__loadError) {
                p.fill(255, 80, 80);
                p.textAlign(p.CENTER, p.CENTER);
                p.textSize(14);
                p.text('Failed to load GeoJSON at ' + geoUrl, left + width/2, top + height/2);
                p.pop();
                return;
            }

            var geo = manager._countriesGeoJson;
            var features = geo.features || [];

            p.noStroke();

            // Draw each country
            for (var i = 0; i < features.length; i++) {
                var feat = features[i];
                var props = feat.properties || {};
                var code = (props.ISO_A3 || props.iso_a3 || props.ISO3 || props.iso3 || feat.id || props.ADM0_A3 || props.ISO) || null;
                if (code) code = String(code).toUpperCase();

                // look up tariff
                var val = null;
                if (code && tariffs.hasOwnProperty(code)) val = tariffs[code];

                var col = colorForValue(val);
                p.fill(col[0], col[1], col[2], col[3]);

                var geom = feat.geometry;
                if (!geom) continue;

                if (geom.type === 'Polygon') {
                    drawPolygon(geom.coordinates);
                } else if (geom.type === 'MultiPolygon') {
                    for (var m = 0; m < geom.coordinates.length; m++) drawPolygon(geom.coordinates[m]);
                }
            }

            // Draw country polygon helper (array of rings)
            function drawPolygon(rings) {
                for (var r = 0; r < rings.length; r++) {
                    var ring = rings[r];
                    p.beginShape();
                    for (var v = 0; v < ring.length; v++) {
                        var lon = ring[v][0];
                        var lat = ring[v][1];
                        var pt = projectLonLat(lon, lat);
                        p.vertex(pt[0], pt[1]);
                    }
                    p.endShape(p.CLOSE);
                }
            }

            // Draw legend (vertical) on the right side
            var legendW = 12;
            var legendH = Math.min(180, height * 0.6);
            var lx = left + width - 70;
            var ly = top + 20;
            p.push();
            p.noStroke();
            for (var j = 0; j <= legendH; j++) {
                var t = j / legendH;
                var val = lerp(maxVal, minVal, t); // top->bottom
                var c = colorForValue(val);
                p.fill(c[0], c[1], c[2], c[3]);
                p.rect(lx, ly + j, legendW, 1);
            }
            p.fill(255);
            p.textAlign(p.LEFT, p.CENTER);
            p.textSize(11);
            p.text(maxVal.toFixed(1), lx + legendW + 6, ly + 4);
            p.text(((minVal + maxVal)/2).toFixed(1), lx + legendW + 6, ly + legendH/2);
            p.text(minVal.toFixed(1), lx + legendW + 6, ly + legendH - 4);
            p.pop();

            p.pop();
        }
    };
})();
