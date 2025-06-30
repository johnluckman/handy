import 'dotenv/config';
import fetch from 'node-fetch';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;
const CIN7_API_URL = process.env.CIN7_API_URL;
const CIN7_USERNAME = process.env.CIN7_USERNAME;
const CIN7_API_KEY = process.env.CIN7_API_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

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
    if (data.length < pageSize) break;
    page++;
  }
  console.log(`Fetched ${allProducts.length} products from Cin7 (for stock sync).`);
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

async function syncStock() {
  const products = await fetchCin7Products();
  let totalStockItems = 0;
  for (const product of products) {
    const stockItems = await fetchCin7Stock(product.id);
    if (Array.isArray(stockItems)) {
      for (const stock of stockItems) {
        const row = {
          productId: stock.ProductId || stock.productOptionId,
          productOptionId: stock.productOptionId,
          modifiedDate: stock.modifiedDate,
          styleCode: stock.styleCode,
          code: stock.code,
          barcode: stock.barcode,
          branchId: stock.branchId,
          branchName: stock.branchName,
          productName: stock.productName,
          option1: stock.option1,
          option2: stock.option2,
          option3: stock.option3,
          size: stock.size,
          available: stock.available,
          stockOnHand: stock.stockOnHand,
          openSales: stock.openSales,
          incoming: stock.incoming,
          virtual: stock.virtual,
          holding: stock.holding
        };
        const { error } = await supabase.from('stock').upsert(row, {
          onConflict: ['productId', 'productOptionId', 'branchId']
        });
        if (error) {
          console.error('Supabase stock upsert error:', error);
        } else {
          totalStockItems++;
        }
      }
      console.log(`Synced stock for product ${product.id} (${stockItems.length} items).`);
    }
  }
  console.log(`Stock sync complete! Total stock items upserted: ${totalStockItems}`);
}

syncStock(); 