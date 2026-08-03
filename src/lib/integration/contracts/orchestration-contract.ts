export interface OrchestrationContract<TInput, TOutput> {
  orchestrate(payload: TInput): Promise<TOutput>;
  validateDependencies(): boolean;
}
