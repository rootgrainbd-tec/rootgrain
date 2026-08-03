import { ReadinessState } from "./readiness-check";

export class StartupCheck {
  static check(): ReadinessState {
    return ReadinessState.READY;
  }
}
