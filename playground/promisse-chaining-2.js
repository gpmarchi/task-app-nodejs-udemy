require("../src/db/mongoose");
const Task = require("../src/models/task");

const log = console.log;

// Task.findByIdAndDelete("5d77b62ed441d73d9f144032")
//   .then(task => {
//     log(task);
//     return Task.countDocuments({ completed: false });
//   })
//   .then(tasksCount => {
//     log(`There are ${tasksCount} tasks left to complete.`);
//   })
//   .catch(error => {
//     log(error);
//   });

const deleteTaskAndCount = async (id, completed) => {
  const deletedTask = await Task.findByIdAndDelete(id);
  const countIncomplete = await Task.countDocuments({ completed });
  return countIncomplete;
};

deleteTaskAndCount("5d77b62ed441d73d9f144032", false)
  .then(count => {
    log(count);
  })
  .catch(error => {
    log(error);
  });
