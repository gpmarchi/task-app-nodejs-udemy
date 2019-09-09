// const mongodb = require("mongodb");
// const MongoClient = mongodb.MongoClient;
// const ObjectId = mongodb.ObjectID;

const { MongoClient, ObjectId } = require("mongodb");

const log = console.log;
const connectionURL = "mongodb://127.0.0.1:27017";
const databaseName = "task-manager";

MongoClient.connect(
  connectionURL,
  { useNewUrlParser: true, useUnifiedTopology: true },
  (error, client) => {
    if (error) {
      return log("Unable to connect to database.");
    }

    const db = client.db(databaseName);

    //   db.collection("users")
    //     .deleteMany({
    //       age: 27
    //     })
    //     .then(result => {
    //       log(result);
    //     })
    //     .catch(error => {
    //       log(error);
    //     });
    // }

    db.collection("tasks")
      .deleteOne({ description: "third test task" })
      .then(result => {
        log(result.deletedCount);
      })
      .catch(error => {
        log(error);
      });
  }
);
