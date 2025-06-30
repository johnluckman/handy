require('dotenv').config();
const https = require('https');

let CIN7_API_URL = process.env.CIN7_API_URL || 'https://api.cin7.com/api/v1';
if (!CIN7_API_URL.endsWith('/Products')) {
  CIN7_API_URL = CIN7_API_URL.replace(/\/?$/, '/Products');
}
const CIN7_USERNAME = process.env.CIN7_USERNAME || 'your_username';
const CIN7_API_KEY = process.env.CIN7_API_KEY || 'your_api_key';

const auth = Buffer.from(`${CIN7_USERNAME}:${CIN7_API_KEY}`).toString('base64');

const options = {
  method: 'GET',
  headers: {
    'Authorization': `Basic ${auth}`,
    'Content-Type': 'application/json',
  }
};

console.log('Checking Cin7 API credentials...');
https.get(CIN7_API_URL + '?page=1&rows=1', options, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    console.log('Status:', res.statusCode);
    try {
      const json = JSON.parse(data);
      console.log('Response:', JSON.stringify(json, null, 2));
    } catch (e) {
      console.log('Raw response:', data);
    }
    if (res.statusCode === 200) {
      console.log('✅ Credentials are working!');
    } else if (res.statusCode === 401 || res.statusCode === 403) {
      console.log('❌ Authorization failed. Check your username and API key.');
    } else {
      console.log('❌ Unexpected status. See response above.');
    }
  });
}).on('error', (err) => {
  console.error('Request error:', err);
}); 