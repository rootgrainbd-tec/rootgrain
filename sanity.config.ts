import { defineConfig } from 'sanity'
import { structureTool } from 'sanity/structure'
import { visionTool } from '@sanity/vision'
import { muxInput } from 'sanity-plugin-mux-input'
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
    muxInput(),
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
