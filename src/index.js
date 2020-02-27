const express = require('express')
require('./db/mongoose')

const userRouter = require('./routers/user')
const taskRouter = require('./routers/task')

const app = express()
const port = process.env.PORT || 3000

// app.use((req, res, next) => {
//     res.status(503).send('Site is currently down. Check back soon')
// })

app.use(express.json())
app.use(userRouter)
app.use(taskRouter)

app.listen(port, () => {
    console.log(`http://localhost:${port}`)
})

const Task = require('./models/task')
const User = require('./models/user')

const main = async () => {
    // const task = await Task.findById('5e57c7861f1c4b2f49687857')
    // await task.populate('owner').execPopulate()
    // console.log(task)

    const user = await User.findById('5e57c68bfb94202d38ab495b')
    await user.populate('tasks').execPopulate()
    console.log(user.tasks)
}

main()