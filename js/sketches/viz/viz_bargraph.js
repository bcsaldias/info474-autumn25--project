// Added contents of viz_bar into viz_bar graph
(function () {
    window.VizBar = {
        draw: function (p, manager, ai, progress) {
            p.push();
            var countries = ['BR','CA', 'CN','DE','GB','IN','JP','KR','MX','NG','ZA'];
            var gdp_usd = {
                BR: 2.18e12,
                CA: 2.24e12,
                CN: 1.87e13,
                DE: 4.66e12,
                GB: 3.64e12,
                IN: 3.91e12,
                JP: 4.03e12,
                KR: 1.71e12,
                MX: 1.79e12,
                NG: 1.88e11,
                ZA: 4.00e11
            };
            var left = manager.offsetX || 20;
            var top = manager.offsetY || 0;
            var availW = (manager.width || 600) - 40; // leave some right padding
            var availH = (manager.height || 520) - 20;
            var rowH = availH / months.length;
            var barMaxW = Math.max(60, availW - 120);

            p.noStroke();
            p.textAlign(p.LEFT, p.CENTER)
            var maxGDP = 0;
            for(var i = 0; i < countries.length; i++){
                var v = gdp[countries[i]] || 0;
                if(v > maxGDP){
                    maxGDP = v;
                }
            }
            for(var i = 0; i < countries.length; i++){
                var y = top + i * rowH + rowH / 2;
                p.fill(30);
                p.text(countries[i], left, y);

                var val = gdp[countries[i]] || 0;
                var bw = (val / (maxGDP || 1)) * barMaxW;
                var bx = left + 60;
                var by = y - (rowH * 0.35);
                var bh = rowH * 0.7;
            

            // starting to form bar chart
            p.fill(200, 60, 60, 200);
            p.rect(bx, by, bw, bh, 3);
            p.fill(255);
            p.textAlign(p.LEFT, p.CENTER);
            p.text(formatGDP(val)< bx + 6, y);
        }
        p.pop();

        // helper function format GDP
        function formatGDP(v){
            if(!isFinite(v) || v == 0){
                return n/a;
            }
            var abs = Math.abs(v);
            if(abs >= 1e12) return'$' + (v / 1e12).toFixed(2) + 'T';
                if (abs >= 1e9) return '$' + (v / 1e9).toFixed(2) + 'B';
                return '$' + v.toString();
             }

            
        }
    };
})();