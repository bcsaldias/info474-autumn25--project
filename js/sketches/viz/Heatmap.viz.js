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

