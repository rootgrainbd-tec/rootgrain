"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var sanity_1 = require("sanity");
exports.default = (0, sanity_1.defineType)({
    name: 'product',
    title: 'Product',
    type: 'document',
    validation: function (Rule) { return Rule.custom(function (doc) {
        if ((doc === null || doc === void 0 ? void 0 : doc.availability) === 'Available' && !(doc === null || doc === void 0 ? void 0 : doc.shippingType)) {
            return {
                message: 'Shipping type is required for Available products.',
                paths: [['shippingType']],
            };
        }
        return true;
    }); },
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
        (0, sanity_1.defineField)({
            name: 'title',
            title: 'Title',
            type: 'string',
            group: 'basic',
            validation: function (Rule) { return Rule.required().error('Please enter a product title.'); },
        }),
        (0, sanity_1.defineField)({
            name: 'slug',
            title: 'Slug',
            type: 'slug',
            group: 'basic',
            options: { source: 'title', maxLength: 96, isUnique: function (value, context) { return context.defaultIsUnique(value, context); } },
            validation: function (Rule) { return Rule.required().error('Slug is required to generate the product URL.'); },
        }),
        (0, sanity_1.defineField)({
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
        (0, sanity_1.defineField)({
            name: 'category',
            title: 'Category',
            type: 'reference',
            group: 'basic',
            to: [{ type: 'category' }],
            validation: function (Rule) { return Rule.required().error('Every product must belong to a category.'); },
        }),
        (0, sanity_1.defineField)({
            name: 'sku',
            title: 'SKU (Stock Keeping Unit)',
            type: 'string',
            group: 'basic',
            description: 'Optional unique identifier for this product.',
        }),
        (0, sanity_1.defineField)({
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
            validation: function (Rule) { return Rule.required().error('Wood type is required.'); },
        }),
        (0, sanity_1.defineField)({
            name: 'price',
            title: 'Price (BDT)',
            type: 'number',
            group: 'basic',
            fieldset: 'pricing',
            validation: function (Rule) { return Rule.required().positive().error('A valid positive price is required.'); },
        }),
        (0, sanity_1.defineField)({
            name: 'comparePrice',
            title: 'Compare Price / Previous Price (BDT)',
            type: 'number',
            group: 'basic',
            fieldset: 'pricing',
            description: 'Original price before discount (shows as crossed-out price)',
        }),
        (0, sanity_1.defineField)({
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
        (0, sanity_1.defineField)({
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
        (0, sanity_1.defineField)({
            name: 'inStock',
            title: 'In Stock',
            type: 'boolean',
            group: 'basic',
            description: 'Uncheck this to mark the product as out of stock',
            initialValue: true,
        }),
        (0, sanity_1.defineField)({
            name: 'shortDescription',
            title: 'Short Description',
            type: 'text',
            group: 'details',
            rows: 3,
            validation: function (Rule) { return Rule.max(200).warning('Keep it concise for product cards.'); },
        }),
        (0, sanity_1.defineField)({
            name: 'fullDescription',
            title: 'Full Description',
            type: 'array',
            group: 'details',
            of: [{ type: 'block' }],
        }),
        (0, sanity_1.defineField)({
            name: 'heroImage',
            title: 'Hero Image',
            type: 'image',
            group: 'media',
            description: 'Primary image shown on product cards. Recommended aspect ratio 4:5.',
            options: { hotspot: true },
            fields: [{ name: 'alt', type: 'string', title: 'Alternative text', description: 'Describe what is in the image for accessibility and SEO.', validation: function (Rule) { return Rule.required().error('Alt text is required for accessibility.'); } }],
            validation: function (Rule) { return Rule.required().error('A hero image is required.'); },
        }),
        (0, sanity_1.defineField)({
            name: 'galleryImages',
            title: 'Gallery Images',
            type: 'array',
            group: 'media',
            description: 'Additional images for the product carousel.',
            of: [
                {
                    type: 'image',
                    options: { hotspot: true },
                    fields: [{ name: 'alt', type: 'string', title: 'Alternative text', validation: function (Rule) { return Rule.required().error('Alt text is required.'); } }]
                }
            ],
        }),
        (0, sanity_1.defineField)({
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
        (0, sanity_1.defineField)({
            name: 'leadTimeDays',
            title: 'Lead Time (Days)',
            type: 'number',
            group: 'details',
            description: 'Estimated days to manufacture if made-to-order.',
        }),
        (0, sanity_1.defineField)({
            name: 'featured',
            title: 'Featured (Show on Homepage)',
            type: 'boolean',
            group: 'basic',
            fieldset: 'publishing',
            initialValue: false,
        }),
        (0, sanity_1.defineField)({
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
        prepare: function (selection) {
            var title = selection.title, price = selection.price, availability = selection.availability, lifecycleStatus = selection.lifecycleStatus, sku = selection.sku, media = selection.media, id = selection.id;
            var skuText = sku ? " [".concat(sku, "]") : '';
            var priceText = price ? "\u09F3".concat(price) : 'No price';
            var statusText = availability || 'Status unknown';
            var isDraft = id && id.startsWith('drafts.');
            var pubStatus = isDraft ? '📝 Draft' : '✅ Published';
            var lifeStatus = lifecycleStatus === 'Archived' ? '🗄️ Archived | ' : '';
            return {
                title: "".concat(title).concat(skuText),
                subtitle: "".concat(lifeStatus).concat(pubStatus, " | ").concat(statusText, " - ").concat(priceText),
                media: media,
            };
        }
    }
});
