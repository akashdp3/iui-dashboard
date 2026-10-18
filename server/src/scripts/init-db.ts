import 'dotenv/config'
import { openDb } from '../db.js'

const db = openDb()
console.log(`Initialized database at ${db.name}`)
db.close()
