const { createClient } = require('next-sanity');

const client = createClient({
  projectId: 'uuu315g5',
  dataset: 'production',
  useCdn: false,
  apiVersion: '2023-01-01',
  token: 'skzgboJ3CnNqBLjiZnRSW0nVKwNj9C6QpJHtMFGV3QGeYnx5pH4QVijC3CbYvw1eZ6nF2bQeZr4KDC5bk9FPazRtoww9VyzcFab5jW2LWhKMrs8wxQveRZCfYsXhaGzDuaNgDKLS0Q1bpWVjjAAeoO4FoLrjeoF9j0mWWkCdkcOeBY7P7b8c'
});

async function fixWoodTypes() {
  const products = await client.fetch('*[_type == "product"]{_id, woodType}');
  
  for (const p of products) {
    if (p.woodType === 'Mehogony and Sisu' || p.woodType === 'Mehogony') {
      console.log(`Fixing ${p._id} to Mahogany`);
      await client.patch(p._id).set({ woodType: 'Mahogany' }).commit();
    } else if (p.woodType === 'Walnut') {
      console.log(`Fixing ${p._id} to American Black Walnut`);
      await client.patch(p._id).set({ woodType: 'American Black Walnut' }).commit();
    }
  }
  console.log('Done!');
}

fixWoodTypes().catch(console.error);
