import { Router } from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import db from '../database.js'
import { authenticate } from '../middleware/auth.js'
import 'dotenv/config'

const router = Router()
const ADMIN_EMAIL = 'wibo.fikkert@gmail.com'

function signToken(trainer) {
  return jwt.sign(
    { id: trainer.id, email: trainer.email, name: trainer.name, is_admin: trainer.is_admin === 1 },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  )
}

// POST /api/auth/register
router.post('/register', (req, res) => {
  const { name, email, password } = req.body
  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Name, email and password are required' })
  }
  if (password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters' })
  }
  const existing = db.prepare('SELECT id FROM trainers WHERE email = ?').get(email)
  if (existing) {
    return res.status(409).json({ error: 'Email already in use' })
  }
  const password_hash = bcrypt.hashSync(password, 12)
  const is_admin = email === ADMIN_EMAIL ? 1 : 0
  const result = db.prepare(
    'INSERT INTO trainers (name, email, password_hash, is_admin) VALUES (?, ?, ?, ?)'
  ).run(name, email, password_hash, is_admin)
  const trainer = { id: result.lastInsertRowid, name, email, is_admin }
  res.status(201).json({ token: signToken(trainer), trainer })
})

// POST /api/auth/login
router.post('/login', (req, res) => {
  const { email, password } = req.body
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' })
  }
  const trainer = db.prepare('SELECT * FROM trainers WHERE email = ?').get(email)
  if (!trainer || !bcrypt.compareSync(password, trainer.password_hash)) {
    return res.status(401).json({ error: 'Invalid email or password' })
  }
  if (!trainer.is_active) {
    return res.status(403).json({ error: 'Je account is gedeactiveerd. Neem contact op met de beheerder.' })
  }
  const { password_hash, ...trainerData } = trainer
  res.json({ token: signToken(trainer), trainer: trainerData })
})

// GET /api/auth/me
router.get('/me', authenticate, (req, res) => {
  const trainer = db.prepare(
    'SELECT id, name, email, is_admin, is_active, created_at FROM trainers WHERE id = ?'
  ).get(req.trainer.id)
  if (!trainer) return res.status(404).json({ error: 'Trainer not found' })
  if (!trainer.is_active) return res.status(403).json({ error: 'Account gedeactiveerd' })
  res.json(trainer)
})

export default router
