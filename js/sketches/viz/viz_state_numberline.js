// Number line to show state comparison level for FI.
// Each state is drawn as a colored outline at its 2023 child food-insecurity rat similar to next vis.
// States are in rows to avoid overlap. 
(function () {
  // helper
  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
  function toPct(x){ if(x==null || x==='') return null; let v=Number(x); if(!isFinite(v)) return null; if(v<=1) v*=100; return v; }
  function fmtPctExact(x){ if(x==null || !isFinite(x)) return ''; return x.toFixed(1) + '%'; }
  function defaultPalette(){ return ['#f7fbff','#deebf7','#c6dbef','#9ecae1','#6baed6','#3182bd','#08519c']; }
  function colorFor(rate, thresholds, palette){
    if(rate==null) return '#e6eef7';
    for(let i=thresholds.length-1;i>=0;i--){ if(rate>=thresholds[i]) return palette[Math.min(i+1, palette.length-1)]; }
    return palette[0];
  }
  function drawTooltip(p, txt, x, y, left, top, W, H){
    p.textSize(12);
    const pad=6, th=18, tw=p.textWidth(txt)+pad*2;
    let tx=x+10, ty=y-14; tx=clamp(tx, left+2, left+W-tw-2); ty=clamp(ty, top+2, top+H-th-2);
    p.noStroke(); p.fill(20,20,20,220); p.rect(tx, ty, tw, th, 3);
    p.fill(255); p.textAlign(p.LEFT, p.CENTER); p.text(txt, tx+pad, ty+th/2);
  }
  //legend
function drawLegendRamp(p, x, y, thresholds, palette, xMax){
  const caption = 'Lower → Higher child food insecurity';
  const n = palette.length, boxW = 22, boxH = 12, gap = 4;

  p.textSize(12);
  const capW  = p.textWidth(caption);
  const rampW = (n * boxW) + ((n - 1) * gap);
  const needW = Math.max(capW, rampW);
  const x0    = Math.min(x, xMax - needW);

  // caption
  p.textAlign(p.LEFT, p.BOTTOM);
  p.fill(40);
  p.text(caption, x0, y - 6);

  // color boxes 
  let cx = x0;
  for (let i = 0; i < n; i++) {
    p.noStroke(); p.fill(palette[i]); p.rect(cx, y, boxW, boxH, 2);
    cx += boxW + gap;
  }
}

//   axes
  const LINE_MIN = 13;
  const LINE_MAX = 24;

  window.VizStateNumberLine = {
    draw: function (p, manager) {
      p.push();

      const left   = (manager.offsetX||20);
      const top    = (manager.offsetY||0) + 6;
      const W      = Math.max(360, manager.width  || (p.width  - left - 10));
      const H      = Math.max(260, manager.height || (p.height - top  - 10));

      const bottomPad = 28;
      const baseY     = top + H - bottomPad;

      const stateDataUrl  = manager.stateDataUrl  || 'data/state_child_fi_2023.csv';
      const topoStatesUrl = manager.topoStatesUrl || 'data/us-states-10m.json';

      const thresholds = manager.mapThresholds || [8,12,16,20,24,28];
      const palette    = manager.palette || defaultPalette();

      if (!manager._sn_statesTopo && !manager._sn_statesTopoLoading && !manager._sn_statesTopoErr) {
        manager._sn_statesTopoLoading = true;
        p.loadJSON(topoStatesUrl,
          (json)=>{ manager._sn_statesTopo=json; manager._sn_statesTopoLoading=false; manager._sn_statesGeo=null; },
          ()=>{ manager._sn_statesTopoErr=true; manager._sn_statesTopoLoading=false; });
      }
      if (manager._sn_statesTopo && !manager._sn_statesGeo) {
        manager._sn_statesGeo = topojson.feature(manager._sn_statesTopo, manager._sn_statesTopo.objects.states);
        manager._sn_stateFeat = new Map();
        for (const f of manager._sn_statesGeo.features) {
          manager._sn_stateFeat.set(String(f.id).padStart(2,'0'), f);
        }
      }

      if (!manager._sn_table && !manager._sn_loading && !manager._sn_error) {
        manager._sn_loading = true;
        p.loadTable(stateDataUrl, 'csv', 'header',
          (t)=>{ manager._sn_table=t; manager._sn_loading=false; manager._sn_points=null; },
          ()=>{ manager._sn_error=true; manager._sn_loading=false; });
      }

      if (manager._sn_table && !manager._sn_points && manager._sn_stateFeat) {
        const cols = manager._sn_table.columns || [];
        const fCol = cols.includes('state_fips') ? 'state_fips' : (cols.includes('FIPS') ? 'FIPS' : cols[0]);
        const rCol = cols.includes('child_fi_rate') ? 'child_fi_rate' : (cols.includes('fi_rate') ? 'fi_rate' : cols[1]);
        const nCol = cols.includes('state') ? 'state' : (cols.includes('State Name') ? 'State Name' : null);

        const pts = [];
        for (let i=0;i<manager._sn_table.getRowCount();i++){
          const fips = String(manager._sn_table.getString(i, fCol)).padStart(2,'0');
          const rate = toPct(manager._sn_table.getString(i, rCol));
          if (!isFinite(rate)) continue;
          const name = nCol ? manager._sn_table.getString(i, nCol) : (FIPS2ABBR[fips]||fips);
          const feat = manager._sn_stateFeat.get(fips);
          if (!feat) continue;
          pts.push({ fips, name, rate, feature: feat });
        }
        manager._sn_points = pts.sort((a,b)=>a.rate-b.rate);
      }

      if (!manager._sn_points || !manager._sn_statesGeo) {
        p.noStroke(); p.fill(80); p.textAlign(p.LEFT, p.TOP); p.textSize(14);
        p.text('Loading state outlines…', left, top);
        p.pop(); return;
      }

      const domain = [LINE_MIN, LINE_MAX];
      const padX   = 28;
      const x1     = left + padX;
      const x2     = left + W - padX;
      const scaleX = (v)=> x1 + ( (clamp(v, domain[0], domain[1]) - domain[0]) / (domain[1]-domain[0]) ) * (x2 - x1);

      // Title 
      p.noStroke(); p.fill(30); p.textAlign(p.LEFT, p.TOP); p.textSize(16);
      p.text('Child Food Insecurity Comparisons by State (2023)', left, top - 1);

      p.stroke(30); p.strokeWeight(1.5);
      p.line(x1, baseY, x2, baseY);
      const ah = 7;
      p.noStroke(); p.fill(30);
      p.triangle(x2, baseY, x2-ah, baseY-ah*0.9, x2-ah, baseY+ah*0.9);

      p.fill(60); p.textAlign(p.CENTER, p.TOP); p.textSize(12);
      p.text(domain[0]+'%', x1, baseY+6);
      p.text(domain[1]+'%', x2, baseY+6);

      let iconW = 80, iconH = 60; 
      const laneGap = 4; 
      const axisPad = 8;
      const availableUp = baseY - top - 56;

      function packAndMeasure(bw, bh) {
        const laneRight = [];
        const laneMaxH  = [];
        const placed    = [];
        for (const d of manager._sn_points) {
          const cx = scaleX(d.rate);
          let lane = 0;
          while (true) {
            const lastEdge = laneRight[lane];
            if (lastEdge == null || (cx - bw/2) >= (lastEdge + 2)) {
              laneRight[lane] = cx + bw/2;
              laneMaxH[lane]  = Math.max(laneMaxH[lane]||0, bh);
              placed.push({ ...d, cx, iw:bw, ih:bh, lane });
              break;
            }
            lane++;
            if (lane > 200) { laneRight[0] = cx + bw/2; laneMaxH[0] = Math.max(laneMaxH[0]||0, bh); placed.push({ ...d, cx, iw:bw, ih:bh, lane:0 }); break; }
          }
        }
        const totalHeight = (laneMaxH.reduce((s,h)=>s+h,0)) + Math.max(0, (laneMaxH.length-1)*laneGap);
        return { placed, laneMaxH, lanes: laneMaxH.length, totalHeight };
      }

      let L = packAndMeasure(iconW, iconH);
      if (L.totalHeight > availableUp && availableUp > 0) {
        const g = clamp(availableUp / L.totalHeight, 0.55, 1.0);
        iconW = Math.max(22, Math.floor(iconW * g));
        iconH = Math.max(18, Math.floor(iconH * g));
        L = packAndMeasure(iconW, iconH);
      }

      const laneTop = [];
      let y = baseY - axisPad;
      for (let i=0;i<L.laneMaxH.length;i++){
        y -= L.laneMaxH[i];
        laneTop[i] = y;
        y -= laneGap;
      }

      // drawing states
      const ctx = p.drawingContext;
      let hover = null;

      for (const d of L.placed) {
        const cyTop  = laneTop[d.lane] + (L.laneMaxH[d.lane] - d.ih); // bottom-align in lane
        const cxLeft = d.cx - d.iw/2;

        const projIcon = d3.geoMercator().fitSize([d.iw, d.ih], d.feature);
        const pathIcon = d3.geoPath(projIcon, ctx);

        ctx.save();
        ctx.translate(cxLeft, cyTop);
        ctx.beginPath(); pathIcon(d.feature);
        ctx.fillStyle = colorFor(d.rate, thresholds, palette);
        ctx.fill();
        ctx.lineWidth = 1.0; ctx.strokeStyle = '#333';
        ctx.stroke();
        ctx.restore();

        if (p.mouseX >= cxLeft && p.mouseX <= cxLeft+d.iw &&
            p.mouseY >= cyTop   && p.mouseY <= cyTop+d.ih) {
          hover = { d, x: cxLeft + d.iw/2, y: cyTop + d.ih/2 };
        }
      }

      if (hover) {
        drawTooltip(p, `${hover.d.name} — ${fmtPctExact(hover.d.rate)}`, hover.x, hover.y, left, top, W, H);
      }

     // Legend
    const xMax = left + W - 8;
    drawLegendRamp(p, xMax, top + 22, thresholds, palette, xMax);

      p.pop();
    }
  };
})();