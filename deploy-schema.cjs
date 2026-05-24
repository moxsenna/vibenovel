// Script sementara untuk deploy schema ke Supabase
const { Client } = require('pg')
const fs = require('fs')
const path = require('path')

const sql = fs.readFileSync(path.join(__dirname, 'supabase', 'schema.sql'), 'utf8')

const client = new Client({
  // Pooler requires username format: postgres.[project-ref]
  connectionString: 'postgresql://postgres.sdsajrlrjxhtuuyymykl:yICZvZb8TuKLEuIE@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres',

  ssl: { rejectUnauthorized: false }
})

async function run() {
  try {
    console.log('Connecting to Supabase...')
    await client.connect()
    console.log('Connected! Deploying schema...')
    await client.query(sql)
    console.log('✅ Schema deployed successfully!')
  } catch (err) {
    console.error('❌ Error:', err.message)
    if (err.detail) console.error('Detail:', err.detail)
  } finally {
    await client.end()
  }
}

run()
