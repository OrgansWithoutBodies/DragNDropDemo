import { EventObject } from "xstate";
import { StateMachineShim } from "./stateMachine";
enum DragNDropStates {
  "IDLE",
  "INDETERMINATE",
  "DRAGGING",
  "EDITING",
}
enum DragNDropEvents {
  MouseDown,
  MouseUp,
  MouseMove,
}
export const DragNDropMachine = new StateMachineShim<
  object,
  { states: keyof DragNDropStates },
  EventObject
>({ states: Object.values(DragNDropStates), initial: DragNDropStates.IDLE });
