import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import path from 'path'
import { fileURLToPath } from 'url'
import { initDB } from './database.js'
import authRoutes from './routes/auth.js'
import clientRoutes from './routes/clients.js'
import exerciseRoutes from './routes/exercises.js'
import workoutRoutes from './routes/workouts.js'
import adminRoutes from './routes/admin.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const app = express()
const PORT = process.env.PORT || 3001
const isProd = process.env.NODE_ENV === 'production'

// Initialize database schema
initDB()

// CORS: allow localhost in dev, same-origin in production
if (!isProd) {
  app.use(cors({ origin: 'http://localhost:3000', credentials: true }))
}
app.use(express.json())

// API Routes
app.use('/api/auth', authRoutes)
app.use('/api/clients', clientRoutes)
app.use('/api/exercises', exerciseRoutes)
app.use('/api/workouts', workoutRoutes)
app.use('/api/admin', adminRoutes)

// Health check
app.get('/api/health', (req, res) => res.json({ status: 'ok' }))

// In production: serve the React build
if (isProd) {
  const frontendBuild = path.join(__dirname, 'public')
  app.use(express.static(frontendBuild))
  // All non-API routes → React index.html (client-side routing)
  app.get('*', (req, res) => {
    res.sendFile(path.join(frontendBuild, 'index.html'))
  })
}

// Global error handler
app.use((err, req, res, next) => {
  console.error(err)
  res.status(err.status || 500).json({ error: err.message || 'Internal server error' })
})

app.listen(PORT, () => {
  console.log(`PT App running on http://localhost:${PORT} [${isProd ? 'production' : 'development'}]`)
})
