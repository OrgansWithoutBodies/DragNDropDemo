import {
  BaseActionObject,
  Event,
  EventData,
  EventObject,
  Interpreter,
  MachineConfig,
  ResolveTypegenMeta,
  SCXML,
  ServiceMap,
  SingleOrArray,
  State,
  StateSchema,
  TypegenDisabled,
  createMachine,
  interpret,
} from "xstate";

export class StateMachineShim<
  TContext,
  TStateSchema extends StateSchema,
  TEvent extends EventObject,
  TAction extends BaseActionObject = BaseActionObject,
  TServiceMap extends ServiceMap = ServiceMap
> {
  private interpreter: Interpreter<
    TContext,
    any,
    TEvent,
    {
      value: any;
      context: TContext;
    },
    ResolveTypegenMeta<TypegenDisabled, TEvent, BaseActionObject, TServiceMap>
  >;
  constructor(
    config: MachineConfig<TContext, TStateSchema, TEvent, TAction, TServiceMap>
  ) {
    const machine = createMachine<
      TContext,
      TEvent,
      { value: any; context: TContext },
      TServiceMap
    >(config);
    this.interpreter = interpret(machine);
  }

  public getState(): State<
    TContext,
    TEvent,
    any,
    {
      value: any;
      context: TContext;
    },
    ResolveTypegenMeta<TypegenDisabled, TEvent, BaseActionObject, TServiceMap>
  > {
    return this.interpreter.getSnapshot();
  }

  public sendEvent(
    event: SingleOrArray<Event<TEvent>> | SCXML.Event<TEvent>,
    payload?: EventData
  ): void {
    this.interpreter.send(event, payload);
  }
}
