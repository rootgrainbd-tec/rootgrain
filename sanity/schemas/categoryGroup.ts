import { defineType, defineField } from 'sanity'

export default defineType({
  name: 'categoryGroup',
  title: 'Category Group (Tab)',
  type: 'document',
  groups: [
    { name: 'basic', title: 'Basic Info' },
    { name: 'media', title: 'Media' },
    { name: 'seo', title: 'SEO' },
  ],
  fields: [
    defineField({
      name: 'title',
      title: 'Group Title',
      type: 'string',
      group: 'basic',
      description: 'The display name for this tab (e.g. "Furniture", "Kitchenware & Dining")',
      validation: (Rule) => Rule.required().error('Please enter a group title.'),
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      group: 'basic',
      description: 'URL-friendly path for this group (e.g. "furniture")',
      options: {
        source: 'title',
        maxLength: 96,
        isUnique: (value, context) => context.defaultIsUnique(value, context),
      },
      validation: (Rule) => Rule.required().error('Slug is required for the collection URL.'),
    }),
    defineField({
      name: 'lifecycleStatus',
      title: 'Lifecycle Status',
      type: 'string',
      group: 'basic',
      initialValue: 'Active',
      options: {
        list: [
          { title: 'Active', value: 'Active' },
          { title: 'Archived', value: 'Archived' },
        ],
        layout: 'radio',
      },
      description: 'Archived category groups are hidden from the storefront navigation.',
    }),
    defineField({
      name: 'categories',
      title: 'Categories in this Group',
      type: 'array',
      group: 'basic',
      of: [{ type: 'reference', to: { type: 'category' } }],
      description: 'Select the categories that belong to this tab',
      validation: (Rule) => Rule.required().min(1).error('At least one category is required.'),
    }),
    defineField({
      name: 'order',
      title: 'Display Order',
      type: 'number',
      group: 'basic',
      description: 'Order in which this tab appears (lower numbers appear first)',
    }),
    defineField({
      name: 'heroImage',
      title: 'Cover Image',
      type: 'image',
      group: 'media',
      description: 'Optional cover image representing this entire collection. Ensure high resolution.',
      options: { hotspot: true },
      fields: [{ name: 'alt', type: 'string', title: 'Alternative text', validation: (Rule) => Rule.required().error('Alt text is required.') }],
    }),
    defineField({
      name: 'seo',
      title: 'Search Engine Optimization',
      type: 'seo',
      group: 'seo',
    }),
  ],
  preview: {
    select: {
      title: 'title',
      slug: 'slug.current',
      lifecycleStatus: 'lifecycleStatus',
      media: 'heroImage',
    },
    prepare(selection) {
      const { title, slug, lifecycleStatus, media } = selection
      const lifeStatus = lifecycleStatus === 'Archived' ? '🗄️ Archived | ' : ''
      return {
        title: `${lifeStatus}${title}`,
        subtitle: slug ? `/${slug}` : 'No slug',
        media: media,
      }
    }
  }
})
