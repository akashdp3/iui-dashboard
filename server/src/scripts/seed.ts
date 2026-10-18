import 'dotenv/config'
import { openDb } from '../db.js'
import { seedDb } from '../seed.js'

const db = openDb()
console.log(`Seeded ${db.name}:`, seedDb(db))
db.close()
