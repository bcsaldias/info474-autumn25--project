// viz_1_in_5.js
(function () {
    window.Viz1In5 = {
        draw: function (p, manager, ai, progress) {
            p.push();

            p.background(255);
            p.textAlign(p.CENTER, p.CENTER);
            p.textSize(20);
            p.fill(0);
            p.text("1 in 5 children face food insecurity (~13 million kids in the US)",
                   p.width / 2, 40);

            p.pop();
        }
    };
})();
