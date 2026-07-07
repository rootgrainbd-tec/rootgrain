const { createClient } = require('next-sanity');

const client = createClient({
  projectId: 'uuu315g5',
  dataset: 'production',
  useCdn: false,
  apiVersion: '2023-01-01'
});

client.fetch('*[_type == "product"]{title, woodType}').then(console.log).catch(console.error);
