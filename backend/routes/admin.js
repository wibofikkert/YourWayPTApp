import { Router } from 'express'
import bcrypt from 'bcryptjs'
import db from '../database.js'
import { authenticate } from '../middleware/auth.js'

const router = Router()

// Admin-only guard middleware
function adminOnly(req, res, next) {
  if (!req.trainer.is_admin) {
    return res.status(403).json({ error: 'Admin toegang vereist' })
  }
  next()
}

router.use(authenticate)
router.use(adminOnly)

// GET /api/admin/trainers — list all trainers with stats
router.get('/trainers', (req, res) => {
  const trainers = db.prepare(`
    SELECT
      t.id,
      t.name,
      t.email,
      t.is_admin,
      t.is_active,
      t.created_at,
      COUNT(DISTINCT c.id)  AS client_count,
      COUNT(DISTINCT ws.id) AS session_count
    FROM trainers t
    LEFT JOIN clients c  ON c.trainer_id = t.id
    LEFT JOIN workout_sessions ws ON ws.trainer_id = t.id
    GROUP BY t.id
    ORDER BY t.created_at DESC
  `).all()
  res.json(trainers)
})

// GET /api/admin/trainers/:id — single trainer with full details
router.get('/trainers/:id', (req, res) => {
  const trainer = db.prepare(
    'SELECT id, name, email, is_admin, is_active, created_at FROM trainers WHERE id = ?'
  ).get(req.params.id)
  if (!trainer) return res.status(404).json({ error: 'Trainer niet gevonden' })

  const clients = db.prepare(`
    SELECT c.*, COUNT(ws.id) AS session_count
    FROM clients c
    LEFT JOIN workout_sessions ws ON ws.client_id = c.id
    WHERE c.trainer_id = ?
    GROUP BY c.id
    ORDER BY c.name
  `).all(req.params.id)

  res.json({ ...trainer, clients })
})

// POST /api/admin/trainers — create trainer account (admin-created, no password needed initially)
router.post('/trainers', (req, res) => {
  const { name, email, password } = req.body
  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Naam, e-mail en wachtwoord zijn verplicht' })
  }
  const existing = db.prepare('SELECT id FROM trainers WHERE email = ?').get(email)
  if (existing) {
    return res.status(409).json({ error: 'E-mailadres is al in gebruik' })
  }
  const password_hash = bcrypt.hashSync(password, 12)
  const result = db.prepare(
    'INSERT INTO trainers (name, email, password_hash, is_active) VALUES (?, ?, ?, 1)'
  ).run(name, email, password_hash)
  const trainer = db.prepare(
    'SELECT id, name, email, is_admin, is_active, created_at FROM trainers WHERE id = ?'
  ).get(result.lastInsertRowid)
  res.status(201).json(trainer)
})

// PUT /api/admin/trainers/:id — update trainer (name, email, active status, reset password)
router.put('/trainers/:id', (req, res) => {
  const trainer = db.prepare('SELECT id, is_admin FROM trainers WHERE id = ?').get(req.params.id)
  if (!trainer) return res.status(404).json({ error: 'Trainer niet gevonden' })

  // Prevent removing admin status from the designated admin
  const ADMIN_EMAIL = 'wibo.fikkert@gmail.com'
  const current = db.prepare('SELECT email FROM trainers WHERE id = ?').get(req.params.id)
  if (current.email === ADMIN_EMAIL && req.body.is_active === 0) {
    return res.status(400).json({ error: 'Het admin account kan niet gedeactiveerd worden' })
  }

  const { name, email, is_active, password } = req.body

  if (password) {
    if (password.length < 6) return res.status(400).json({ error: 'Wachtwoord minimaal 6 tekens' })
    const password_hash = bcrypt.hashSync(password, 12)
    db.prepare('UPDATE trainers SET password_hash = ? WHERE id = ?').run(password_hash, req.params.id)
  }

  db.prepare(
    'UPDATE trainers SET name = COALESCE(?, name), email = COALESCE(?, email), is_active = COALESCE(?, is_active) WHERE id = ?'
  ).run(name ?? null, email ?? null, is_active ?? null, req.params.id)

  const updated = db.prepare(
    'SELECT id, name, email, is_admin, is_active, created_at FROM trainers WHERE id = ?'
  ).get(req.params.id)
  res.json(updated)
})

// DELETE /api/admin/trainers/:id — delete trainer and all their data
router.delete('/trainers/:id', (req, res) => {
  const trainer = db.prepare('SELECT id, email FROM trainers WHERE id = ?').get(req.params.id)
  if (!trainer) return res.status(404).json({ error: 'Trainer niet gevonden' })

  const ADMIN_EMAIL = 'wibo.fikkert@gmail.com'
  if (trainer.email === ADMIN_EMAIL) {
    return res.status(400).json({ error: 'Het admin account kan niet verwijderd worden' })
  }
  // Prevent self-deletion
  if (trainer.id === req.trainer.id) {
    return res.status(400).json({ error: 'Je kunt je eigen account niet verwijderen' })
  }

  db.prepare('DELETE FROM trainers WHERE id = ?').run(req.params.id)
  res.json({ success: true })
})

// PUT /api/admin/clients/:id/reassign — verplaats klant naar andere trainer
router.put('/clients/:id/reassign', (req, res) => {
  const client = db.prepare('SELECT id, name FROM clients WHERE id = ?').get(req.params.id)
  if (!client) return res.status(404).json({ error: 'Klant niet gevonden' })

  const { trainer_id } = req.body
  if (!trainer_id) return res.status(400).json({ error: 'trainer_id is verplicht' })

  const trainer = db.prepare('SELECT id FROM trainers WHERE id = ? AND is_active = 1').get(trainer_id)
  if (!trainer) return res.status(404).json({ error: 'Trainer niet gevonden of inactief' })

  db.prepare('UPDATE clients SET trainer_id = ? WHERE id = ?').run(trainer_id, req.params.id)
  const updated = db.prepare(`
    SELECT c.*, t.name as trainer_name
    FROM clients c JOIN trainers t ON t.id = c.trainer_id
    WHERE c.id = ?
  `).get(req.params.id)
  res.json(updated)
})

// GET /api/admin/stats — global platform stats
router.get('/stats', (req, res) => {
  const stats = {
    trainers:  db.prepare('SELECT COUNT(*) AS n FROM trainers').get().n,
    active:    db.prepare('SELECT COUNT(*) AS n FROM trainers WHERE is_active = 1').get().n,
    clients:   db.prepare('SELECT COUNT(*) AS n FROM clients').get().n,
    sessions:  db.prepare('SELECT COUNT(*) AS n FROM workout_sessions').get().n,
    sets:      db.prepare('SELECT COUNT(*) AS n FROM workout_sets').get().n,
  }
  res.json(stats)
})

export default router
