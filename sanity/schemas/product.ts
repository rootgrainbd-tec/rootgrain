import { defineType, defineField } from 'sanity'

export default defineType({
  name: 'product',
  title: 'Product',
  type: 'document',
  validation: (Rule) => Rule.custom((doc: any) => {
    if (doc?.availability === 'Available' && !doc?.shippingType) {
      return {
        message: 'Shipping type is required for Available products.',
        paths: [['shippingType']],
      };
    }
    return true;
  }),
  groups: [
    { name: 'basic', title: 'Basic Info' },
    { name: 'details', title: 'Details & Specs' },
    { name: 'media', title: 'Media' },
    { name: 'seo', title: 'SEO' },
  ],
  fieldsets: [
    { name: 'pricing', title: 'Pricing', options: { columns: 2 } },
    { name: 'dimensions', title: 'Dimensions', options: { collapsible: true, collapsed: false } },
    { name: 'publishing', title: 'Publishing & Status', options: { collapsible: true, collapsed: false } },
  ],
  fields: [
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      group: 'basic',
      validation: (Rule) => Rule.required().error('Please enter a product title.'),
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      group: 'basic',
      options: { source: 'title', maxLength: 96, isUnique: (value, context) => context.defaultIsUnique(value, context) },
      validation: (Rule) => Rule.required().error('Slug is required to generate the product URL.'),
    }),
    defineField({
      name: 'lifecycleStatus',
      title: 'Lifecycle Status',
      type: 'string',
      group: 'basic',
      fieldset: 'publishing',
      initialValue: 'Active',
      options: {
        list: [
          { title: 'Active', value: 'Active' },
          { title: 'Archived', value: 'Archived' },
        ],
        layout: 'radio',
      },
      description: 'Archived products are hidden from the storefront catalog.',
    }),
    defineField({
      name: 'category',
      title: 'Category',
      type: 'reference',
      group: 'basic',
      to: [{ type: 'category' }],
      validation: (Rule) => Rule.required().error('Every product must belong to a category.'),
    }),
    defineField({
      name: 'sku',
      title: 'SKU (Stock Keeping Unit)',
      type: 'string',
      group: 'basic',
      description: 'Optional unique identifier for this product.',
    }),

    defineField({
      name: 'woodTypes',
      title: 'Wood Types',
      type: 'array',
      group: 'basic',
      of: [{ type: 'string' }],
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
      description: 'Select all wood types used in this product.',
    }),
    defineField({
      name: 'price',
      title: 'Price (BDT)',
      type: 'number',
      group: 'basic',
      fieldset: 'pricing',
      validation: (Rule) => Rule.required().positive().error('A valid positive price is required.'),
    }),
    defineField({
      name: 'comparePrice',
      title: 'Compare Price / Previous Price (BDT)',
      type: 'number',
      group: 'basic',
      fieldset: 'pricing',
      description: 'Original price before discount (shows as crossed-out price)',
    }),
    defineField({
      name: 'availability',
      title: 'Availability',
      type: 'string',
      group: 'basic',
      initialValue: 'Available',
      options: {
        list: [
          { title: 'Available', value: 'Available' },
          { title: 'Made-to-Order', value: 'Made-to-Order' },
          { title: 'Sold', value: 'Sold' },
        ],
      },
    }),
    defineField({
      name: 'shippingType',
      title: 'Shipping Type',
      type: 'string',
      group: 'basic',
      options: {
        list: [
          { title: 'Small 1', value: 'small_1' },
          { title: 'Small 2', value: 'small_2' },
          { title: 'Medium', value: 'medium' },
          { title: 'Large', value: 'large' },
          { title: 'Bulky', value: 'bulky' },
        ],
      },
    }),
    defineField({
      name: 'inStock',
      title: 'In Stock',
      type: 'boolean',
      group: 'basic',
      description: 'Uncheck this to mark the product as out of stock',
      initialValue: true,
    }),
    defineField({
      name: 'shortDescription',
      title: 'Short Description',
      type: 'text',
      group: 'details',
      rows: 3,
      validation: (Rule) => Rule.max(200).warning('Keep it concise for product cards.'),
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
      description: 'Primary image shown on product cards. Recommended aspect ratio 4:5.',
      options: { hotspot: true },
      fields: [{ name: 'alt', type: 'string', title: 'Alternative text', description: 'Describe what is in the image for accessibility and SEO.', validation: (Rule) => Rule.required().error('Alt text is required for accessibility.') }],
      validation: (Rule) => Rule.required().error('A hero image is required.'),
    }),
    defineField({
      name: 'heroVideo',
      title: 'Hero Video (Optional)',
      type: 'mux.video',
      group: 'media',
      description: 'Optional video to display in the hero section. The Hero Image will be used as the poster fallback.',
    }),
    defineField({
      name: 'galleryImages',
      title: 'Gallery Images',
      type: 'array',
      group: 'media',
      description: 'Additional images for the product carousel.',
      of: [
        { 
          type: 'image', 
          options: { hotspot: true },
          fields: [{ name: 'alt', type: 'string', title: 'Alternative text', validation: (Rule) => Rule.required().error('Alt text is required.') }]
        },
        {
          type: 'mux.video',
          title: 'Video',
        }
      ],
    }),
    defineField({
      name: 'cardPreview',
      title: 'Card Preview Configuration',
      type: 'object',
      group: 'media',
      description: 'Configure how this product appears in grids. If left empty, standard static image behavior applies.',
      fields: [
        {
          name: 'previewType',
          title: 'Preview Type',
          type: 'string',
          options: {
            list: [
              { title: 'Default / Legacy', value: 'default' },
              { title: 'Image', value: 'image' },
              { title: 'Video', value: 'video' }
            ],
            layout: 'radio'
          }
        },
        {
          name: 'imageBehavior',
          title: 'Image Behavior',
          type: 'string',
          hidden: ({ parent }) => parent?.previewType !== 'image',
          options: {
            list: [
              { title: 'Fixed Hero Image', value: 'fixed' },
              { title: 'Auto Gallery', value: 'slideshow' }
            ],
            layout: 'radio'
          }
        },
        {
          name: 'videoAutoplay',
          title: 'Video Autoplay',
          type: 'boolean',
          description: 'Play hero video automatically on scroll.',
          hidden: ({ parent }) => parent?.previewType !== 'video',
        }
      ]
    }),
    defineField({
      name: 'dimensions',
      title: 'Dimensions',
      type: 'object',
      group: 'details',
      fieldset: 'dimensions',
      fields: [
        { name: 'length', type: 'number', title: 'Length' },
        { name: 'width', type: 'number', title: 'Width' },
        { name: 'height', type: 'number', title: 'Height' },
        { name: 'unit', type: 'string', title: 'Unit', options: { list: ['inches', 'cm'] }, initialValue: 'inches' },
      ],
    }),
    defineField({
      name: 'leadTimeDays',
      title: 'Lead Time (Days)',
      type: 'number',
      group: 'details',
      description: 'Estimated days to manufacture if made-to-order.',
    }),
    defineField({
      name: 'featured',
      title: 'Featured (Show on Homepage)',
      type: 'boolean',
      group: 'basic',
      fieldset: 'publishing',
      initialValue: false,
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
      price: 'price',
      availability: 'availability',
      lifecycleStatus: 'lifecycleStatus',
      sku: 'sku',
      media: 'heroImage',
      id: '_id',
    },
    prepare(selection) {
      const { title, price, availability, lifecycleStatus, sku, media, id } = selection
      const skuText = sku ? ` [${sku}]` : ''
      const priceText = price ? `৳${price}` : 'No price'
      const statusText = availability || 'Status unknown'
      const isDraft = id && id.startsWith('drafts.')
      const pubStatus = isDraft ? '📝 Draft' : '✅ Published'
      const lifeStatus = lifecycleStatus === 'Archived' ? '🗄️ Archived | ' : ''
      
      return {
        title: `${title}${skuText}`,
        subtitle: `${lifeStatus}${pubStatus} | ${statusText} - ${priceText}`,
        media: media,
      }
    }
  }
})
