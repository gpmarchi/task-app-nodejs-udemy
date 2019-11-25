const mongoose = require("mongoose");
const Task = require("./task");

const projectSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "User"
    },
    ancestor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      default: null
    }
  },
  {
    timestamps: true
  }
);

projectSchema.virtual("tasks", {
  ref: "Task",
  localField: "_id",
  foreignField: "project"
});

projectSchema.virtual("subprojects", {
  ref: "Project",
  localField: "_id",
  foreignField: "ancestor"
});

// Delete child projects when ancestor project is removed
projectSchema.pre("remove", async function(next) {
  const project = this;
  await Project.deleteMany({ ancestor: project._id });
  await Task.deleteMany({ project: project._id });
  next();
});

const Project = mongoose.model("Project", projectSchema);

module.exports = Project;
