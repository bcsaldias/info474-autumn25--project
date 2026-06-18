(function () {
  let payData = null;

  const W = 920, H = 580;
  const FONT = "'Inter', sans-serif";
  const M = { left: 70, right: 40, top: 110, bottom: 55 };

  const SERIES = [
    { key: 'Productivity-index', label: 'Productivity', color: '#2DA3EE' },
    { key: 'Pay-index',          label: 'Real Pay',     color: '#F4A261' },
    { key: 'cpi-index',          label: 'CPI (Prices)', color: '#ffffff' },
  ];

  window.VizPayIndex = {
    preload: function (p) {
      p.loadTable('data/pay.csv', 'csv', 'header', function (table) {
        payData = [];
        for (let r = 0; r < table.getRowCount(); r++) {
          let q = table.getString(r, 'quarter');
          let row = { t: _qt(q), quarter: q };
          for (let s of SERIES) row[s.key] = parseFloat(table.getString(r, s.key));
          if (!isNaN(row.t) && !isNaN(row[SERIES[0].key])) payData.push(row);
        }
      });
    },

    draw: function (p, manager, ai, progress) {
      let cw = manager.canvasWidth || W;
      let ch = manager.canvasHeight || H;
      let sc = Math.min(cw / W, ch / H);
      let tx = (cw - W * sc) / 2;
      let ty = (ch - H * sc) / 2;

      p.background(0);

      if (!payData || payData.length === 0) {
        p.fill(180); p.noStroke(); p.textFont(FONT); p.textSize(14);
        p.textAlign(p.CENTER, p.CENTER);
        p.text('Loading…', cw / 2, ch / 2);
        return;
      }

      let mx = (p.mouseX - tx) / sc;
      let my = (p.mouseY - ty) / sc;

      p.push();
      p.translate(tx, ty);
      p.scale(sc);

      _drawTitle(p);
      _drawChart(p, payData, mx, my);

      p.pop();
    }
  };

  // ── helpers ───────────────────────────────────────────────────────────────

  function _qt(q) {
    return parseInt(q.substring(0, 4)) + (parseInt(q.charAt(5)) - 1) * 0.25;
  }

  function _drawTitle(p) {
    p.noStroke();
    p.fill('#e8e8e8'); p.textFont(FONT); p.textStyle(p.BOLD); p.textSize(20);
    p.textAlign(p.LEFT, p.TOP);
    p.text('Productivity, Pay, and Prices Index (1999 Q1 = 100)', M.left, 18);
    p.fill('#aaaaaa'); p.textStyle(p.NORMAL); p.textSize(12);
    p.text('Quarterly index — Washington nonfarm business sector', M.left, 50);
  }

  function _drawChart(p, data, mx, my) {
    let cx = M.left, cy = M.top;
    let cw = W - M.left - M.right;
    let ch = H - M.top - M.bottom;

    let allVals = data.flatMap(d => SERIES.map(s => d[s.key])).filter(v => !isNaN(v));
    let vMin = Math.floor(Math.min(...allVals) / 10) * 10;
    let vMax = Math.ceil(Math.max(...allVals) / 10) * 10;
    let tMin = data[0].t;
    let tMax = data[data.length - 1].t;

    function xp(t) { return cx + p.map(t, tMin, tMax, 0, cw); }
    function yp(v) { return cy + p.map(v, vMax, vMin, 0, ch); }

    // Axes (no gridlines)
    p.stroke(70); p.strokeWeight(1.5);
    p.line(cx, cy, cx, cy + ch);
    p.line(cx, cy + ch, cx + cw, cy + ch);

    // Y-axis tick labels
    p.textFont(FONT); p.textStyle(p.NORMAL); p.textSize(11); p.noStroke();
    for (let i = 0; i <= 6; i++) {
      let v = vMin + (vMax - vMin) * i / 6;
      p.fill(160); p.textAlign(p.RIGHT, p.CENTER);
      p.text(Math.round(v), cx - 8, yp(v));
    }

    // X-axis year labels + tick marks
    p.textAlign(p.CENTER, p.TOP);
    for (let yr = 2000; yr <= 2025; yr += 5) {
      let xx = xp(yr);
      p.fill(160); p.text(yr, xx, cy + ch + 8);
      p.stroke(70); p.strokeWeight(1); p.line(xx, cy + ch, xx, cy + ch + 5);
    }

    // Baseline at 100
    p.stroke(55); p.strokeWeight(1);
    p.drawingContext.setLineDash([5, 4]);
    p.line(cx, yp(100), cx + cw, yp(100));
    p.drawingContext.setLineDash([]);
    p.noStroke(); p.fill(80); p.textSize(10); p.textAlign(p.LEFT, p.CENTER);
    p.text('100', cx + 5, yp(100) - 8);

    // Three lines
    for (let s of SERIES) {
      p.stroke(s.color); p.strokeWeight(2.5); p.noFill();
      p.beginShape();
      for (let d of data) {
        if (!isNaN(d[s.key])) p.vertex(xp(d.t), yp(d[s.key]));
      }
      p.endShape();
    }

    // End-of-line value labels
    let last = data[data.length - 1];
    for (let s of SERIES) {
      p.noStroke(); p.fill(s.color);
      p.textFont(FONT); p.textStyle(p.NORMAL); p.textSize(11);
      p.textAlign(p.LEFT, p.CENTER);
      p.text(last[s.key].toFixed(1), xp(last.t) + 6, yp(last[s.key]));
    }

    _drawLegend(p, cx, cy);
    _drawTooltip(p, data, mx, my, cx, cy, cw, ch, xp, yp, tMin, tMax);
  }

  function _drawLegend(p, cx, cy) {
    let lx = cx, ly = cy - 38;
    p.textFont(FONT); p.textStyle(p.NORMAL); p.textSize(11);
    let offset = 0;
    for (let s of SERIES) {
      p.stroke(s.color); p.strokeWeight(2.5);
      p.line(lx + offset, ly + 6, lx + offset + 22, ly + 6);
      p.noStroke(); p.fill(200);
      p.textAlign(p.LEFT, p.CENTER);
      p.text(s.label, lx + offset + 28, ly + 6);
      offset += 28 + p.textWidth(s.label) + 24;
    }
  }

  function _drawTooltip(p, data, mx, my, cx, cy, cw, ch, xp, yp, tMin, tMax) {
    if (mx < cx || mx > cx + cw || my < cy || my > cy + ch) return;

    let t = p.map(mx, cx, cx + cw, tMin, tMax);
    let nearest = data.reduce((a, b) => Math.abs(b.t - t) < Math.abs(a.t - t) ? b : a);
    let xx = xp(nearest.t);

    // Vertical crosshair
    p.stroke(80); p.strokeWeight(1);
    p.line(xx, cy, xx, cy + ch);

    // Dots on each line
    for (let s of SERIES) {
      p.fill(s.color); p.noStroke(); p.ellipse(xx, yp(nearest[s.key]), 8, 8);
    }

    // Tooltip box
    let TW = 200, TH = 26 + SERIES.length * 18;
    let ttx = mx + 14, tty = my - TH / 2;
    ttx = Math.min(ttx, W - TW - 8); ttx = Math.max(ttx, 8);
    tty = Math.max(tty, 8);          tty = Math.min(tty, H - TH - 8);

    p.noStroke(); p.fill(18, 18, 18, 230); p.rect(ttx, tty, TW, TH, 6);
    p.stroke(70); p.strokeWeight(1); p.noFill(); p.rect(ttx, tty, TW, TH, 6);

    let lx = ttx + 12;
    p.noStroke(); p.textFont(FONT); p.textAlign(p.LEFT, p.TOP);
    p.fill('#e8e8e8'); p.textStyle(p.BOLD); p.textSize(12);
    p.text(nearest.quarter.toUpperCase(), lx, tty + 10);

    p.textStyle(p.NORMAL); p.textSize(11);
    for (let j = 0; j < SERIES.length; j++) {
      let s = SERIES[j];
      p.fill(s.color);
      p.text(s.label + ':  ' + nearest[s.key].toFixed(1), lx, tty + 10 + (j + 1) * 18);
    }
  }
})();
