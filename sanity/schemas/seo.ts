import { defineType, defineField } from 'sanity'

export default defineType({
  name: 'seo',
  title: 'SEO Settings',
  type: 'object',
  fields: [
    defineField({
      name: 'seoTitle',
      title: 'SEO Title',
      type: 'string',
      description: 'The title displayed in search engine results and browser tabs. Recommended length: 50-60 characters.',
      validation: (Rule) => Rule.max(60).warning('Keep under 60 characters for optimal search engine display.'),
    }),
    defineField({
      name: 'seoDescription',
      title: 'SEO Description',
      type: 'text',
      rows: 3,
      description: 'The description displayed in search engine results. Recommended length: 150-160 characters.',
      validation: (Rule) => Rule.max(160).warning('Keep under 160 characters for optimal display in search results.'),
    }),
  ],
})
