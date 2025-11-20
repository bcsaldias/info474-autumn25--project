// heatmap using a treemap style to categorize tariff percentage by countries
// through different tile shapes
(function(){
    window.VizTreemap = {};

    VizTreemap.defaultData = {
        Brazil: 7,
        Canada: 1,
        China: 2,
        Germany: 1,
        UK: 1,
        India: 6,
        Japan: 1,
        Korea: 6,
        Mexico: 2,
        Nigeria: 9,
        SA: 5
    };

    // Color scale: shades of red (light red = low value, dark red = high value)
    function colorForValue(v, minV, maxV){
        if (v === null || v === undefined || isNaN(v)) return '#e6e6e6';
        var t = (v - minV) / (maxV - minV || 1);
        t = Math.max(0, Math.min(1, t));
        var lightness = Math.round(85 - (85 - 30) * t);
        return 'hsl(0,75%,' + lightness + '%)';
    }
    VizTreemap.draw = function(p, manager, ai, progress){
        p.push();

        var left = (manager && manager.offsetX) || 20;
        var top = (manager && manager.offsetY) || 20;
        var width = (manager && manager.width) || 760;
        var height = (manager && manager.height) || 480;

        var data = (manager && manager._treemapData) ? manager._treemapData : VizTreemap.defaultData;
        var items = Object.keys(data).map(function(k){ return {key:k, value: Number(data[k])}; });
        items = items.filter(function(it){ return isFinite(it.value) && it.value >= 0; });

        if (items.length === 0){
            p.fill(255); p.textAlign(p.CENTER, p.CENTER); p.text('No data', left + width/2, top + height/2);
            p.pop(); return;
        }

        var minV = Math.min.apply(null, items.map(function(it){ return it.value; }));
        var maxV = Math.max.apply(null, items.map(function(it){ return it.value; }));

        function sumValues(arr){ return arr.reduce(function(s,it){ return s + it.value; }, 0); }

        var rects = [];
        // function that divides rectangle into tiles 
        function partition(itemsList, x, y, w, h, vertical){
            if (!itemsList || itemsList.length === 0) return;
            if (itemsList.length === 1){
                rects.push({x:x, y:y, w:w, h:h, data: itemsList[0]});
                return;
            }
            var total = sumValues(itemsList);
            var half = total / 2;
            var leftSum = 0; var splitIndex = 0;
            for (var i=0;i<itemsList.length;i++){
                leftSum += itemsList[i].value;
                if (leftSum >= half){ splitIndex = i; break; }
            }
            var leftGroup = itemsList.slice(0, splitIndex+1);
            var rightGroup = itemsList.slice(splitIndex+1);
            var leftTotal = sumValues(leftGroup);
            var rightTotal = sumValues(rightGroup);
            function partition(itemsList, x, y, w, h, vertical){
            if (!itemsList || itemsList.length === 0) return;
            if (itemsList.length === 1){
                rects.push({x:x, y:y, w:w, h:h, data: itemsList[0]});
                return;
            }
            var total = sumValues(itemsList);
            var half = total / 2;
            var leftSum = 0; var splitIndex = 0;
            for (var i=0;i<itemsList.length;i++){
                leftSum += itemsList[i].value;
                if (leftSum >= half){ splitIndex = i; break; }
            }
            var leftGroup = itemsList.slice(0, splitIndex+1);
            var rightGroup = itemsList.slice(splitIndex+1);
            var leftTotal = sumValues(leftGroup);
            var rightTotal = sumValues(rightGroup);

            if (vertical){
                var leftW = (total > 0) ? (w * (leftTotal / total)) : w/2;
                partition(leftGroup, x, y, leftW, h, !vertical);
                partition(rightGroup, x + leftW, y, w - leftW, h, !vertical);
            } else {
                var topH = (total > 0) ? (h * (leftTotal / total)) : h/2;
                partition(leftGroup, x, y, w, topH, !vertical);
                partition(rightGroup, x, y + topH, w, h - topH, !vertical);
            }
        }
            items.sort(function(a,b){ return b.value - a.value; });
        partition(items, left + 0, top + 0, width, height, true);

         p.noFill(); p.stroke(200); p.rect(left, top, width, height);

        for (var k = 0; k < rects.length; k++){
            var r = rects[k];
            var it = r.data;
            var fill = colorForValue(it.value, minV, maxV);
            p.noStroke(); p.fill(fill);
            p.rect(r.x, r.y, r.w, r.h, 4);

            // label contrast
            var textIsDark = true;
            try {
                var m = /hsl\(\s*0\s*,\s*\d+%\s*,\s*(\d+)%\)/.exec(fill);
                if (m && m[1]) { textIsDark = (parseInt(m[1],10) > 60); }
            } catch (e) { textIsDark = true; }
            p.fill(textIsDark ? 40 : 255);
            if (r.w > 50 && r.h > 28){ p.textSize(12); p.text(it.key + ' — ' + it.value, r.x + r.w/2, r.y + r.h/2); }
        }
        var legendX = left + width - 180, legendY = top + height - 40;
        var legendW = 140, legendH = 12;
        for (var j = 0; j <= legendW; j++){
            var t = j / legendW; var v = minV + t * (maxV - minV);
            p.fill(colorForValue(v, minV, maxV)); p.noStroke(); p.rect(legendX + j, legendY, 1, legendH);
        }
        p.fill(255); p.textSize(11); p.textAlign(p.LEFT, p.CENTER);
        p.fill(255); p.text(maxV.toFixed(1) + '%', legendX + legendW + 6, legendY + legendH/2);
        p.text(minV.toFixed(1) + '%', legendX - 40, legendY + legendH/2);

        p.pop();
    };

})();


