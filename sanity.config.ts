import { defineConfig } from 'sanity'
import { structureTool } from 'sanity/structure'
import { schema } from './sanity/schema'

export default defineConfig({
  basePath: '/studio',
  projectId: "uuu315g5",
  dataset: "production",
  title: 'RootGrain Studio',
  schema,
  plugins: [
    structureTool(),
  ],
})
