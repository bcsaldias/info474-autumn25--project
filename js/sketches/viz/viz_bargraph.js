// ...existing code...
(function () {
    // VizBarGraph implementation (also aliased to VizBar so existing renderer works)
    var VizBarGraph = {
        draw: function (p, manager, ai, progress) {
            p.push();

            var countries = ['BR','CA','CN','DE','GB','IN','JP','KR','MX','NG','ZA'];
            var gdp = {
                BR: 2.18,
                CA: 2.24,
                CN: 1.87,
                DE: 4.66,
                GB: 3.64,
                IN: 3.91,
                JP: 4.03,
                KR: 1.71,
                MX: 1.79,
                NG: 1.88,
                ZA: 4.00,
            };

            var left = (manager && manager.offsetX) || 20;
            var top = (manager && manager.offsetY) || 0;
            var availW = ((manager && manager.width) || 760) - 40; // leave some right padding
            var availH = ((manager && manager.height) || 480) - 20;
            var rowH = availH / countries.length;
            var barMaxW = Math.max(60, availW - 140);

            p.noStroke();
            p.textAlign(p.LEFT, p.CENTER);
            p.textSize(12);

            // find max GDP for scaling
            var maxGDP = 0;
            for (var i = 0; i < countries.length; i++) {
                var v = gdp[countries[i]] || 0;
                if (v > maxGDP) maxGDP = v;
            }

            for (var i = 0; i < countries.length; i++) {
                var y = top + i * rowH + rowH / 2;

                // country code label
                p.fill(30);
                p.text(countries[i], left, y);

                var val = gdp[countries[i]] || 0;
                var bw = (val / (maxGDP || 1)) * barMaxW;
                var bx = left + 80; // offset for label column
                var by = y - (rowH * 0.35);
                var bh = rowH * 0.7;

                // adding color hues to bar
                var hue = Math.round((i / countries.length) * 90);
                var lightness = 45;
                var barColor = 'hsl(' + hue + ',70%,' + lightness + '%)';

                p.fill(barColor);
                p.rect(bx, by, bw, bh, 3);

                // choose text color for contrast
                if (lightness < 50) p.fill(255); else p.fill(30);

                // value text on the bar (or to the right if bar is too narrow)
                var valueText = formatGDP(val);
                if (bw < 60) {
                    p.fill(30);
                    p.textAlign(p.LEFT, p.CENTER);
                    p.text(valueText, bx + bw + 6, y);
                } else {
                    p.fill(255);
                    p.textAlign(p.LEFT, p.CENTER);
                    p.text(valueText, bx + 6, y);
                }
            }

            p.pop();

            // helper: format GDP as $x.yyT / $x.yyB
            function formatGDP(v) {
                if (!isFinite(v) || v === 0) return 'n/a';
                var abs = Math.abs(v);
                if (abs >= 1e12) return '$' + (v / 1e12).toFixed(2) + 'T';
                if (abs >= 1e9) return '$' + (v / 1e9).toFixed(2) + 'B';
                return '$' + v.toString();
            }
        }
    };

    // expose to global scope
    window.VizBarGraph = VizBarGraph;
})();