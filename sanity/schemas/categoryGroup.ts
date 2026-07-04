import { defineType, defineField } from 'sanity'

export default defineType({
  name: 'categoryGroup',
  title: 'Category Group (Tab)',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'Group Title',
      type: 'string',
      description: 'The display name for this tab (e.g. "Furniture", "Kitchenware & Dining")',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      description: 'URL-friendly path for this group (e.g. "furniture")',
      options: {
        source: 'title',
        maxLength: 96,
      },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'categories',
      title: 'Categories in this Group',
      type: 'array',
      of: [{ type: 'reference', to: { type: 'category' } }],
      description: 'Select the categories that belong to this tab',
    }),
    defineField({
      name: 'order',
      title: 'Display Order',
      type: 'number',
      description: 'Order in which this tab appears (lower numbers appear first)',
    }),
  ],
})
