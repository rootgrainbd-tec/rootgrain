export interface TemplateContract {
  readonly template_id: string;
  readonly subject: string;
  readonly body_schema: Record<string, any>;
  readonly required_variables: string[];
  readonly version: string;
}
