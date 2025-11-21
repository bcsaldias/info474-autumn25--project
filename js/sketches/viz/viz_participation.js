(function () {
    var manager = {
      margin: { top: 40, right: 40, bottom: 40, left: 60 },
      offsetX: 0,
      offsetY: 0,
      data: null
    };

    let table;
    let years = [];
    let counts = [];

    new p5(function (p) {
        p.preload = () => {
            table = p.loadTable("data/swimming_participation.csv", "csv", "header");
        }

        p.setup = function()  {
            const canvas = p.createCanvas(700, 400);
            canvas.parent("viz_participation");

            for (let r = 0; r < table.getRowCount(); r++) {
                years.push(table.getNum(r, "Year"));
                counts.push(table.getNum(r, "Athlete"));
            }
        }

        p.draw = function () {
            p.clear();
            p.background(0);
        
            let margin = 60;
        
            let minYear = Math.min(...years);
            let maxYear = Math.max(...years);
            let minCount = Math.min(...counts);
            let maxCount = Math.max(...counts);
        
            p.stroke(255);
            p.strokeWeight(2)
            p.line(margin, p.height - margin, p.width - margin, p.height - margin);  
            p.line(margin, margin, margin, p.height - margin); 

            p.noFill();
            p.stroke(0, 100, 255);
            p.beginShape();
            for (let i = 0; i < years.length; i++) {
                let x = p.map(years[i], minYear, maxYear, margin, p.width - margin);
                let y = p.map(counts[i], minCount, maxCount,p.height - margin, margin);
                p.vertex(x, y);
            }
            p.endShape();

            // fill(0, 100, 255);
            // noStroke();
            // for (let i = 0; i < years.length; i++) {
            // let x = map(years[i], minYear, maxYear, margin, width - margin);
            // let y = map(counts[i], minCount, maxCount, height - margin, margin);
            // circle(x, y, 6);
            // }
        };
    });

    if (typeof window.sketch_manager !== "undefined") {
        window.sketch_manager.register("viz_participation", manager);
    }
})();
