const request = require('supertest')
const app = require('../src/app')
const User = require('../src/models/user')
const { userOne, userOneId, setupDatabase } = require('./fixtures/db')

beforeEach(setupDatabase)

test('Should signip a new user', async () => {
    const response = await request(app).post('/users').send(
        {
        name: 'Roboto',
        email: 'test@mail.com',
        password: 'MySuperPAss433'
    }).expect(201)

    // Asserts that the database was changed correctly
    const user = await User.findById(response.body.user._id)
    expect(user).not.toBeNull()

    // Assertions about the response
    expect(response.body).toMatchObject({
        user: {
            name: 'Roboto',
            email: 'test@mail.com'
        },
        token: user.tokens[0].token
    })
    expect(user.password).not.toBe('dfdfdf')
})

test('Should login existing user', async () => {
    const response = await request(app).post('/users/login').send({
        email: userOne.email,
        password: userOne.password
    }).expect(200)

    const user = await User.findById(userOneId)
    expect(user).not.toBeNull()

    expect(response.body.token).toBe(user.tokens[1].token)
})

test('Should not login noneexistent user', async () => {
    await request(app).post('/users/login').send({
        email: 'milo@extra.com',
        password: 'testkdjfdkjf'
    }).expect(400)
})

test('Should get profile for user', async () => {
    await request(app)
        .get('/users/me')
        .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
        .send()
        .expect(200)
})

test('Should not get profile for unauthenticated user', async () => {
    await request(app)
        .get('/users/me')
        .send()
        .expect(401)
})

test('Should delete account for user', async () => {
    await request(app)
        .delete('/users/me')
        .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
        .send()
        .expect(200)
    const user = await User.findById(userOneId)
    expect(user).toBeNull()
})

test('Should not delete account for unauthenticated user', async () => {
    await request(app)
        .delete('/users/me')
        .send()
        .expect(401)
})

test('Should upload avatar image', async () => {
    await request(app)
        .post('/users/me/avatar')
        .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
        .attach('avatar', 'tests/fixtures/profile-pic.jpg')
        .expect(200)

    const user = await User.findById(userOneId)
    expect(user.avatar).toEqual(expect.any(Buffer))
})

test('Should update valud user fields', async () => {
    await request(app)
        .patch('/users/me')
        .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
        .send({
            name: 'New Name'
        })
        .expect(200)
        
    const user = await User.findById(userOneId)
    expect(user.name).toBe('New Name')        
})

test('Should not update invalid user fields', async () => {
    await request(app)
        .patch('/users/me')
        .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
        .send({
            location: 'Berlin'
        })
        .expect(400)
})

const shouldNotSignipUser = async (data) => {
    await request(app)
        .post('/users')
        .send(data)
        .expect(400)
}

test('should not signup user with invalid name/email/password', async () => {
    // all empty
    await shouldNotSignipUser({ name: '', email: '', password: '' })
    // missing name
    await shouldNotSignipUser({ name: '', email: 'test@test.ru', password: '1234567' })
    // wrong email
    await shouldNotSignipUser({ name: 'name', email: '@test.ru', password: '1234567' })
    // short password
    await shouldNotSignipUser({ name: 'name', email: 'test@test.ru', password: '123456' })
})

test('should not update user if unauthenticated', async () => {
    await request(app)
        .patch('/users/me')
        .send({ name: 'name' })
        .expect(401)
})

const shouldNotUpdateWrongUserData = async (data) => {
    await request(app)
        .patch('/users/me')
        .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
        .send(data)
        .expect(400)
}

test('Should not update user with invalid name/email/password', async () => {
    // all empty
    await shouldNotUpdateWrongUserData({ name: '', email: '', password: '' })
    // missing name
    await shouldNotUpdateWrongUserData({ name: '', email: 'test@test.ru', password: '1234567' })
    // wrong email
    await shouldNotUpdateWrongUserData({ name: 'name', email: '@test.ru', password: '1234567' })
    // short password
    await shouldNotUpdateWrongUserData({ name: 'name', email: 'test@test.ru', password: '123456' })
})

test('Should not delete user if unauthenticated', async () => {
    const response = await request(app)
        .delete('/users/me')
        .send()
        .expect(401)

    expect(response.body).toEqual({error: 'Please authenticate'})        
})