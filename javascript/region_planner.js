
(function () {
  const cnetAllAccordions = new Set();
  const appRoot = gradioApp();
  onUiUpdate(() => {
    appRoot.querySelectorAll('#controlnet').forEach(accordion => {
      if (cnetAllAccordions.has(accordion)) return;
      accordion.querySelectorAll('.cnet-region-planner')
        .forEach(container => new RegionPlanner(container, accordion));
      cnetAllAccordions.add(accordion);
    });
  });

  class GradioSlider {
    constructor(container) {
      this.container = container;
      this.number_input = container.querySelector('input[type="number"]');
      this.slider_input = container.querySelector('input[type="range"]');
    }

    getValue() {
      return this.number_input.value;
    }

    onChange(callback) {
      this.number_input.addEventListener("change", callback);
      this.slider_input.addEventListener("change", callback);
    }
  }

  class A1111Context {
    constructor(generationType) {
      this.width_slider = new GradioSlider(appRoot.querySelector(`#${generationType}_width`));
      this.height_slider = new GradioSlider(appRoot.querySelector(`#${generationType}_height`));
    }
  };

  class RegionPlanner {
    constructor(container, extensionRoot, size) {
      this.container = container;
      this.extensionRoot = extensionRoot;
      this.size = size || 512;

      this.isImg2Img = extensionRoot.querySelector('.cnet-unit-enabled').id.includes('img2img');
      this.context = new A1111Context(this.isImg2Img ? "img2img" : "txt2img");
      this.stage = new Konva.Stage({
        container: this.container,
        width: this.getCanvasWidth(),
        height: this.getCanvasHeight(),
      });
      this.context.height_slider.onChange(this.updateCanvasSize.bind(this));
      this.context.width_slider.onChange(this.updateCanvasSize.bind(this));

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

    getGenerationWidth() {
      return this.context.width_slider.getValue();
    }

    getGenerationHeight() {
      return this.context.height_slider.getValue();
    }

    getAspectRatio() {
      return this.getGenerationWidth() / this.getGenerationHeight();
    }

    getCanvasWidth() {
      const aspectRatio = this.getAspectRatio();
      return Math.round(aspectRatio <= 1.0 ? this.size : this.size * aspectRatio);
    }

    getCanvasHeight() {
      const aspectRatio = this.getAspectRatio();
      return Math.round(aspectRatio >= 1.0 ? this.size : this.size / aspectRatio);
    }

    updateCanvasSize() {
      this.stage.width(this.getCanvasWidth());
      this.stage.height(this.getCanvasHeight());
    }
  }
})();