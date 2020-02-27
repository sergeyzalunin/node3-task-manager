require('../src/db/mongoose')
const Task = require('../src/models/task')

// Task.findByIdAndDelete('5e5131e7b053894d8925ce5d').then((res) => {
//     console.log(res)
//     return Task.countDocuments({ completed: true })
// }).then((count) => {
//     console.log(count)
// }).catch((e) => {
//     console.log(e)
// })

const findByIdAndDelete = async (id) => {
    await Task.findByIdAndDelete(id);
    return await Task.countDocuments({ completed: true })
}

findByIdAndDelete('5e529a2ba39af921f2397e19').then(result => {
    console.log(result)
}).catch(e => {
    console.log(e)
})