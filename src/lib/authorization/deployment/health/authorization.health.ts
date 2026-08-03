export class AuthorizationHealth {
  static check(): { status: 'up' | 'down', components: string[] } {
    return { status: 'up', components: ['cache', 'policy', 'middleware'] };
  }
}
