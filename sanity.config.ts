import { defineConfig } from 'sanity'
import { structureTool } from 'sanity/structure'
import { visionTool } from '@sanity/vision'
import { schema } from './sanity/schema'
import { structure } from './sanity/structure'
import { dataset, projectId } from './sanity/env'
import { StudioLogo } from './sanity/logo'

export default defineConfig({
  basePath: '/studio',
  projectId,
  dataset,
  title: 'RootGrain Studio',
  schema,
  studio: {
    components: {
      logo: StudioLogo,
    },
  },
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
