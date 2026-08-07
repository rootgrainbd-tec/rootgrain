import { defineType, defineField } from 'sanity'

export default defineType({
  name: 'testimonial',
  title: 'Testimonial',
  type: 'document',
  fields: [
    defineField({
      name: 'clientName',
      title: 'Client Name',
      type: 'string',
      validation: (Rule) => Rule.required().error('Client name is required.'),
    }),
    defineField({
      name: 'clientLocation',
      title: 'Client Location',
      type: 'string',
    }),
    defineField({
      name: 'quote',
      title: 'Quote',
      type: 'text',
      rows: 4,
      validation: (Rule) => Rule.required().error('Testimonial quote is required.'),
    }),
    defineField({
      name: 'productPurchased',
      title: 'Product Purchased',
      type: 'string',
      description: 'e.g., Japandi Dining Table',
    }),
    defineField({
      name: 'featured',
      title: 'Featured',
      type: 'boolean',
      initialValue: false,
    }),
    defineField({
      name: 'approved',
      title: 'Approved',
      description: 'Only approved testimonials will be displayed on the site.',
      type: 'boolean',
      initialValue: true,
    }),
    defineField({
      name: 'image',
      title: 'Customer Image',
      type: 'image',
      description: 'Optional photo of the customer (1:1 aspect ratio recommended).',
      options: { hotspot: true },
      fields: [{ name: 'alt', type: 'string', title: 'Alternative text', validation: (Rule) => Rule.required().error('Alt text is required.') }],
    }),
    defineField({
      name: 'rating',
      title: 'Rating',
      type: 'number',
      description: 'Rating from 1 to 5 stars.',
      initialValue: 5,
      validation: (Rule) => Rule.min(1).max(5).error('Rating must be between 1 and 5.'),
    }),
  ],
  preview: {
    select: {
      title: 'clientName',
      subtitle: 'clientLocation',
      rating: 'rating',
      media: 'image',
    },
    prepare(selection) {
      const { title, subtitle, rating, media } = selection
      const stars = rating ? '★'.repeat(rating) + '☆'.repeat(5 - rating) : 'No rating'
      return {
        title: title,
        subtitle: `${stars} ${subtitle ? `- ${subtitle}` : ''}`,
        media: media,
      }
    }
  }
})
