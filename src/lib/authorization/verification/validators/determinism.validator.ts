export class DeterminismValidator {
  static async assertStableExecution<T>(fn: () => Promise<T>, iterations: number = 10): Promise<void> {
    const results: T[] = [];
    for (let i = 0; i < iterations; i++) {
      results.push(await fn());
    }

    const first = JSON.stringify(results[0]);
    for (let i = 1; i < results.length; i++) {
      if (JSON.stringify(results[i]) !== first) {
        throw new Error(`Determinism violation: Execution ${i} differed from initial run`);
      }
    }
  }
}
