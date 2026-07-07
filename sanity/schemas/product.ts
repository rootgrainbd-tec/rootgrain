import { defineType, defineField } from 'sanity'

export default defineType({
  name: 'product',
  title: 'Product',
  type: 'document',
  groups: [
    { name: 'basic', title: 'Basic Info' },
    { name: 'details', title: 'Details & Specs' },
    { name: 'media', title: 'Media' },
  ],
  fields: [
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      group: 'basic',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      group: 'basic',
      options: { source: 'title', maxLength: 96 },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'category',
      title: 'Category',
      type: 'reference',
      group: 'basic',
      to: [{ type: 'category' }],
    }),
    defineField({
      name: 'woodType',
      title: 'Wood Type',
      type: 'string',
      group: 'basic',
      options: {
        list: [
          { title: 'Teak (Segun)', value: 'Teak' },
          { title: 'Mahogany', value: 'Mahogany' },
          { title: 'Sisu', value: 'Sisu' },
          { title: 'Jackfruit', value: 'Jackfruit' },
          { title: 'Jam', value: 'Jam' },
          { title: 'Kerosin', value: 'Kerosin' },
          { title: 'Neem', value: 'Neem' },
          { title: 'American Black Walnut', value: 'American Black Walnut' },
          { title: 'Cherry', value: 'Cherry' },
          { title: 'White Oak', value: 'White Oak' },
        ],
      },
    }),
    defineField({
      name: 'price',
      title: 'Price (BDT)',
      type: 'number',
      group: 'basic',
    }),
    defineField({
      name: 'availability',
      title: 'Availability',
      type: 'string',
      group: 'basic',
      options: {
        list: [
          { title: 'Available', value: 'Available' },
          { title: 'Made-to-Order', value: 'Made-to-Order' },
          { title: 'Sold', value: 'Sold' },
        ],
      },
    }),
    defineField({
      name: 'shortDescription',
      title: 'Short Description',
      type: 'text',
      group: 'details',
    }),
    defineField({
      name: 'fullDescription',
      title: 'Full Description',
      type: 'array',
      group: 'details',
      of: [{ type: 'block' }],
    }),
    defineField({
      name: 'heroImage',
      title: 'Hero Image',
      type: 'image',
      group: 'media',
      options: { hotspot: true },
      fields: [{ name: 'alt', type: 'string', title: 'Alternative text' }],
    }),
    defineField({
      name: 'galleryImages',
      title: 'Gallery Images',
      type: 'array',
      group: 'media',
      of: [{ type: 'image', options: { hotspot: true } }],
    }),
    defineField({
      name: 'dimensions',
      title: 'Dimensions',
      type: 'object',
      group: 'details',
      fields: [
        { name: 'length', type: 'number', title: 'Length' },
        { name: 'width', type: 'number', title: 'Width' },
        { name: 'height', type: 'number', title: 'Height' },
        { name: 'unit', type: 'string', title: 'Unit (inches/cm)', options: { list: ['inches', 'cm'] } },
      ],
    }),
    defineField({
      name: 'leadTimeDays',
      title: 'Lead Time (Days)',
      type: 'number',
      group: 'details',
    }),
    defineField({
      name: 'featured',
      title: 'Featured (Show on Homepage)',
      type: 'boolean',
      group: 'basic',
      initialValue: false,
    }),
  ],
  preview: {
    select: {
      title: 'title',
      subtitle: 'price',
      media: 'heroImage',
    },
    prepare(selection) {
      return {
        title: selection.title,
        subtitle: selection.subtitle ? `৳${selection.subtitle}` : 'No price set',
        media: selection.media,
      }
    }
  }
})
