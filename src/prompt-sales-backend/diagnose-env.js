const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env.development') });

console.log('=== DIAGNOSING ENVIRONMENT VARIABLES ===');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('DB_HOST:', process.env.DB_HOST);
console.log('DB_PORT:', process.env.DB_PORT);
console.log('DB_USERNAME:', process.env.DB_USERNAME);
console.log('DB_PASSWORD exists?', !!process.env.DB_PASSWORD);
console.log('DB_PASSWORD length:', process.env.DB_PASSWORD?.length);
console.log('DB_NAME:', process.env.DB_NAME);
console.log('=======================================');

// También verifica el archivo directamente
const fs = require('fs');
try {
  const envContent = fs.readFileSync('.env.development', 'utf8');
  console.log('\n=== .env.development CONTENT ===');
  console.log(envContent);
  console.log('================================');
} catch (err) {
  console.error('Cannot read .env.development:', err.message);
}

//PS C:\Users\oscar\Documents\SEMESTRE_4\diseño\randysWork\proyecto\prompt-sales-backend\src>