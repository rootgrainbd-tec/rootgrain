import type { StructureResolver } from 'sanity/structure'

export const structure: StructureResolver = (S) =>
  S.list()
    .title('RootGrain Content')
    .items([
      // Singleton: Site Settings
      S.listItem()
        .title('Site Settings')
        .id('siteSettings')
        .child(
          S.document()
            .schemaType('siteSettings')
            .documentId('siteSettings')
        ),

      // Singleton: Homepage
      S.listItem()
        .title('Homepage')
        .id('homepage')
        .child(
          S.document()
            .schemaType('homepage')
            .documentId('homepage')
        ),

      S.divider(),

      // Filter out the singletons and decommissioned schemas from the main list
      ...S.documentTypeListItems().filter(
        (listItem) =>
          !['siteSettings', 'homepage', 'subscriber'].includes(listItem.getId() as string)
      ),
    ])
