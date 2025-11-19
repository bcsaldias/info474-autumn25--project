// notes:
// map:
// us-atlas dataset json files which contian vector boundaries for each state / county.
// each feature has an id to the FIPS code: 2 digit for states, 5 digit for counties.
// laod the json then convert to geojson for drawing. also use
// d3-geo albers to proejct a map of the us. d3-geo mercator to do each state and county.

(function () {
  window.VizExploreMoreMap = {
    draw: function (p, manager ) {
      p.push();

      const left = manager.offsetX || 10;
      const top  = manager.offsetY || 40;
      const W    = Math.max(320, manager.width  || (p.width  - left - 10));
      const H    = Math.max(260, manager.height || (p.height - top  - 10));

      const topoStatesUrl = manager.topoStatesUrl || 'data/states-10m.json';

      if (!manager._usBareInit) manager._usBareInit = true;

      // topojson
      if (!manager._statesTopo && !manager._statesTopoLoading && !manager._statesTopoError) {
        manager._statesTopoLoading = true;
        p.loadJSON(
          topoStatesUrl,
          (json) => { manager._statesTopo = json; manager._statesTopoLoading = false; },
          () => { manager._statesTopoError = true; manager._statesTopoLoading = false; }
        );
      }

      if (!manager._statesTopo) {
        p.noStroke(); p.fill(80); p.textAlign(p.LEFT, p.TOP); p.textSize(14);
        p.text('Loading U.S. map…', left, top - 24);
        p.pop(); return;
      }

      if (!manager._statesGeo) {
        manager._statesGeo = topojson.feature(manager._statesTopo, manager._statesTopo.objects.states);
        if (manager._statesTopo.objects.nation) {
          manager._nationGeo = topojson.feature(manager._statesTopo, manager._statesTopo.objects.nation);
        }
      }

      const ctx = p.drawingContext;
      const proj = d3.geoAlbersUsa().fitSize([W, H], manager._statesGeo);
      const path = d3.geoPath(proj, ctx);
      if (manager._nationGeo) {
        ctx.save(); ctx.translate(left, top);
        ctx.beginPath(); path(manager._nationGeo);
        ctx.fillStyle = '#828c96ff';
        ctx.fill();
        ctx.restore();
      }

      ctx.save(); ctx.translate(left, top);
      for (const f of manager._statesGeo.features) {
        ctx.beginPath();
        path(f);
        ctx.fillStyle = '#476f9bff';
        ctx.fill();
        ctx.lineWidth = 0.8;
        ctx.strokeStyle = '#000000ff';
        ctx.stroke();
      }
      ctx.restore();

      p.pop();
    }
  };
})();