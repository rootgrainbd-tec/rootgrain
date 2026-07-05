import { defineType, defineField } from 'sanity'

export default defineType({
  name: 'styledText',
  title: 'Styled Text',
  type: 'object',
  fields: [
    defineField({
      name: 'text',
      title: 'Text Content',
      type: 'text',
      description: 'The actual text to display. You can use *text* for italic/highlighted parts.',
    }),
    defineField({
      name: 'fontSize',
      title: 'Font Size',
      type: 'string',
      options: {
        list: [
          { title: 'Small', value: 'text-sm md:text-base lg:text-base' },
          { title: 'Normal', value: 'text-base md:text-lg lg:text-lg' },
          { title: 'Large', value: 'text-lg md:text-xl lg:text-xl' },
          { title: 'Extra Large', value: 'text-2xl md:text-4xl lg:text-5xl' },
          { title: 'Huge', value: 'text-5xl md:text-7xl lg:text-8xl' },
        ],
      },
      initialValue: 'text-base md:text-lg lg:text-lg',
    }),
    defineField({
      name: 'textAlign',
      title: 'Text Alignment',
      type: 'string',
      options: {
        list: [
          { title: 'Left', value: 'text-left' },
          { title: 'Center', value: 'text-center' },
          { title: 'Right', value: 'text-right' },
        ],
      },
      initialValue: 'text-center',
    }),
    defineField({
      name: 'marginTop',
      title: 'Move Down (Margin Top)',
      type: 'number',
      description: 'Add space above the text in pixels (e.g., 20)',
    }),
    defineField({
      name: 'marginBottom',
      title: 'Move Up (Margin Bottom)',
      type: 'number',
      description: 'Add space below the text in pixels (e.g., 20)',
    }),
    defineField({
      name: 'marginLeft',
      title: 'Move Right (Margin Left)',
      type: 'number',
      description: 'Add space to the left in pixels (e.g., 20)',
    }),
    defineField({
      name: 'marginRight',
      title: 'Move Left (Margin Right)',
      type: 'number',
      description: 'Add space to the right in pixels (e.g., 20)',
    }),
  ],
})
