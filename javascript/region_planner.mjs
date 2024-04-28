import { A1111Context } from "./a1111_context.mjs";
import { ControlNetUnit } from "./controlnet_unit.mjs";

export class RegionPlanner {
  /**
   * Region planner
   * @param {HTMLElement} container
   * @param {Array<ControlNetUnit>} units
   * @param {A1111Context} context
   * @param {Number} [size] - Optional.
   */
  constructor(container, units, context, size) {
    this.container = container;
    this.units = units;
    this.context = context;
    this.size = size || 512;

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
