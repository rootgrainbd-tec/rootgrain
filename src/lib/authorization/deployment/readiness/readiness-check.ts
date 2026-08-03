export enum ReadinessState {
  READY = "READY",
  NOT_READY = "NOT_READY",
  DEGRADED = "DEGRADED"
}

export class ReadinessCheck {
  static check(): ReadinessState {
    // Isolated evaluation, no DB or external calls
    return ReadinessState.READY;
  }
}
