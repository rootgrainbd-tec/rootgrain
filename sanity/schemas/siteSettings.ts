import { defineType, defineField } from 'sanity'

export default defineType({
  name: 'siteSettings',
  title: 'Site Settings',
  type: 'document',
  fields: [
    defineField({
      name: 'siteTitle',
      title: 'Site Title',
      type: 'string',
    }),
    defineField({
      name: 'logo',
      title: 'Site Logo (Light / Default)',
      type: 'image',
      options: { hotspot: true },
    }),
    defineField({
      name: 'logoDark',
      title: 'Site Logo (Dark Mode)',
      type: 'image',
      options: { hotspot: true },
    }),
    defineField({
      name: 'logoEmail',
      title: 'Email Logo (Print / Email)',
      type: 'image',
      options: { hotspot: true },
    }),
    defineField({
      name: 'logoSquare',
      title: 'Square Logo (Profile / Icons)',
      type: 'image',
      options: { hotspot: true },
    }),
    defineField({
      name: 'favicon',
      title: 'Favicon',
      type: 'image',
      options: { hotspot: true },
    }),
    defineField({
      name: 'ogImage',
      title: 'Open Graph Image (Social Sharing)',
      type: 'image',
      options: { hotspot: true },
    }),
    defineField({
      name: 'websiteUrl',
      title: 'Website URL',
      type: 'url',
      description: 'The primary URL of the website (e.g., https://rootgrain.bd)',
    }),
    defineField({
      name: 'tagline',
      title: 'Tagline',
      type: 'string',
    }),
    defineField({
      name: 'description',
      title: 'Description',
      type: 'text',
    }),
    defineField({
      name: 'phone',
      title: 'Phone Number',
      type: 'string',
    }),
    defineField({
      name: 'email',
      title: 'Email',
      type: 'string',
    }),
    defineField({
      name: 'hours',
      title: 'Business Hours',
      type: 'string',
    }),
    defineField({
      name: 'address',
      title: 'Address',
      type: 'object',
      fields: [
        { name: 'line1', type: 'string', title: 'Line 1' },
        { name: 'line2', type: 'string', title: 'Line 2' },
      ],
    }),
    defineField({
      name: 'socialLinks',
      title: 'Social Links',
      type: 'object',
      fields: [
        { name: 'instagram', type: 'url', title: 'Instagram URL' },
        { name: 'facebook', type: 'url', title: 'Facebook URL' },
        { name: 'twitter', type: 'url', title: 'Twitter URL' },
        { name: 'youtube', type: 'url', title: 'YouTube URL' },
        { name: 'linkedin', type: 'url', title: 'LinkedIn URL' },
        { name: 'pinterest', type: 'url', title: 'Pinterest URL' },
      ],
    }),
    defineField({
      name: 'copyright',
      title: 'Copyright Text',
      type: 'string',
    }),
    defineField({
      name: 'origin',
      title: 'Origin Text',
      type: 'string',
    }),
  ],
})
