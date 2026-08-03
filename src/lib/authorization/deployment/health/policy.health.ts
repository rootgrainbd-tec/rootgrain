export class PolicyHealth {
  static check(): { status: 'up' | 'down', policiesLoaded: number } {
    return { status: 'up', policiesLoaded: 0 };
  }
}
