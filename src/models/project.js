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

// TODO: refactor this function to break up logic for updating ancestor ref on children
projectSchema.pre("save", async function(next) {
  const updatedProject = this;
  const savedProject = await Project.findById(updatedProject._id);
  if (savedProject) {
    if (updatedProject.children.length === 0) {
      savedProject.children.forEach(async child => {
        await Project.updateOne({ _id: child._id }, { ancestor: null });
      });
    }

    if (updatedProject.children > savedProject.children) {
      const newChildren = updatedProject.children.filter(child => {
        return !savedProject.children.includes(child);
      });
      newChildren.forEach(async child => {
        await Project.updateOne({ _id: child }, { ancestor: savedProject._id });
      });
    }

    if (updatedProject.children < savedProject.children) {
      const removedChildren = savedProject.children.filter(child => {
        return !updatedProject.children.includes(child);
      });
      removedChildren.forEach(async child => {
        await Project.updateOne({ _id: child }, { ancestor: null });
      });
    }
  }
  next();
});

const Project = mongoose.model("Project", projectSchema);

module.exports = Project;
