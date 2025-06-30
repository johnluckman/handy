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
    if (product.productOptions && Array.isArray(product.productOptions) && product.productOptions.length > 0) {
      for (const option of product.productOptions) {
        const row = {
          // Product fields (from parent)
          id: product.id,
          status: product.status,
          createdDate: product.createdDate,
          modifiedDate: product.modifiedDate,
          styleCode: product.styleCode,
          name: product.name,
          description: product.description,
          tags: product.tags,
          images: product.images,
          pdfUpload: product.pdfUpload,
          pdfDescription: product.pdfDescription,
          supplierId: product.supplierId,
          brand: product.brand,
          category: product.category,
          subCategory: product.subCategory,
          categoryIdArray: product.categoryIdArray,
          channels: product.channels,
          weight: product.weight,
          height: product.height,
          width: product.width,
          length: product.length,
          volume: product.volume,
          stockControl: product.stockControl,
          orderType: product.orderType,
          productType: product.productType,
          productSubtype: product.productSubtype,
          projectName: product.projectName,
          optionLabel1: product.optionLabel1,
          optionLabel2: product.optionLabel2,
          optionLabel3: product.optionLabel3,
          salesAccount: product.salesAccount,
          purchasesAccount: product.purchasesAccount,
          importCustomsDuty: product.importCustomsDuty,
          sizeRangeId: product.sizeRangeId,
          customFields: product.customFields,

          // Product Option fields (from option, with prefix)
          option_id: option.id,
          option_createdDate: option.createdDate,
          option_modifiedDate: option.modifiedDate,
          option_status: option.status,
          option_productId: option.productId,
          code: option.code,
          barcode: option.barcode,
          productOptionCode: option.productOptionCode,
          productOptionSizeCode: option.productOptionSizeCode,
          productOptionBarcode: option.productOptionBarcode,
          productOptionSizeBarcode: option.productOptionSizeBarcode,
          supplierCode: option.supplierCode,
          option1: option.option1,
          option2: option.option2,
          option3: option.option3,
          optionWeight: option.optionWeight,
          size: option.size,
          sizeId: option.sizeId,
          retailPrice: option.retailPrice,
          wholesalePrice: option.wholesalePrice,
          vipPrice: option.vipPrice,
          specialPrice: option.specialPrice,
          specialsStartDate: option.specialsStartDate,
          specialDays: option.specialDays,
          stockAvailable: option.stockAvailable,
          stockOnHand: option.stockOnHand,
          uomOptions: option.uomOptions,
          image: option.image,
          priceColumns: option.priceColumns
        };
        const { data, error } = await supabase.from('products').upsert(row);
        if (error) {
          console.error('Supabase error:', error);
        } else {
          console.log('Inserted/Upserted product option:', data);
        }
      }
    }
    // If no productOptions, skip (do not upsert parent product)
    console.log(`Synced product ${product.id}.`);
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