import { A1111Context } from "./a1111_context.mjs";
import { ControlNetUnit } from "./controlnet_unit.mjs";

const COLORS = ["red", "green", "blue", "yellow", "purple"]
const GENERATION_GRID_SIZE = 8;

function snapToMultipleOf(input, size) {
  return Math.round(input / size) * size;
}


class CanvasControlNetUnit {
  /**
   * ControlNetUnit on canvas
   * @param {ControlNetUnit} unit
   * @param {RegionPlanner} planner
   * @param {Number} x
   * @param {Number} y
   */
  constructor(unit, planner, x, y) {
    this.unit = unit;
    this.planner = planner;
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

    this.text = new Konva.Text({
      x: this.canvasObject.x() + 4,
      y: this.canvasObject.y() + 4,
      text: `${this.getGenerationWidth()} x ${this.getGenerationHeight()}`,
      fontSize: 14,
      fill: "white",
      visible: this.unit.isActive(),
    });

    this.canvasLayer.add(this.canvasObject);
    this.canvasLayer.add(this.transformer);
    this.canvasLayer.add(this.text);

    this.unit.onActiveStateChange(() => {
      this.canvasObject.opacity(this.getOpacity());
      this.canvasObject.draggable(this.unit.isActive());
      this.transformer.visible(this.unit.isActive());
      this.text.visible(this.unit.isActive());
    });

    this.unit.onEnabledStateChange(() => {
      this.canvasLayer.visible(unit.isEnabled());
    });

    this.canvasObject.on('dragmove transform', () => {
      this.text.setAttrs({
        x: this.canvasObject.x() + 4,
        y: this.canvasObject.y() + 4,
        text: `${this.getGenerationWidth()} x ${this.getGenerationHeight()}`,
      });
    });
  }

  getColor() {
    return COLORS[this.unit.index];
  }

  getOpacity() {
    return this.unit.isActive() ? 1.0 : 0.3;
  }

  getGenerationWidth() {
    return snapToMultipleOf(
      this.canvasObject.width() * this.canvasObject.scaleX() / this.planner.getCanvasMappingRatio(),
      GENERATION_GRID_SIZE,
    );
  }

  getGenerationHeight() {
    return snapToMultipleOf(
      this.canvasObject.height() * this.canvasObject.scaleY() / this.planner.getCanvasMappingRatio(),
      GENERATION_GRID_SIZE,
    );
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
      const canvasUnit = new CanvasControlNetUnit(unit, this, 0, 0);
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
    newBox.width = snapToMultipleOf(newBox.width, gridSize);
    newBox.height = snapToMultipleOf(newBox.height, gridSize);

    if (newBox.width < gridSize) newBox.width = gridSize;
    if (newBox.height < gridSize) newBox.height = gridSize;

    return newBox;
  }
}
