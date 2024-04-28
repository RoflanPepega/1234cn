import { A1111Context } from "./a1111_context.mjs";
import { ControlNetUnit } from "./controlnet_unit.mjs";

const COLORS = ["red", "green", "blue", "yellow", "purple"]

class CanvasControlNetUnit {
  /**
   * ControlNetUnit on canvas
   * @param {ControlNetUnit} unit
   * @param {Number} x
   * @param {Number} y
   */
  constructor(unit, x, y) {
    this.unit = unit;
    this.color = COLORS[unit.index];
    this.canvasLayer = new Konva.Layer();
    this.canvasObject = new Konva.Rect({
      x, y,
      width: 50,
      height: 50,
      fill: this.color,
      opacity: 0.2,
      id: unit.index,
      draggable: true,
    });
    this.transformer = new Konva.Transformer({
      nodes: [this.canvasObject],
      keepRatio: false,
      enabledAnchors: [
        'top-left',
        'top-right',
        'bottom-left',
        'bottom-right',
        'middle-left',
        'middle-right',
        'top-center',
        'bottom-center',
      ],
      rotateEnabled: false,
      borderEnabled: true
    });
    this.canvasLayer.add(this.canvasObject);
    this.canvasLayer.add(this.transformer);
  }
}

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

    this.canvasUnits = this.units.map((unit) => {
      const canvasUnit = new CanvasControlNetUnit(unit, 0, 0);
      this.stage.add(canvasUnit.canvasLayer);
      return canvasUnit;
    });
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
