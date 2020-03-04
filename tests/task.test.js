const request = require('supertest')
require('./jest.extend')
const app = require('../src/app')
const Task = require('../src/models/task')
const { userOne, userTwo, taskOne, taskTwo, taskThree, setupDatabase } = require('./fixtures/db')

beforeEach(setupDatabase)

test('should create task for user', async () => {
    const response = await request(app)
        .post('/tasks')
        .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
        .send({
            description: 'From my test'
        })
        .expect(201)

    const task = await Task.findById(response.body._id)
    expect(task).not.toBeNull()
    expect(task.completed).toEqual(false)
})

test('should user one has two tasks', async () => {
    const response = await request(app)
        .get('/tasks')
        .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
        .send()
        .expect(200)

    expect(response.body.length).toBe(2)
})

test('Should not user delete other users task', async () => {
    const response = await request(app)
        .delete(`/tasks/${taskOne._id}`)
        .set('Authorization', `Bearer ${userTwo.tokens[0].token}`)
        .send()
        .expect(404)

    const task = await Task.findById(taskOne._id)
    expect(task).not.toBeNull()
})

const wrongTaskDataOnPost = async (data) => {
    await request(app)
        .post(`/tasks`)
        .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
        .send(data)
        .expect(400)
}

test('Should not create task with invalid description/completed', async () => {
    // missing description field name
    await wrongTaskDataOnPost({ completed: true })

    // missing description field name
    await wrongTaskDataOnPost({ description: '', completed: true })

    // wrong completed field name
    await wrongTaskDataOnPost({ description: 'correct', completed: { error: 'test' } })
})

const wrongTaskDataOnPatch = async (data) => {
    return await request(app)
        .patch(`/tasks/${taskOne._id}`)
        .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
        .send(data)
        .expect(400)
}

test('Should not update task with invalid description/completed', async () => {
    // missing description field name
    let response = await wrongTaskDataOnPatch({ description: '' })

    // wrong description field name
    response = await wrongTaskDataOnPatch({ desc: 'name' })
    expect(response.body).toEqual({ error: 'Invalid operation' })

    // wrong completed field name
    response = await wrongTaskDataOnPatch({ compl: true })
    expect(response.body).toEqual({ error: 'Invalid operation' })    
})

test('Should delete user task', async () => {
    const response = await request(app)
        .delete(`/tasks/${taskThree._id}`)
        .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
        .send()
        .expect(404)

    expect(response.body).toEqual({ error: 'Task not found' })
})

test('Should not delete task if unauthenticated', async () => {
    const response = await request(app)
        .delete(`/tasks/${taskThree._id}`)
        .send()
        .expect(401)
})

test('Should not update other users task', async () => {
    const response = await request(app)
        .patch(`/tasks/${taskThree._id}`)
        .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
        .send({ description: 'water flowers', completed: true })
        .expect(404)

    expect(response.text).toBe('Task not found')
})

test('Should fetch user task by id', async () => {
    const response = await request(app)
        .get(`/tasks/${taskOne._id}`)
        .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
        .send()
        .expect(200)

    expect(response.body._id).toBe(taskOne._id.toString())
})

test('Should not fetch user task by id if unauthenticated', async () => {
    const response = await request(app)
        .get(`/tasks/${taskOne._id}`)
        .send()
        .expect(401)
})

test('Should not fetch other users task by id', async () => {
    const response = await request(app)
        .get(`/tasks/${taskThree._id}`)
        .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
        .send()
        .expect(404)

    expect(response.text).toBe('Task not found')
})

test('Should fetch only completed tasks', async () => {
    const response = await request(app)
        .get('/tasks?completed=true')
        .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
        .send()
        .expect(200)

    expect(response.body.length).toBe(1)
    expect(response.body).not.toContainObject({ completed: false })
})

test('Should fetch only completed tasks', async () => {
    const response = await request(app)
        .get('/tasks?completed=false')
        .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
        .send()
        .expect(200)

    expect(response.body.length).toBe(1)
    expect(response.body).not.toContainObject({ completed: true })
})

const getSortedTasks = async (params) => {
    const response = await request(app)
        .get(`/tasks?sortBy=${params}`)
        .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
        .send()
        .expect(200)
    
    expect(response.body.length).toBe(2)
    return response
}

const expectSortedByDesc = (response) => {
    expect(response.body[0]._id).toBe(taskTwo._id.toString())
    expect(response.body[1]._id).toBe(taskOne._id.toString())
}

test('Should sort tasks by description/completed/createdAt/updatedAt', async () => {
    let response = await getSortedTasks('description:desc')
    expectSortedByDesc(response)
    
    response = await getSortedTasks('completed:desc')
    expectSortedByDesc(response)
    
    response = await getSortedTasks('createdAt:desc')
    expectSortedByDesc(response)
    
    response = await getSortedTasks('updatedAt:desc')
    expectSortedByDesc(response)
})

test('Should fetch page of tasks', async () => {
    const response = await request(app)
        .get('/tasks?limit=1&skip=1')
        .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
        .send()
        .expect(200)

    expect(response.body.length).toBe(1)
    expect(response.body[0]._id).toBe(taskTwo._id.toString())
})