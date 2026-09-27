import { defineType, defineField } from 'sanity'
import { BlockElementIcon } from '@sanity/icons'

export default defineType({
  name: 'generalCard',
  title: 'General Business Card',
  type: 'document',
  icon: BlockElementIcon,
  fields: [
    defineField({
      name: 'isActive',
      title: 'Active Status',
      type: 'boolean',
      description: 'If inactive, the general profile will not be publicly accessible.',
      initialValue: true,
    }),
    defineField({
      name: 'brandName',
      title: 'Brand Name',
      type: 'string',
      initialValue: 'RootGrain',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'businessCategory',
      title: 'Business Category',
      type: 'string',
      initialValue: 'Artisan Furniture',
    }),
    defineField({
      name: 'logo',
      title: 'Logo',
      type: 'image',
      options: {
        hotspot: true,
      },
    }),
    defineField({
      name: 'shortDescription',
      title: 'Short Description',
      type: 'text',
      rows: 3,
    }),
    defineField({
      name: 'businessPhone',
      title: 'Business Phone',
      type: 'string',
    }),
    defineField({
      name: 'whatsappNumber',
      title: 'WhatsApp Number',
      type: 'string',
      description: 'Include country code, e.g., +8801...',
    }),
    defineField({
      name: 'businessEmail',
      title: 'Business Email',
      type: 'string',
      validation: (Rule) => Rule.email(),
    }),
    defineField({
      name: 'website',
      title: 'Website',
      type: 'url',
    }),
    defineField({
      name: 'instagram',
      title: 'Instagram',
      type: 'url',
    }),
    defineField({
      name: 'facebook',
      title: 'Facebook',
      type: 'url',
    }),
    defineField({
      name: 'linkedin',
      title: 'LinkedIn',
      type: 'url',
    }),
    defineField({
      name: 'businessAddress',
      title: 'Business Address',
      type: 'text',
      rows: 2,
    }),
    defineField({
      name: 'seo',
      title: 'SEO Settings',
      type: 'seo',
    }),
  ],
  preview: {
    select: {
      title: 'brandName',
      subtitle: 'businessCategory',
      media: 'logo',
    },
  },
})
