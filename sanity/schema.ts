import { type SchemaTypeDefinition } from 'sanity'
import category from './schemas/category'
import product from './schemas/product'
import craftsmanshipStep from './schemas/craftsmanshipStep'
import testimonial from './schemas/testimonial'
import homepage from './schemas/homepage'
import workshop from './schemas/workshop'

export const schema: { types: SchemaTypeDefinition[] } = {
  types: [
    category,
    product,
    craftsmanshipStep,
    testimonial,
    homepage,
    workshop,
  ],
}
