import { defineConfig } from 'sanity'
import { structureTool } from 'sanity/structure'
import { visionTool } from '@sanity/vision'
import { schema } from './sanity/schema'
import { structure } from './sanity/structure'

export default defineConfig({
  basePath: '/studio',
  projectId: "uuu315g5",
  dataset: "production",
  title: 'RootGrain Studio',
  schema,
  plugins: [
    structureTool({ structure }),
    visionTool(),
  ],
  document: {
    newDocumentOptions: (prev, { creationContext }) => {
      if (creationContext.type === 'global') {
        return prev.filter((templateItem) => templateItem.templateId !== 'subscriber')
      }
      return prev
    },
  },
})
