// sketch_renderer.js

// Responsible for rendering the main visualization based on the current active index
(function () {
    window.Renderer = {

        setData: function (manager) {
            var self = this;

            manager.offsetX = (manager.margin && manager.margin.left) || 20;
            manager.offsetY = (manager.margin && manager.margin.top) || 0;

            function computeLayout(data) {
                manager.data = data;
            }

            computeLayout([]);
            return Promise.resolve(manager.data);
        },

        draw: function (p, manager, ai, progress) {
            try { console.log('Renderer: delegating draw, ai=', ai); } catch (e) { }

            if (ai === 0) {
                // window.VizTitle.draw(p, manager, ai, progress);
                return;
            }

            if (ai === 1) {
                window.GuessHowMany.draw(p, manager, ai, progress);
                return;
            }

            if (ai === 2) {
                window.Viz1In5.draw(p, manager, ai, progress);
                return;
            }

            if (ai === 3) {
                window.FIIncomeMap.draw(p, manager, ai, progress);
                return;
            }

            if (ai == 5) {
                window.VizJustice.draw(p, manager, ai, progress);
                return;
            }

            if (ai === 8) {
                window.VizExploreMoreMap.draw(p, manager, ai, progress);
                return;
            }
        },

        mousePressed: function (p, manager, ai, progress) {
            if (ai === 1) {
                window.GuessHowMany.mousePressed(p, manager, ai, progress);
                return;
            }
        }
    };
})();
