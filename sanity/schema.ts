import { type SchemaTypeDefinition } from 'sanity'
import category from './schemas/category'
import categoryGroup from './schemas/categoryGroup'
import product from './schemas/product'
import craftsmanshipStep from './schemas/craftsmanshipStep'
import testimonial from './schemas/testimonial'
import homepage from './schemas/homepage'
import workshop from './schemas/workshop'
import siteSettings from './schemas/siteSettings'
import subscriber from './schemas/subscriber'
import styledText from './schemas/styledText'

export const schema: { types: SchemaTypeDefinition[] } = {
  types: [
    styledText,
    categoryGroup,
    category,
    product,
    craftsmanshipStep,
    testimonial,
    homepage,
    workshop,
    siteSettings,
    subscriber,
  ],
}
