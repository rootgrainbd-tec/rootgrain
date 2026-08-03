export interface OrganizationalModel {
  readonly model_id: string;
  readonly dimensions: ReadonlyArray<string>;
  readonly alignment_status: 'ALIGNED' | 'UNALIGNED';
}
