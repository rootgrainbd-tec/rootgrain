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
      validation: (Rule) => Rule.required().error('Please enter a group title.'),
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
      validation: (Rule) => Rule.required().error('Slug is required for the collection URL.'),
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
    defineField({
      name: 'heroImage',
      title: 'Cover Image',
      type: 'image',
      description: 'Optional cover image representing this entire collection.',
      options: { hotspot: true },
      fields: [{ name: 'alt', type: 'string', title: 'Alternative text', validation: (Rule) => Rule.required().error('Alt text is required.') }],
    }),
  ],
  preview: {
    select: {
      title: 'title',
      slug: 'slug.current',
      media: 'heroImage',
    },
    prepare(selection) {
      const { title, slug, media } = selection
      return {
        title: title,
        subtitle: slug ? `/${slug}` : 'No slug',
        media: media,
      }
    }
  }
})
