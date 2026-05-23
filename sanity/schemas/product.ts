import { defineType, defineField } from 'sanity'

export default defineType({
  name: 'product',
  title: 'Product',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: { source: 'title', maxLength: 96 },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'category',
      title: 'Category',
      type: 'reference',
      to: [{ type: 'category' }],
    }),
    defineField({
      name: 'woodType',
      title: 'Wood Type',
      type: 'string',
    }),
    defineField({
      name: 'price',
      title: 'Price (BDT)',
      type: 'number',
    }),
    defineField({
      name: 'availability',
      title: 'Availability',
      type: 'string',
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
    }),
    defineField({
      name: 'fullDescription',
      title: 'Full Description',
      type: 'array',
      of: [{ type: 'block' }],
    }),
    defineField({
      name: 'heroImage',
      title: 'Hero Image',
      type: 'image',
      options: { hotspot: true },
      fields: [{ name: 'alt', type: 'string', title: 'Alternative text' }],
    }),
    defineField({
      name: 'galleryImages',
      title: 'Gallery Images',
      type: 'array',
      of: [{ type: 'image', options: { hotspot: true } }],
    }),
    defineField({
      name: 'dimensions',
      title: 'Dimensions',
      type: 'object',
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
    }),
    defineField({
      name: 'featured',
      title: 'Featured (Show on Homepage)',
      type: 'boolean',
      initialValue: false,
    }),
  ],
})
