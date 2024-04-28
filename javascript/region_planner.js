
(function () {
  const cnetAllAccordions = new Set();
  onUiUpdate(() => {
    gradioApp().querySelectorAll('#controlnet').forEach(accordion => {
      if (cnetAllAccordions.has(accordion)) return;
      accordion.querySelectorAll('.cnet-region-planner')
        .forEach(container => new RegionPlanner(container, accordion));
      cnetAllAccordions.add(accordion);
    });
  });

  class RegionPlanner {
    constructor(container, extension_root) {
      this.container = container;
      this.extension_root = extension_root
      this.stage = new Konva.Stage({
        container: this.container,
        width: 512,
        height: 512,
      });

      const layer = new Konva.Layer();
      this.stage.add(layer);
      const colors = ["red", "green", "blue", "yellow", "purple"];
      const units = [];
      for (let i = 0; i < 5; i++) {
        const unit = new Konva.Rect({
          x: 50 + 100 * i,
          y: 50,
          width: 50,
          height: 50,
          fill: colors[i],
          opacity: 0.2,
          id: i
        });
        layer.add(unit);
        units.push(unit);
      }
    }
  }
})();