import 'dotenv/config';
import fetch from 'node-fetch';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;
const CIN7_API_URL = process.env.CIN7_API_URL;
const CIN7_USERNAME = process.env.CIN7_USERNAME;
const CIN7_API_KEY = process.env.CIN7_API_KEY;

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

if (!globalThis.fetch) {
  globalThis.fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
}

function getAuthHeader() {
  return 'Basic ' + Buffer.from(`${CIN7_USERNAME}:${CIN7_API_KEY}`).toString('base64');
}

async function fetchCin7Products() {
  const allProducts = [];
  let page = 1;
  let fetched = 0;
  const pageSize = 250;

  while (true) {
    const url = `${CIN7_API_URL}/Products?page=${page}&rows=${pageSize}`;
    const headers = {
      Authorization: getAuthHeader(),
      'Content-Type': 'application/json',
    };
    const res = await fetch(url, { headers });
    const data = await res.json();

    if (!Array.isArray(data) || data.length === 0) break;

    allProducts.push(...data);
    fetched += data.length;
    if (data.length < pageSize) break; // Last page reached

    page++;
  }

  console.log(`Fetched ${allProducts.length} products from Cin7.`);
  return Array.isArray(allProducts) ? allProducts : allProducts.Products || [];
}

async function fetchCin7Stock(productId) {
  const url = `${CIN7_API_URL}/Stock?productId=${productId}`;
  const headers = {
    Authorization: getAuthHeader(),
    'Content-Type': 'application/json',
  };
  const res = await fetch(url, { headers });
  return await res.json();
}

async function sync() {
  const products = await fetchCin7Products();
  for (const product of products) {
    const { data, error } = await supabase.from('products').upsert(product);
    if (error) {
      console.error('Supabase error:', error);
    } else {
      console.log('Inserted/Upserted product:', data);
    }
    const stockItems = await fetchCin7Stock(product.id);
    if (Array.isArray(stockItems)) {
      for (const stock of stockItems) {
        await supabase.from('stock').upsert(
          {
            product_id: product.id,
            ...stock
          },
          { onConflict: ['product_id', 'branch_id', 'product_option_id'] }
        );
      }
    }
    console.log(`Synced product ${product.id} and ${stockItems.length || 0} stock items.`);
  }
  console.log('Sync complete!');
}

console.log('SUPABASE_URL:', process.env.SUPABASE_URL);
console.log('SUPABASE_KEY:', process.env.SUPABASE_KEY ? 'set' : 'NOT SET');

const res = await fetch(`${process.env.SUPABASE_URL}/rest/v1/products`, {
  headers: {
    apikey: process.env.SUPABASE_KEY,
    Authorization: `Bearer ${process.env.SUPABASE_KEY}`,
  }
});
console.log('Test fetch status:', res.status);

sync(); 