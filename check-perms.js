const { Client } = require('pg');
const client = new Client({
  connectionString: 'postgres://postgres.gmhapobvupmmxbpyhbti:xp7t8o6YPP6LQ5lg@aws-0-us-east-1.pooler.supabase.com:5432/postgres?sslmode=require'
});
async function run() {
  await client.connect();
  await client.query('DROP INDEX IF EXISTS "Team_name_key"');
  console.log('Dropped Team_name_key unique index');
  
  // Verify
  const idx = await client.query("SELECT indexname FROM pg_indexes WHERE tablename = 'Team'");
  console.log('Remaining Team indexes:', idx.rows.map(r => r.indexname));
  
  await client.end();
}
run().catch(e => { console.error('Error:', e.message); process.exit(1); });
