import { useKeyMapping } from "./utils";
import { SingleEventEmitter } from '@sdk-root/utils/singleEventEmitter';


type Selection = number | null;
export const SelectionController = new class SelectionController {
  private selectStart: number = 0;
  private selectedEntity: Selection = null;

  private disabled = false;

  private selectionChangedEvent = new SingleEventEmitter<[Selection, Selection]>();

  init() {
    SetEntityDrawOutlineColor(255, 255, 255, 255);
    SetEntityDrawOutlineShader(1);
  }

  destroy() {
    this.resetSelectedEntity();

    SetEntityDrawOutlineColor(255, 0, 255, 255);
    SetEntityDrawOutlineShader(0);
  }

  onSelectionChanged(cb: (arg: [Selection, Selection]) => void) {
    this.selectionChangedEvent.addListener(cb);
  }

  enable() {
    this.disabled = false;
  }

  disable() {
    this.selectStart = 0;
    this.disabled = true;

    this.resetSelectedEntity();
  }

  select(active: boolean) {
    if (this.disabled) {
      return;
    }

    if (active) {
      this.selectStart = GetGameTimer();
      return;
    }

    if (GetGameTimer() - this.selectStart > 250) {
      return;
    }

    const selectedEntity = SelectEntityAtCursor(6 | (1 << 5), true);
    if (selectedEntity) {
      if (this.selectedEntity !== selectedEntity) {
        this.selectionChangedEvent.emit([selectedEntity, this.selectedEntity]);
      }

      this.resetSelectedEntity();

      if (this.selectedEntity !== selectedEntity) {
        this.selectedEntity = selectedEntity;

        this.draw();
      }
    }
  }

  getSelectedEntity(): Selection{
    return this.selectedEntity;
  }

  setSelectedEntity(entity: Selection) {
    this.resetSelectedEntity();

    this.selectedEntity = entity;

    if (entity !== null){
      this.draw();
    }
  }

  private resetSelectedEntity() {
    if (this.selectedEntity !== null) {
      SetEntityDrawOutline(this.selectedEntity, false);
      ReleaseScriptGuidFromEntity(this.selectedEntity);

      this.selectedEntity = null;
    }
  }

  private rAF = false;
  private draw() {
    if (this.rAF) {
      return;
    }

    this.rAF = true;
    requestAnimationFrame(() => {
      this.rAF = false;

      if (this.selectedEntity !== null) {
        SetEntityDrawOutline(this.selectedEntity, true);
      }
    });
  }
};

const select = useKeyMapping('we_select', 'Select entity', 'mouse_button', 'mouse_left');
select.on(() => SelectionController.select(true));
select.off(() => SelectionController.select(false));
