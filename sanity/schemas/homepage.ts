import { defineType, defineField } from 'sanity'

export default defineType({
  name: 'homepage',
  title: 'Homepage',
  type: 'document',
  fields: [
    defineField({
      name: 'heroHeadline',
      title: 'Hero Headline',
      type: 'string',
    }),
    defineField({
      name: 'heroSubheadline',
      title: 'Hero Subheadline',
      type: 'string',
    }),
    defineField({
      name: 'heroImage',
      title: 'Hero Image',
      type: 'image',
      options: { hotspot: true },
    }),
    defineField({
      name: 'philosophyText',
      title: 'Philosophy Text',
      type: 'array',
      of: [{ type: 'block' }],
    }),
    defineField({
      name: 'statsItems',
      title: 'Stats Items',
      type: 'array',
      of: [
        {
          type: 'object',
          fields: [
            { name: 'number', type: 'string', title: 'Number' },
            { name: 'label', type: 'string', title: 'Label' },
          ],
        },
      ],
    }),
    defineField({
      name: 'featuredCollectionTitle',
      title: 'Featured Collection Title',
      type: 'string',
    }),
  ],
})
