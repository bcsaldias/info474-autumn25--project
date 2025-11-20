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
