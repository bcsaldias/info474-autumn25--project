(function () {
  let rentData = null;

  const W = 920, H = 580;
  const FONT = "'Inter', sans-serif";
  const M = { left: 80, right: 80, top: 110, bottom: 60 };

  const COL_BAR = '#2DA3EE';   // blue  — Average Rent bars
  const COL_CAP = '#F4A261';   // orange — Cap line
  const COL_YOY = '#ffffff';   // white  — YoY growth

  const HB_T = 2025.5;         // 2025 Q3 = July 2025 (HB 1217 effective date)

  window.VizRentCap = {
    preload: function (p) {
      p.loadTable('data/rent_cap.csv', 'csv', 'header', function (table) {
        rentData = [];
        for (let r = 0; r < table.getRowCount(); r++) {
          let q = table.getString(r, 'year quarter').trim();
          if (!q || q.toLowerCase().includes('grand')) continue;
          let rent = parseFloat(table.getString(r, 'Average Ren'));
          let cap  = parseFloat(table.getString(r, 'Cap Line'));
          let yoy  = parseFloat(table.getString(r, 'rent YoY growth'));
          let t    = _qt(q);
          if (!isNaN(t) && !isNaN(rent)) rentData.push({ q, t, rent, cap, yoy });
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

      if (!rentData || rentData.length === 0) {
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
      _drawChart(p, rentData, mx, my);

      p.pop();
    }
  };

  // ── helpers ───────────────────────────────────────────────────────────────

  function _qt(q) {
    let parts = q.split(' ');
    return parseInt(parts[0]) + (parseInt(parts[1].charAt(1)) - 1) * 0.25;
  }

  function _drawTitle(p) {
    p.noStroke();
    p.fill('#e8e8e8'); p.textFont(FONT); p.textStyle(p.BOLD); p.textSize(20);
    p.textAlign(p.LEFT, p.TOP);
    p.text('Washington Average Rent vs. Growth Rate & Rent Cap', M.left, 18);
  }

  function _drawChart(p, data, mx, my) {
    let cx = M.left, cy = M.top;
    let cw = W - M.left - M.right;
    let ch = H - M.top - M.bottom;

    let tMin = data[0].t, tMax = data[data.length - 1].t;

    // Y ranges
    let rentMax = Math.ceil(Math.max(...data.map(d => d.rent)) / 200) * 200;
    let rentMin = Math.floor(Math.min(...data.map(d => d.rent)) / 200) * 200;

    let pctVals = data.flatMap(d => [d.cap, d.yoy]).filter(v => !isNaN(v));
    let pctMin  = 0;
    let pctMax  = Math.ceil(Math.max(...pctVals) / 0.02) * 0.02;

    function xp(t)     { return cx + p.map(t, tMin, tMax, 0, cw); }
    function yRent(v)  { return cy + p.map(v, rentMax, rentMin, 0, ch); }
    function yPct(v)   { return cy + p.map(v, pctMax, pctMin, 0, ch); }

    let slotW = cw / data.length;
    let barW  = slotW * 0.72;

    // ── bars (Average Rent) ──────────────────────────────────────────────────
    for (let i = 0; i < data.length; i++) {
      let d  = data[i];
      let bx = cx + i * slotW + slotW * 0.14;
      let by = yRent(d.rent);
      let bh = cy + ch - by;
      p.noStroke(); p.fill(45, 163, 238, 55);
      p.rect(bx, by, barW, bh);
    }

    // ── axes ────────────────────────────────────────────────────────────────
    p.stroke(70); p.strokeWeight(1.5);
    p.line(cx, cy, cx, cy + ch);
    p.line(cx, cy + ch, cx + cw, cy + ch);
    p.line(cx + cw, cy, cx + cw, cy + ch);

    p.textFont(FONT); p.textStyle(p.NORMAL); p.textSize(11); p.noStroke();

    // Left Y: rent dollars — highlight the baseline tick to flag truncation
    for (let i = 0; i <= 5; i++) {
      let v  = rentMin + (rentMax - rentMin) * i / 5;
      let yy = yRent(v);
      p.noStroke();
      if (i === 0) {
        // Bold blue tick to signal this is the (truncated) baseline, not $0
        p.fill(COL_BAR); p.textStyle(p.BOLD); p.textSize(12);
      } else {
        p.fill(160); p.textStyle(p.NORMAL); p.textSize(11);
      }
      p.textAlign(p.RIGHT, p.CENTER);
      p.text('$' + Math.round(v).toLocaleString(), cx - 8, yy);
    }

    // Axis-break symbol at the base of the left y-axis (signals "not from $0")
    let breakY = cy + ch;
    p.stroke(100); p.strokeWeight(1.5);
    p.line(cx - 6, breakY - 3, cx + 4, breakY + 3);
    p.line(cx - 2, breakY - 3, cx + 8, breakY + 3);
    // Note left-aligned near the y-axis, within the left margin
    p.noStroke(); p.fill(COL_BAR); p.textFont(FONT); p.textStyle(p.NORMAL); p.textSize(9);
    p.textAlign(p.LEFT, p.TOP);
    p.text('not from $0', 2, breakY + 4);

    // Left y-axis title (rotated)
    p.push();
    p.translate(16, cy + ch / 2);
    p.rotate(-p.HALF_PI);
    p.noStroke(); p.fill(COL_BAR); p.textFont(FONT); p.textStyle(p.NORMAL); p.textSize(12);
    p.textAlign(p.CENTER, p.CENTER);
    p.text('Average Rent (USD)', 0, 0);
    p.pop();

    // Right Y: percentage
    for (let i = 0; i <= 5; i++) {
      let v  = pctMin + (pctMax - pctMin) * i / 5;
      let yy = yPct(v);
      p.noStroke(); p.fill(160); p.textStyle(p.NORMAL); p.textSize(11);
      p.textAlign(p.LEFT, p.CENTER);
      p.text((v * 100).toFixed(0) + '%', cx + cw + 8, yy);
    }

    // Right y-axis title (rotated)
    p.push();
    p.translate(W - 16, cy + ch / 2);
    p.rotate(p.HALF_PI);
    p.noStroke(); p.fill(160); p.textFont(FONT); p.textStyle(p.NORMAL); p.textSize(12);
    p.textAlign(p.CENTER, p.CENTER);
    p.text('Annual Growth Rate (%)', 0, 0);
    p.pop();

    // X-axis year labels
    p.textFont(FONT); p.textStyle(p.NORMAL); p.textSize(11);
    p.textAlign(p.CENTER, p.TOP);
    for (let yr = 2016; yr <= 2026; yr += 2) {
      let xx = xp(yr);
      if (xx < cx || xx > cx + cw) continue;
      p.noStroke(); p.fill(160); p.text(yr, xx, cy + ch + 8);
      p.stroke(70); p.strokeWeight(1);
      p.line(xx, cy + ch, xx, cy + ch + 5);
    }

    // X-axis title
    p.noStroke(); p.fill(160); p.textFont(FONT); p.textStyle(p.NORMAL); p.textSize(12);
    p.textAlign(p.CENTER, p.TOP);
    p.text('Year', cx + cw / 2, cy + ch + 30);

    // ── HB 1217 annotation ──────────────────────────────────────────────────
    const COL_HB = '#e74c3c';
    let hbX = xp(HB_T);
    p.stroke(COL_HB); p.strokeWeight(2);
    p.drawingContext.setLineDash([6, 4]);
    p.line(hbX, cy, hbX, cy + ch);
    p.drawingContext.setLineDash([]);

    p.noStroke(); p.fill(COL_HB);
    p.textFont(FONT); p.textStyle(p.BOLD); p.textSize(14);
    p.textAlign(p.CENTER, p.BOTTOM);
    p.text('HB 1217', hbX, cy - 6);
    p.textStyle(p.NORMAL); p.textSize(11);
    p.text('effective July 2025', hbX, cy - 6 + 16);

    // ── lines ────────────────────────────────────────────────────────────────
    function drawLine(key, col) {
      p.stroke(col); p.strokeWeight(2.5); p.noFill();
      p.beginShape();
      for (let d of data) {
        if (!isNaN(d[key])) p.vertex(xp(d.t), yPct(d[key]));
      }
      p.endShape();
    }
    drawLine('cap', COL_CAP);
    drawLine('yoy', COL_YOY);

    // End-of-line labels
    let last = data[data.length - 1];
    p.noStroke(); p.textFont(FONT); p.textStyle(p.NORMAL); p.textSize(11);
    p.textAlign(p.RIGHT, p.CENTER);
    p.fill(COL_CAP); p.text((last.cap * 100).toFixed(1) + '%', cx + cw - 2, yPct(last.cap) - 8);
    p.fill(COL_YOY); p.text((last.yoy * 100).toFixed(1) + '%', cx + cw - 2, yPct(last.yoy) + 8);

    // ── legend ───────────────────────────────────────────────────────────────
    _drawLegend(p, cx, cy);

    // ── tooltip ──────────────────────────────────────────────────────────────
    _drawTooltip(p, data, mx, my, cx, cy, cw, ch, xp, yRent, yPct, tMin, tMax);
  }

  function _drawLegend(p, cx, cy) {
    let items = [
      { label: 'Average Rent',  color: COL_BAR, bar: true },
      { label: 'Cap Line',      color: COL_CAP, bar: false },
      { label: 'Rent YoY Growth', color: COL_YOY, bar: false },
    ];
    let lx = cx, ly = cy - 38;
    p.textFont(FONT); p.textStyle(p.NORMAL); p.textSize(11);
    let offset = 0;
    for (let item of items) {
      if (item.bar) {
        p.noStroke(); p.fill(45, 163, 238, 140);
        p.rect(lx + offset, ly, 18, 13, 2);
      } else {
        p.stroke(item.color); p.strokeWeight(2.5);
        p.line(lx + offset, ly + 6, lx + offset + 18, ly + 6);
      }
      p.noStroke(); p.fill(200); p.textAlign(p.LEFT, p.CENTER);
      p.text(item.label, lx + offset + 24, ly + 6);
      offset += 24 + p.textWidth(item.label) + 20;
    }
  }

  function _drawTooltip(p, data, mx, my, cx, cy, cw, ch, xp, yRent, yPct, tMin, tMax) {
    if (mx < cx || mx > cx + cw || my < cy || my > cy + ch) return;

    let t = p.map(mx, cx, cx + cw, tMin, tMax);
    let d = data.reduce((a, b) => Math.abs(b.t - t) < Math.abs(a.t - t) ? b : a);
    let xx = xp(d.t);

    // Crosshair
    p.stroke(80); p.strokeWeight(1);
    p.line(xx, cy, xx, cy + ch);

    // Dots on lines
    p.fill(COL_CAP); p.noStroke(); p.ellipse(xx, yPct(d.cap), 8, 8);
    p.fill(COL_YOY); p.noStroke(); p.ellipse(xx, yPct(d.yoy), 8, 8);

    // Tooltip box
    let TW = 210, TH = 88;
    let ttx = mx + 14, tty = my - TH / 2;
    ttx = Math.min(ttx, W - TW - 8); ttx = Math.max(ttx, 8);
    tty = Math.max(tty, 8);          tty = Math.min(tty, H - TH - 8);

    p.noStroke(); p.fill(18, 18, 18, 230); p.rect(ttx, tty, TW, TH, 6);
    p.stroke(70); p.strokeWeight(1); p.noFill(); p.rect(ttx, tty, TW, TH, 6);

    let lx = ttx + 12, lineH = 18;
    p.noStroke(); p.textFont(FONT); p.textAlign(p.LEFT, p.TOP);
    p.fill('#e8e8e8'); p.textStyle(p.BOLD); p.textSize(12);
    p.text(d.q, lx, tty + 10);

    p.textStyle(p.NORMAL); p.textSize(11);
    p.fill(COL_BAR);
    p.text('Avg Rent:  $' + Math.round(d.rent).toLocaleString(), lx, tty + 10 + lineH);
    p.fill(COL_CAP);
    p.text('Cap Line:  ' + (d.cap * 100).toFixed(2) + '%', lx, tty + 10 + lineH * 2);
    p.fill(COL_YOY);
    p.text('YoY Growth:  ' + (d.yoy * 100).toFixed(2) + '%', lx, tty + 10 + lineH * 3);
  }
})();
