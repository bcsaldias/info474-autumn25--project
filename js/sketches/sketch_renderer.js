// sketch_renderer.js
// Responsible for rendering the main visualization based on the current active index

(function () {
    window.Renderer = {

        setData: function (manager) {
            manager.offsetX = (manager.margin && manager.margin.left) || 20;
            manager.offsetY = (manager.margin && manager.margin.top) || 0;

            // This loads the daily Seattle weather file for Sketch 4 and 5.
            // Put your daily CSV in: data/2025 Seattle Weather.csv
            return fetch('data/2025 Seattle Weather.csv')
                .then(function (res) {
                    if (!res.ok) throw new Error('Could not load weather CSV');
                    return res.text();
                })
                .then(function (text) {
                    var rows = parseCSV(text);
                    manager.weatherDaily = window.WeatherWeekViz.cleanRows(rows);
                    manager.data = manager.weatherDaily;
                    return manager.data;
                })
                .catch(function (err) {
                    console.warn('Weather data not loaded. Using fallback sample data.', err);
                    manager.weatherDaily = [];
                    manager.data = [];
                    return manager.data;
                });
        },

        draw: function (p, manager, ai, progress) {
            if (ai === 0 || ai === 1) {
                window.VizTitle.draw(p, manager, ai, progress);
                return;
            }

            // Sketch 4: weekly weather lens
            if (ai === 4) {
                window.WeatherWeekViz.drawSketch4(p, manager, ai, progress);
                return;
            }

            // Sketch 5: day in context
            if (ai === 5) {
                window.WeatherWeekViz.drawSketch5(p, manager, ai, progress);
                return;
            }

            if (ai === 6 || ai === 9) {
                window.VizProgressColor.draw(p, manager, ai, progress);
                return;
            }

            if (ai === 7) {
                window.VizBar.draw(p, manager, ai, progress);
                return;
            }

            // Default placeholder if no active visualization is assigned.
            p.push();
            p.fill(60);
            p.textAlign(p.CENTER, p.CENTER);
            p.textSize(18);
            p.text('Visualization section ' + ai, (manager.offsetX || 0) + (manager.width || 600) / 2, (manager.offsetY || 0) + (manager.height || 520) / 2);
            p.pop();
        }
    };

    // Lightweight CSV parser. Handles quoted commas.
    function parseCSV(text) {
        var lines = text.trim().split(/\r?\n/);
        if (!lines.length) return [];
        var headers = splitCSVLine(lines[0]);
        var rows = [];
        for (var i = 1; i < lines.length; i++) {
            if (!lines[i].trim()) continue;
            var values = splitCSVLine(lines[i]);
            var row = {};
            for (var j = 0; j < headers.length; j++) {
                row[headers[j]] = values[j] || '';
            }
            rows.push(row);
        }
        return rows;
    }

    function splitCSVLine(line) {
        var out = [];
        var cur = '';
        var inQuotes = false;
        for (var i = 0; i < line.length; i++) {
            var ch = line[i];
            if (ch === '"') {
                if (inQuotes && line[i + 1] === '"') {
                    cur += '"';
                    i++;
                } else {
                    inQuotes = !inQuotes;
                }
            } else if (ch === ',' && !inQuotes) {
                out.push(cur);
                cur = '';
            } else {
                cur += ch;
            }
        }
        out.push(cur);
        return out;
    }
})();
