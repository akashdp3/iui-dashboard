import 'dotenv/config'
import { createApp } from './app.js'
import { openDb } from './db.js'

const port = Number(process.env.PORT ?? 3001)
const app = createApp(openDb())

app.listen(port, () => {
  console.log(`Server listening on http://localhost:${port}`)
})
