import { defineType, defineField } from 'sanity'
import { UserIcon } from '@sanity/icons'

export default defineType({
  name: 'personalCard',
  title: 'Personal Business Card',
  type: 'document',
  icon: UserIcon,
  fields: [
    defineField({
      name: 'displayOrder',
      title: 'Display Order',
      type: 'number',
      description: 'Controls the order of appearance on the General Card (e.g. 1 for first, 2 for second). Profiles without an order will appear at the end.',
    }),
    defineField({
      name: 'isActive',
      title: 'Active Status',
      type: 'boolean',
      description: 'If inactive, the profile will not be publicly accessible.',
      initialValue: true,
    }),
    defineField({
      name: 'fullName',
      title: 'Full Name',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'slug',
      title: 'Profile Slug',
      type: 'slug',
      options: {
        source: 'fullName',
        maxLength: 96,
      },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'previousSlugs',
      title: 'Previous Slugs',
      description: 'If you change the slug, add the old slug here so old QR codes still work.',
      type: 'array',
      of: [{ type: 'string' }],
    }),
    defineField({
      name: 'preferredName',
      title: 'Preferred Display Name',
      type: 'string',
      description: 'Used instead of full name if provided.',
    }),
    defineField({
      name: 'designation',
      title: 'Designation',
      type: 'string',
    }),
    defineField({
      name: 'organization',
      title: 'Organization',
      type: 'string',
      initialValue: 'RootGrain Artisan Furniture',
    }),
    defineField({
      name: 'profilePhoto',
      title: 'Profile Photo',
      type: 'image',
      options: {
        hotspot: true,
      },
    }),
    defineField({
      name: 'shortIntroduction',
      title: 'Short Introduction',
      type: 'text',
      rows: 3,
    }),
    defineField({
      name: 'phoneNumber',
      title: 'Phone Number',
      type: 'string',
    }),
    defineField({
      name: 'whatsappNumber',
      title: 'WhatsApp Number',
      type: 'string',
      description: 'Include country code, e.g., +8801...',
    }),
    defineField({
      name: 'emailAddress',
      title: 'Email Address',
      type: 'string',
      validation: (Rule) => Rule.email(),
    }),
    defineField({
      name: 'websiteUrl',
      title: 'Website URL',
      type: 'url',
    }),
    defineField({
      name: 'linkedinUrl',
      title: 'LinkedIn URL',
      type: 'url',
    }),
    defineField({
      name: 'instagramUrl',
      title: 'Instagram URL',
      type: 'url',
    }),
    defineField({
      name: 'facebookUrl',
      title: 'Facebook URL',
      type: 'url',
    }),
    defineField({
      name: 'officeAddress',
      title: 'Office Address',
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
      title: 'fullName',
      subtitle: 'designation',
      media: 'profilePhoto',
    },
  },
})
