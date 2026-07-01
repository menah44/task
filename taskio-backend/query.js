const { Client } = require('pg');

async function run() {
  const client = new Client({
    host: 'localhost',
    port: 5432,
    user: 'postgres',
    password: '1234',
    database: 'taskio_db'
  });

  try {
    await client.connect();
    const res = await client.query(`SELECT id, email, password FROM "user"`);
    console.log("Found users:");
    console.log(res.rows);
  } catch (err) {
    console.error("Error running query", err);
  } finally {
    await client.end();
  }
}

run();
