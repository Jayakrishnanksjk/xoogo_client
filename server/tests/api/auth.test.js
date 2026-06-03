import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import request from 'supertest'
import app from '../../app.js'
import { User } from '../../models/index.js'
import bcrypt from 'bcryptjs'

const TEST_USER = {
  full_name: 'Test User',
  email: 'testuser@test.com',
  password: 'TestPass123',
  role: 'superadmin',
  status: 'active',
}

let createdUserId

beforeAll(async () => {
  const hash = bcrypt.hashSync(TEST_USER.password, 10)
  const user = await User.create({
    full_name: TEST_USER.full_name,
    email: TEST_USER.email,
    password_hash: hash,
    role: TEST_USER.role,
    status: TEST_USER.status,
  })
  createdUserId = user.id
})

afterAll(async () => {
  if (createdUserId) {
    await User.destroy({ where: { id: createdUserId } })
  }
})

describe('POST /api/auth/login', () => {
  it('logs in with valid credentials', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: TEST_USER.email, password: TEST_USER.password })

    expect(res.status).toBe(200)
    expect(res.body).toHaveProperty('token')
    expect(res.body).toHaveProperty('user')
    expect(res.body.user.email).toBe(TEST_USER.email)
    expect(res.body.user).not.toHaveProperty('password_hash')
  })

  it('rejects invalid password', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: TEST_USER.email, password: 'wrongpassword' })

    expect(res.status).toBe(401)
    expect(res.body.message).toBe('Invalid credentials.')
  })

  it('rejects unknown email', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'unknown@test.com', password: 'SomePass123' })

    expect(res.status).toBe(401)
    expect(res.body.message).toBe('Invalid credentials.')
  })

  it('returns 400 when email is missing', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ password: TEST_USER.password })

    expect(res.status).toBe(400)
    expect(res.body.message).toBe('Email and password are required.')
  })
})

describe('GET /api/auth/me', () => {
  it('returns user profile with valid token', async () => {
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: TEST_USER.email, password: TEST_USER.password })

    const token = loginRes.body.token

    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${token}`)

    expect(res.status).toBe(200)
    expect(res.body.user.email).toBe(TEST_USER.email)
    expect(res.body.user).not.toHaveProperty('password_hash')
  })

  it('returns 401 without token', async () => {
    const res = await request(app).get('/api/auth/me')
    expect(res.status).toBe(401)
  })
})
