import { A1111Context } from "./a1111_context.mjs";
import { ControlNetUnit } from "./controlnet_unit.mjs";

const COLORS = ["red", "green", "blue", "yellow", "purple"]
const GENERATION_GRID_SIZE = 8;


class CanvasControlNetUnit {
  /**
   * ControlNetUnit on canvas
   * @param {ControlNetUnit} unit
   * @param {Number} x
   * @param {Number} y
   */
  constructor(unit, x, y) {
    this.unit = unit;
    this.canvasLayer = new Konva.Layer({
      visible: unit.isEnabled(),
    });

    this.canvasObject = new Konva.Rect({
      x, y,
      width: 50,
      height: 50,
      fill: this.getColor(),
      opacity: this.getOpacity(),
      id: unit.index,
      draggable: this.unit.isActive(),
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
      borderEnabled: true,
      visible: this.unit.isActive(),
    });
    this.canvasLayer.add(this.canvasObject);
    this.canvasLayer.add(this.transformer);

    this.unit.onActiveStateChange((() => {
      this.canvasObject.opacity(this.getOpacity());
      this.canvasObject.draggable(this.unit.isActive());
      this.transformer.visible(this.unit.isActive());
    }).bind(this));

    this.unit.onEnabledStateChange((() => {
      this.canvasLayer.visible(unit.isEnabled());
    }).bind(this));
  }

  getColor() {
    return COLORS[this.unit.index];
  }

  getOpacity() {
    return this.unit.isActive() ? 1.0 : 0.3;
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
      canvasUnit.transformer.boundBoxFunc(this.boundBoxSnapToGrid.bind(this));
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

  // canvas dim = generation dim * mapping_ratio
  getCanvasMappingRatio() {
    return this.getCanvasHeight() / this.getGenerationHeight();
  }

  updateCanvasSize() {
    this.stage.width(this.getCanvasWidth());
    this.stage.height(this.getCanvasHeight());
  }

  boundBoxSnapToGrid(oldBox, newBox) {
    const gridSize = GENERATION_GRID_SIZE * this.getCanvasMappingRatio();
    newBox.width = Math.round(newBox.width / gridSize) * gridSize;
    newBox.height = Math.round(newBox.height / gridSize) * gridSize;

    if (newBox.width < gridSize) newBox.width = gridSize;
    if (newBox.height < gridSize) newBox.height = gridSize;

    return newBox;
  }
}
