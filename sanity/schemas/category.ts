import { defineType, defineField } from 'sanity'

export default defineType({
  name: 'category',
  title: 'Category',
  type: 'document',
  groups: [
    { name: 'basic', title: 'Basic Info' },
    { name: 'seo', title: 'SEO' },
  ],
  fields: [
    defineField({
      name: 'name',
      title: 'Category Name',
      type: 'string',
      group: 'basic',
      description: 'The name of the category (e.g. Chairs, Tables)',
      validation: (Rule) => Rule.required().error('Category name is required.'),
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      group: 'basic',
      description: 'URL-friendly identifier for the category',
      options: {
        source: 'name',
        maxLength: 96,
        isUnique: (value, context) => context.defaultIsUnique(value, context),
      },
      validation: (Rule) => Rule.required().error('Slug is required.'),
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
      description: 'Archived categories will not be displayed on the storefront.',
    }),
    defineField({
      name: 'description',
      title: 'Description',
      type: 'text',
      group: 'basic',
      rows: 3,
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
      title: 'name',
      lifecycleStatus: 'lifecycleStatus',
    },
    prepare(selection) {
      const { title, lifecycleStatus } = selection
      const lifeStatus = lifecycleStatus === 'Archived' ? '🗄️ Archived | ' : ''
      return {
        title: `${lifeStatus}${title}`,
      }
    }
  },
})
