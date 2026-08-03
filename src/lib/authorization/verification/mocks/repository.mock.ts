export class MockRepository {
  private data = new Map<string, any>();

  async findById(id: string): Promise<any> {
    return this.data.get(id) || null;
  }

  async save(id: string, entity: any): Promise<void> {
    this.data.set(id, entity);
  }

  async getRolePermissions(roleNames: string[]): Promise<any[]> {
    return [{ action: "read", resource: "orders" }];
  }

  async getUserPermissions(userId: string): Promise<any[]> {
    return [];
  }

  async getPolicies(): Promise<any[]> {
    return this.data.get("policies") || [];
  }

  async isSystemInLockdown(): Promise<boolean> {
    return false;
  }

  async isSystemInMaintenance(): Promise<boolean> {
    return false;
  }

  async isUserDeleted(userId: string): Promise<boolean> {
    return false;
  }

  async isUserSuspended(userId: string): Promise<boolean> {
    return false;
  }

  async isUserLocked(userId: string): Promise<boolean> {
    return false;
  }

  clear(): void {
    this.data.clear();
  }
}
