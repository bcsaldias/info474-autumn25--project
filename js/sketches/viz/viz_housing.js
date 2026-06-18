(function () {
  let housingData = null;

  const W = 920, H = 580;
  const FONT = "'Inter', sans-serif";
  const M = { left: 80, right: 100, top: 110, bottom: 90 };

  window.VizHousing = {
    preload: function (p) {
      p.loadTable(
        'data/Income by Housing Problems Renters only.csv',
        'csv', 'header',
        function (table) { housingData = _parse(table); }
      );
    },

    draw: function (p, manager, ai, progress) {
      let cw = manager.canvasWidth || W;
      let ch = manager.canvasHeight || H;
      let sc = Math.min(cw / W, ch / H);
      let tx = (cw - W * sc) / 2;
      let ty = (ch - H * sc) / 2;

      p.background(0);

      if (!housingData || housingData.length === 0) {
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
      _drawChart(p, housingData, mx, my);

      p.pop();
    }
  };

  // ── data parsing ──────────────────────────────────────────────────────────

  function _parse(table) {
    let data = [];
    for (let r = 0; r < table.getRowCount(); r++) {
      let year  = table.getString(r, 'Year (Cost burden > 50% )');
      let low   = _num(table.getString(r, '<80% HAMFI'));
      let mid   = _num(table.getString(r, '80-100% HAMFI'));
      let high  = _num(table.getString(r, '>100% HAMFI'));
      let total = _num(table.getString(r, 'Total'));
      if (year && total > 0) {
        data.push({ year, low, mid, high, total,
          lowPct: low / total, midPct: mid / total, highPct: high / total });
      }
    }
    return data;
  }

  function _num(v) { return Number(String(v).replace(/,/g, '')); }

  function _fmt(n) { return n.toLocaleString(); }

  // ── drawing helpers ───────────────────────────────────────────────────────

  function _drawTitle(p) {
    p.noStroke();
    p.fill('#e8e8e8'); p.textFont(FONT); p.textStyle(p.BOLD); p.textSize(20);
    p.textAlign(p.LEFT, p.TOP);
    p.text('Households with Severe Cost Burden (>50% income on rent)', M.left, 18);
    p.fill('#aaaaaa'); p.textStyle(p.NORMAL); p.textSize(12);
    p.text('Stacked bars = income group share — line = total renter households affected (WA State)', M.left, 50);
  }

  function _drawChart(p, data, mx, my) {
    let cx = M.left, cy = M.top;
    let cw = W - M.left - M.right;
    let ch = H - M.top - M.bottom;

    let maxTotal = Math.max(...data.map(d => d.total));
    let minTotal = Math.min(...data.map(d => d.total));
    let tMin = Math.floor(minTotal / 50000) * 50000;
    let tMax = Math.ceil(maxTotal / 50000) * 50000;

    let barGap = 10;
    let barW = cw / data.length - barGap;

    _drawAxes(p, cx, cy, cw, ch, tMin, tMax);
    _drawBars(p, data, cx, cy, cw, ch, barW, barGap);
    _drawLine(p, data, cx, cy, cw, ch, barW, barGap, tMin, tMax);
    _drawLegend(p, cx, cy);
    _drawTooltip(p, data, mx, my, cx, cy, cw, ch, barW, barGap);

    p.noStroke(); p.fill(100);
    p.textFont(FONT); p.textStyle(p.NORMAL); p.textSize(9);
    p.textAlign(p.RIGHT, p.BOTTOM);
    p.text('Source: HUD CHAS 5-year ACS estimates, Washington State renters', W - M.right, H - 4);
  }

  function _drawAxes(p, x, y, w, h, tMin, tMax) {
    p.stroke(70); p.strokeWeight(1.5);
    p.line(x, y + h, x + w, y + h);
    p.line(x, y, x, y + h);
    p.line(x + w, y, x + w, y + h);

    p.textFont(FONT); p.textStyle(p.NORMAL); p.textSize(11);

    for (let i = 0; i <= 5; i++) {
      let pct = i / 5;
      let yy = p.map(pct, 0, 1, y + h, y);
      p.stroke(45); p.strokeWeight(1);
      p.line(x, yy, x + w, yy);
      p.noStroke(); p.fill(160);
      p.textAlign(p.RIGHT, p.CENTER);
      p.text(Math.round(pct * 100) + '%', x - 8, yy);
    }

    for (let i = 0; i <= 5; i++) {
      let val = p.map(i, 0, 5, tMin, tMax);
      let yy  = p.map(val, tMin, tMax, y + h, y);
      p.noStroke(); p.fill(160);
      p.textAlign(p.LEFT, p.CENTER);
      p.text(_fmt(Math.round(val)), x + w + 8, yy);
    }

    p.push();
    p.translate(22, y + h / 2); p.rotate(-p.HALF_PI);
    p.textAlign(p.CENTER, p.CENTER); p.fill(120); p.textSize(11);
    p.text('Share of households', 0, 0);
    p.pop();

    p.push();
    p.translate(W - 18, y + h / 2); p.rotate(p.HALF_PI);
    p.textAlign(p.CENTER, p.CENTER); p.fill(120); p.textSize(11);
    p.text('Total households', 0, 0);
    p.pop();
  }

  function _drawBars(p, data, x, y, _w, h, barW, barGap) {
    for (let i = 0; i < data.length; i++) {
      let d = data[i];
      let bx   = x + i * (barW + barGap) + barGap / 2;
      let base = y + h;
      let lowH  = d.lowPct * h;
      let midH  = d.midPct * h;
      let highH = d.highPct * h;

      p.noStroke();
      p.fill('#2DA3EE'); p.rect(bx, base - lowH, barW, lowH);
      p.fill('#F4A261'); p.rect(bx, base - lowH - midH, barW, midH);
      p.fill('#C0C0C0'); p.rect(bx, base - lowH - midH - highH, barW, highH);

      p.fill(160); p.textFont(FONT); p.textStyle(p.NORMAL); p.textSize(9);
      p.textAlign(p.RIGHT, p.CENTER);
      p.push();
      p.translate(bx + barW / 2, y + h + 28);
      p.rotate(-p.PI / 4);
      p.text(d.year, 0, 0);
      p.pop();
    }
  }

  function _drawLine(p, data, x, y, _w, h, barW, barGap, tMin, tMax) {
    p.stroke('#ffffff'); p.strokeWeight(2.5); p.noFill();
    p.beginShape();
    for (let i = 0; i < data.length; i++) {
      let px = x + i * (barW + barGap) + barGap / 2 + barW / 2;
      let py = p.map(data[i].total, tMin, tMax, y + h, y);
      p.vertex(px, py);
    }
    p.endShape();

    for (let i = 0; i < data.length; i++) {
      let px = x + i * (barW + barGap) + barGap / 2 + barW / 2;
      let py = p.map(data[i].total, tMin, tMax, y + h, y);
      p.fill('#ffffff'); p.noStroke(); p.ellipse(px, py, 7, 7);
    }
  }

  function _drawLegend(p, x, y) {
    let lx = x, ly = y - 44;
    p.textFont(FONT); p.textStyle(p.NORMAL); p.textSize(11);
    p.textAlign(p.LEFT, p.CENTER); p.noStroke();

    p.fill('#2DA3EE'); p.rect(lx, ly, 13, 13);
    p.fill(200); p.text('<80% HAMFI (very low income)', lx + 18, ly + 6);

    p.fill('#F4A261'); p.rect(lx + 215, ly, 13, 13);
    p.fill(200); p.text('80–100% HAMFI', lx + 233, ly + 6);

    p.fill('#C0C0C0'); p.rect(lx + 370, ly, 13, 13);
    p.fill(200); p.text('>100% HAMFI', lx + 388, ly + 6);

    p.stroke('#ffffff'); p.strokeWeight(2.5);
    p.line(lx + 495, ly + 6, lx + 518, ly + 6);
    p.noStroke(); p.fill('#ffffff'); p.ellipse(lx + 507, ly + 6, 6, 6);
    p.fill(200); p.text('Total affected', lx + 524, ly + 6);
  }

  function _drawTooltip(p, data, mx, my, cx, cy, cw, ch, barW, barGap) {
    if (mx < cx || mx > cx + cw || my < cy || my > cy + ch) return;

    let i = Math.floor((mx - cx) / (barW + barGap));
    i = Math.max(0, Math.min(data.length - 1, i));
    let d = data[i];

    // Highlight hovered bar column
    let bx = cx + i * (barW + barGap) + barGap / 2;
    p.noStroke(); p.fill(255, 255, 255, 18);
    p.rect(bx - 2, cy, barW + 4, ch);

    // Tooltip box dimensions
    let TW = 230, TH = 112;
    let ttx = mx + 14;
    let tty = my - TH / 2;
    ttx = Math.min(ttx, W - TW - 8);
    ttx = Math.max(ttx, 8);
    tty = Math.max(tty, 8);
    tty = Math.min(tty, H - TH - 8);

    p.noStroke(); p.fill(18, 18, 18, 230);
    p.rect(ttx, tty, TW, TH, 6);
    p.stroke(70); p.strokeWeight(1); p.noFill();
    p.rect(ttx, tty, TW, TH, 6);

    let lx = ttx + 12, lineH = 18;
    p.noStroke(); p.textFont(FONT); p.textAlign(p.LEFT, p.TOP);

    // Year header
    p.fill('#e8e8e8'); p.textStyle(p.BOLD); p.textSize(12);
    p.text(d.year, lx, tty + 10);

    // Total line
    p.textStyle(p.NORMAL); p.textSize(11);
    p.fill(220);
    p.text('Total:  ' + _fmt(d.total), lx, tty + 10 + lineH);

    // Income group rows with color swatches
    let rows = [
      { label: '<80% HAMFI', pct: d.lowPct, count: d.low,  color: '#2DA3EE' },
      { label: '80–100% HAMFI', pct: d.midPct, count: d.mid,  color: '#F4A261' },
      { label: '>100% HAMFI',   pct: d.highPct, count: d.high, color: '#C0C0C0' },
    ];
    for (let j = 0; j < rows.length; j++) {
      let ry = tty + 10 + (j + 2) * lineH;
      p.fill(rows[j].color); p.noStroke(); p.rect(lx, ry + 2, 9, 9, 2);
      p.fill(200);
      p.text(rows[j].label + ':  ' + Math.round(rows[j].pct * 100) + '%  (' + _fmt(rows[j].count) + ')', lx + 14, ry);
    }
  }
})();
