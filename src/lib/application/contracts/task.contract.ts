export interface TaskPayload {
  [key: string]: any;
}

export interface TaskContract<TPayload extends TaskPayload> {
  readonly id: string;
  readonly type: string;
  execute(payload: TPayload): Promise<void>;
  validate(payload: TPayload): boolean;
}
