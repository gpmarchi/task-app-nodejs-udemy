const mongoose = require("mongoose");

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
      ref: "Project"
    },
    children: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Project"
      }
    ]
  },
  {
    timestamps: true
  }
);

// Delete child projects when ancestor project is removed
projectSchema.pre("remove", async function(next) {
  const project = this;
  await Project.deleteMany({ ancestor: project._id });
  next();
});

projectSchema.pre("save", async function(next) {
  const updatedProject = this;
  const savedProject = await Project.findById(updatedProject._id);
  if (savedProject) {
    if (updatedProject.children.length === 0) {
      savedProject.children.forEach(async child => {
        await Project.updateOne({ _id: child._id }, { ancestor: null });
      });
    }
    console.log("New children", updatedProject.children);
    console.log("Old children", savedProject.children);

    if (updatedProject.children > savedProject.children) {
      const newChildren = updatedProject.children.filter(child => {
        return !savedProject.children.includes(child);
      });
      console.log("Modified children", newChildren);
      newChildren.forEach(async child => {
        await Project.updateOne({ _id: child }, { ancestor: savedProject._id });
      });
    }
  }
  next();
});

const Project = mongoose.model("Project", projectSchema);

module.exports = Project;
