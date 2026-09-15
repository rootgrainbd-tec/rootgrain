import { defineType, defineField } from 'sanity'

export default defineType({
  name: 'craftsmanshipSection',
  title: 'Craftsmanship Section',
  type: 'document',
  fields: [
    defineField({
      name: 'sectionEyebrow',
      title: 'Section Eyebrow',
      type: 'string',
      description: 'e.g., "The Art of Making"',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'sectionTitle',
      title: 'Section Title',
      type: 'string',
      description: 'e.g., "Craftsmanship"',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'sectionDescription',
      title: 'Section Description',
      type: 'text',
      description: 'The main introductory text for the section.',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'bannerImage',
      title: 'Banner Image',
      type: 'image',
      options: { hotspot: true },
      description: 'Large banner image displayed below the craftsmanship steps.',
      fields: [
        {
          name: 'alt',
          type: 'string',
          title: 'Alternative text',
          validation: (Rule) => Rule.required().error('Alt text is required.'),
        },
      ],
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'bannerQuote',
      title: 'Banner Quote',
      type: 'text',
      description: 'Quote overlaid on the banner image.',
      validation: (Rule) => Rule.required(),
    }),
  ],
})
