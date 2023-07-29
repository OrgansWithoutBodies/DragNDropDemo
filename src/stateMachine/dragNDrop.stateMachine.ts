// import { EventObject } from "xstate";
// import { StateMachineShim } from "./stateMachine";
// enum DragNDropStates {
//   Idle,
//   Indeterminate,
//   Dragging,
//   Editing,
// }
// enum DragNDropEvents {
//   MouseDown,
//   MouseUp,
//   MouseMove,
// }
// export const DragNDropMachine = new StateMachineShim<
//   object,
//   { states: DragNDropStates[keyof DragNDropStates] },
//   EventObject
// >({ states: Object.values(DragNDropStates), initial: DragNDropStates.Idle });
