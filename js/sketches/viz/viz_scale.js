(function () {
window.VizJustice = {
draw: function (p, manager, ai, progress) {
p.push();
p.background(255);

        // Canvas/manager values
        let w = manager.width || 1000;
        let minSpacing = 26; // minimum vertical spacing per state (slightly larger for readability)
        let topMargin = 120; // increase top margin to avoid title/legend overlap
        let bottomMargin = 110; // increase bottom margin so x-axis labels don't collide with data
        let leftMargin = 220; // more left space for state labels
        let rightMargin = 50;
        // --- DATA ---
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

        // Compute participation gap
        const data = rawData.slice().map(d => ({
            state: d[0],
            eligible: 100,
            participating: d[2],
            gap: 100 - d[2]
        }));

        // Sort by gap descending
        data.sort((a, b) => b.gap - a.gap);

        // Compute chart height dynamically
        let chartHeight = Math.max(data.length * minSpacing, manager.height || 700);
        let chartH = chartHeight - topMargin - bottomMargin;
        let spacing = chartH / data.length;

        // --- Title ---
        p.fill(0);
        p.textAlign(p.CENTER);
        p.textSize(22);
        p.text("Food Aid Participation Gaps Across States", w / 2, 32);
        p.textSize(14);
        p.text("Gap = Eligible but not participating", w / 2, 55);

        // --- Draw dumbbells ---
        let chartW = w - leftMargin - rightMargin;

        data.forEach((d, i) => {
            let y = topMargin + i * spacing;

            let xEligible = leftMargin + (d.eligible / 100) * chartW;
            let xParticipating = leftMargin + (d.participating / 100) * chartW;

            // Gap line
            p.stroke(220, 50, 50, 180);
            p.strokeWeight(3);
            p.line(xParticipating, y, xEligible, y);

            // Eligible dot
            p.noStroke();
            p.fill(150, 150, 150, 180);
            p.ellipse(xEligible, y, 12, 12);
            // Participating dot
            p.fill(50, 180, 50, 200);
            p.ellipse(xParticipating, y, 12, 12);

            // Participation % label (place to the left of the participating dot)
            p.fill(0);
            p.textSize(9);
            p.textAlign(p.RIGHT);
            p.text(d.participating + "%", xParticipating - 6, y + 3);

            // State label
            p.textAlign(p.RIGHT);
            p.text(d.state, leftMargin - 15, y + 3);
        });

        // --- X-axis ---
        p.stroke(0);
        p.strokeWeight(1);
        for (let i = 0; i <= 5; i++) {
            let val = i * 20;
            let x = leftMargin + (val / 100) * chartW;
            p.line(x, chartHeight - bottomMargin + 5, x, chartHeight - bottomMargin - 5);
            p.noStroke();
            p.fill(0);
            p.textSize(11);
            p.textAlign(p.CENTER);
            p.text(val + "%", x, chartHeight - bottomMargin + 28);
            p.stroke(0);
        }
        p.noStroke();
        p.textSize(14);
        p.textAlign(p.CENTER);
        p.text("Participation Percentage (%)", w / 2, chartHeight - bottomMargin + 40);

        // --- Legend ---
        // Place legend to the right of the chart area so it doesn't overlap the data
        let legendX = w - rightMargin + 25;
        let legendY = topMargin - 20;
        // Eligible
        p.fill(150, 150, 150, 180);
        p.ellipse(legendX, legendY, 12, 12);
        p.fill(0);
        p.textAlign(p.LEFT);
        p.text("Eligible (100%)", legendX + 15, legendY + 4);
        // Participating
        p.fill(50, 180, 50, 200);
        p.ellipse(legendX, legendY + 20, 12, 12);
        p.fill(0);
        p.text("Participating", legendX + 15, legendY + 24);
        // Gap
        p.stroke(220, 50, 50, 180);
        p.strokeWeight(3);
        p.line(legendX, legendY + 40, legendX + 15, legendY + 40);
        p.noStroke();
        p.fill(0);
        p.text("Gap", legendX + 25, legendY + 44);

        p.pop();
    }
};

})();
