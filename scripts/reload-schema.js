const postgres = require('postgres');
const sql = postgres('postgresql://postgres:postgres@127.0.0.1:54322/postgres');

async function main() {
  try {
    console.log('Reloading PostgREST schema cache...');
    await sql`NOTIFY pgrst, 'reload schema'`;
    console.log('Schema cache reloaded successfully!');
  } catch (err) {
    console.error('Failed to reload schema:', err);
  } finally {
    await sql.end();
  }
}

main();
