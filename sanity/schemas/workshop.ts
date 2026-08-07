import { defineType, defineField } from 'sanity'

export default defineType({
  name: 'workshop',
  title: 'Workshop / About',
  type: 'document',
  groups: [
    { name: 'story', title: 'Story & Image' },
    { name: 'contact', title: 'Atelier Contact' },
    { name: 'seo', title: 'SEO' },
  ],
  fields: [
    defineField({
      name: 'workshopStory',
      title: 'Workshop Story',
      type: 'array',
      group: 'story',
      of: [{ type: 'block' }],
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'workshopImage',
      title: 'Workshop Image',
      type: 'image',
      group: 'story',
      options: { hotspot: true },
      fields: [{ name: 'alt', type: 'string', title: 'Alternative text', validation: (Rule) => Rule.required().error('Alt text is required.') }],
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'atelierAddress',
      title: 'Atelier Address',
      type: 'text',
      group: 'contact',
      rows: 2,
    }),
    defineField({
      name: 'atelierPhone',
      title: 'Atelier Phone',
      type: 'string',
      group: 'contact',
    }),
    defineField({
      name: 'atelierEmail',
      title: 'Atelier Email',
      type: 'string',
      group: 'contact',
    }),
    defineField({
      name: 'atelierHours',
      title: 'Atelier Hours',
      type: 'string',
      group: 'contact',
    }),
    defineField({
      name: 'seo',
      title: 'Search Engine Optimization',
      type: 'seo',
      group: 'seo',
    }),
  ],
})
