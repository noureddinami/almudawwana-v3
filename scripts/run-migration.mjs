import { readFileSync } from 'fs';

// Read .env.local manually
const envContent = readFileSync('.env.local', 'utf-8');
const env = {};
for (const line of envContent.split('\n')) {
  const match = line.match(/^([^#=]+)=(.*)$/);
  if (match) env[match[1].trim()] = match[2].trim();
}

const sql = readFileSync('supabase/migrations/20260518_create_code_requests.sql', 'utf-8');

// Use the PostgREST pg_dump approach — run SQL via the Supabase SQL API
const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = env.SUPABASE_SERVICE_KEY;

// Try via the pg_net / query endpoint
const res = await fetch(`${supabaseUrl}/rest/v1/rpc/`, {
  method: 'POST',
  headers: {
    'apikey': serviceKey,
    'Authorization': `Bearer ${serviceKey}`,
    'Content-Type': 'application/json',
    'Prefer': 'return=minimal',
  },
  body: JSON.stringify({}),
});

console.log('Supabase URL:', supabaseUrl);
console.log('\nThe exec_sql RPC is not available by default.');
console.log('Please run this SQL in the Supabase SQL Editor:');
console.log('Go to: https://supabase.com/dashboard/project/aoojpafediogwfdacqww/sql');
console.log('\n--- Copy everything below ---\n');
console.log(sql);
