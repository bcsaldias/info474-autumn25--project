(function () {
    window.VizJustice = {
        draw: function (p, manager, ai, progress) {
            p.push();
            p.background(255);

            // Canvas/manager values
            let w = manager.width || 1000;
            let minSpacing = 36; // increased spacing between rows
            let topMargin = 150;
            let bottomMargin = 110;
            let leftMargin = 260;
            let rightMargin = 50;

            // DATA
            const rawData = [
                ["Connecticut", 331, 89], ["Delaware", 105, 87], ["Iowa", 289, 85],
                ["Michigan", 1179, 85], ["Maryland", 623, 85], ["Missouri", 764, 84],
                ["Oklahoma", 636, 84], ["Tennessee", 976, 84], ["Nevada", 396, 84],
                ["Louisiana", 931, 83], ["Hawaii", 166, 83], ["New York", 2727, 82],
                ["Alaska", 90, 81], ["Ohio", 1511, 81], ["Alabama", 825, 81],
                ["South Dakota", 95, 80], ["Idaho", 167, 79], ["Montana", 111, 79],
                ["New Hampshire", 79, 79], ["Nebraska", 181, 78], ["Virginia", 861, 77],
                ["Colorado", 510, 76], ["Minnesota", 454, 76], ["Arizona", 899, 74],
                ["Utah", 214, 74], ["North Carolina", 1449, 74], ["Indiana", 720, 73],
                ["Florida", 3263, 73], ["New Jersey", 830, 72], ["Georgia", 1709, 72],
                ["Kansas", 273, 70], ["South Carolina", 780, 69], ["Texas", 4161, 69],
                ["California", 5403, 66], ["North Dakota", 57, 66], ["Kentucky", 705, 65],
                ["Arkansas", 515, 62], ["Mississippi", 675, 62], ["Wyoming", 50, 49],
                ["United States", 42186, 78]
            ];

            const dataAll = rawData.map(d => ({
                state: d[0],
                eligiblePeople: d[1],
                eligible: 100,
                participating: d[2],
                gap: 100 - d[2]
            }));

            dataAll.sort((a, b) => b.gap - a.gap);

            const filteredStates = dataAll.filter(d => d.state !== "United States").slice(0, 14);
            const usRow = dataAll.find(d => d.state === "United States");
            const data = [...filteredStates, usRow];

            let chartHeight = Math.max(data.length * minSpacing, manager.height || 700);
            let chartH = chartHeight - topMargin - bottomMargin;
            let spacing = chartH / data.length;

            // Title (unchanged)
            p.fill(0);
            p.textAlign(p.CENTER);
            p.textSize(22);
            p.text("How Many People Are Eligible for SNAP?", w / 2 + 75, 32);
            p.text("How many Participated?", w / 2 + 75, 57);
            p.textSize(14);
            p.text("Gap = Eligible but not participating", w / 2 + 75, 77);

            // Column Headers (larger)
            p.textSize(16);
            let headerY = topMargin - 35;
            p.textAlign(p.CENTER);
            p.text("Eligible People", leftMargin - 95, headerY);
            p.text("(Thousands)", leftMargin - 95, headerY + 18); // slightly more spacing for 2-line
            p.text("State", leftMargin - 5, headerY);
            p.textAlign(p.LEFT);
            p.text("Participation Rate (%)", leftMargin + 145, headerY);

            // Dumbbell Chart
            let chartW = w - leftMargin - rightMargin;

            data.forEach((d, i) => {
                let y = topMargin + i * spacing;

                let xEligible = leftMargin + (d.eligible / 100) * chartW;
                let xParticipating = leftMargin + (d.participating / 100) * chartW;

                // Gap line
                p.stroke(220, 50, 50, 180);
                p.strokeWeight(4); // thicker for visibility
                p.line(xParticipating, y, xEligible, y);

                // Eligible dot
                p.noStroke();
                p.fill(150, 150, 150, 180);
                p.ellipse(xEligible, y, 13, 13); // bigger
                // Participating dot
                p.fill(50, 180, 50, 200);
                p.ellipse(xParticipating, y, 13, 13); // bigger

                // Labels (larger)
                p.fill(0);
                p.textSize(12);
                p.textAlign(p.RIGHT);
                p.text(d.participating + "%", xParticipating - 8, y + 5);
                p.text(d.eligiblePeople.toLocaleString() + "k", leftMargin - 85, y + 5);
                p.textAlign(p.LEFT);
                p.textSize(14);
                p.text(d.state, leftMargin - 32, y + 5);
            });

            // X-axis (slightly larger)
            p.stroke(0);
            p.strokeWeight(1);
            for (let i = 0; i <= 5; i++) {
                let val = i * 20;
                let x = leftMargin + (val / 100) * chartW;
                p.line(x, chartHeight - bottomMargin + 5, x, chartHeight - bottomMargin - 5);
                p.noStroke();
                p.fill(0);
                p.textSize(14);
                p.textAlign(p.CENTER);
                p.text(val + "%", x, chartHeight - bottomMargin + 28);
                p.stroke(0);
            }
            p.noStroke();
            p.textSize(16);
            p.textAlign(p.CENTER);
            p.text("Participation Percentage (%)", w / 2 + 75, chartHeight - bottomMargin + 60);

            // Legend (slightly bigger)
            let legendX = w - rightMargin + 25;
            let legendY = topMargin - 20;
            p.fill(150, 150, 150, 180);
            p.ellipse(legendX, legendY, 16, 16);
            p.fill(0);
            p.textAlign(p.LEFT);
            p.textSize(14);
            p.text("Eligible (100%)", legendX + 18, legendY + 5);
            p.fill(50, 180, 50, 200);
            p.ellipse(legendX, legendY + 25, 16, 16);
            p.fill(0);
            p.text("Participating", legendX + 18, legendY + 29);
            p.stroke(220, 50, 50, 180);
            p.strokeWeight(4);
            p.line(legendX, legendY + 50, legendX + 18, legendY + 50);
            p.noStroke();
            p.fill(0);
            p.text("Gap", legendX + 28, legendY + 54);

            p.pop();
        }
    };
})();
