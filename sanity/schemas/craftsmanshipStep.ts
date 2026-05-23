import { defineType, defineField } from 'sanity'

export default defineType({
  name: 'craftsmanshipStep',
  title: 'Craftsmanship Step',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'Step Title',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'description',
      title: 'Description',
      type: 'text',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'order',
      title: 'Order (1, 2, 3...)',
      type: 'number',
      validation: (Rule) => Rule.required(),
    }),
  ],
  orderings: [
    {
      title: 'Step Order',
      name: 'stepOrderAsc',
      by: [{ field: 'order', direction: 'asc' }],
    },
  ],
})
