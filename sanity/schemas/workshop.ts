import { defineType, defineField } from 'sanity'

export default defineType({
  name: 'workshop',
  title: 'Workshop / About',
  type: 'document',
  fields: [
    defineField({
      name: 'workshopStory',
      title: 'Workshop Story',
      type: 'array',
      of: [{ type: 'block' }],
    }),
    defineField({
      name: 'workshopImage',
      title: 'Workshop Image',
      type: 'image',
      options: { hotspot: true },
    }),
    defineField({
      name: 'atelierAddress',
      title: 'Atelier Address',
      type: 'text',
    }),
    defineField({
      name: 'atelierPhone',
      title: 'Atelier Phone',
      type: 'string',
    }),
    defineField({
      name: 'atelierEmail',
      title: 'Atelier Email',
      type: 'string',
    }),
    defineField({
      name: 'atelierHours',
      title: 'Atelier Hours',
      type: 'string',
    }),
  ],
})
