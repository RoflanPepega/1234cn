import { A1111Context } from "./a1111_context.mjs";
import { ControlNetUnit } from "./controlnet_unit.mjs";
import { initControlNetModals } from "./modal.mjs";
import { OpenposeEditor } from "./openpose_editor.mjs";
import { loadPhotopea } from "./photopea.mjs";
import { RegionPlanner } from "./region_planner.mjs";

(function () {
  const cnetAllAccordions = new Set();
  onUiUpdate(() => {
    gradioApp().querySelectorAll('#controlnet').forEach(accordion => {
      if (cnetAllAccordions.has(accordion)) return;
      const isImg2Img = accordion.querySelector('.cnet-unit-enabled').id.includes('img2img');
      const generationType = isImg2Img ? "img2img" : "txt2img";
      const a1111Context = new A1111Context(gradioApp(), generationType);

      const units = [...accordion.querySelectorAll('.cnet-unit-tab')].map(tab => {
        const unit = new ControlNetUnit(tab, accordion);
        const openposeEditor = new OpenposeEditor(unit);
        unit.openposeEditor = openposeEditor;
        return unit;
      });
      new RegionPlanner(
        accordion.querySelector('.cnet-region-planner'),
        units,
        a1111Context,
      );
      initControlNetModals(accordion);
      loadPhotopea(accordion);

      cnetAllAccordions.add(accordion);
    });
  });
})();