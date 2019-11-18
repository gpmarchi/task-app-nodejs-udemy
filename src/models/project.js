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
    updateAncestorReferencesOnChildren(savedProject, updatedProject);
    await updateChildrenReferencesOnAncestor(savedProject, updatedProject);
  }
  next();
});

const updateChildrenReferencesOnAncestor = async (
  savedProject,
  updatedProject
) => {
  const savedAncestor = savedProject.ancestor;
  const updatedAncestor = updatedProject.ancestor;

  if (!updatedAncestor && savedAncestor) {
    const ancestor = await Project.findById(savedAncestor);
    const updatedAncestorChildren = ancestor.children.filter(child => {
      return JSON.stringify(child) !== JSON.stringify(updatedProject._id);
    });
    updateChildren(ancestor._id, updatedAncestorChildren);
  } else if (!savedAncestor && updatedAncestor) {
    const ancestor = await Project.findById(updatedAncestor);
    ancestor.children.push(updatedProject._id);
    updateChildren(ancestor._id, ancestor.children);
  } else if (
    savedAncestor &&
    updatedAncestor &&
    savedAncestor !== updatedAncestor
  ) {
    // retirar do children do pai antigo o id do projeto atual
    const oldAncestor = await Project.findById(savedAncestor);
    const updatedAncestorChildren = oldAncestor.children.filter(child => {
      return JSON.stringify(child) !== JSON.stringify(updatedProject._id);
    });
    updateChildren(oldAncestor._id, updatedAncestorChildren);
    // colocar no children do pai novo o id do projeto atual
    const newAncestor = await Project.findById(updatedAncestor);
    newAncestor.children.push(updatedProject._id);
    updateChildren(newAncestor._id, newAncestor.children);
  }
};

const updateChildren = async (ancestorId, children) => {
  await Project.updateOne({ _id: ancestorId }, { children });
};

const updateAncestor = (children, ancestor) => {
  children.forEach(async child => {
    await Project.updateOne({ _id: child }, { ancestor });
  });
};

const updateAncestorReferencesOnChildren = (savedProject, updatedProject) => {
  const savedChildren = savedProject.children;
  const updatedChildren = updatedProject.children;

  if (updatedChildren.length === 0 && savedChildren.length > 0) {
    updateAncestor(savedChildren, null);
  } else if (
    updatedChildren.length === savedChildren.length &&
    JSON.stringify(updatedChildren) !== JSON.stringify(savedChildren)
  ) {
    updateAncestor(savedChildren, null);
    updateAncestor(updatedChildren, savedProject._id);
  } else if (updatedChildren.length > savedChildren.length) {
    const addedChildren = updatedChildren.filter(child => {
      return !savedChildren.includes(child);
    });
    updateAncestor(addedChildren, savedProject._id);
  } else if (updatedChildren.length < savedChildren.length) {
    const removedChildren = savedChildren.filter(child => {
      return !updatedChildren.includes(child);
    });
    updateAncestor(removedChildren, null);
  }
};

const Project = mongoose.model("Project", projectSchema);

module.exports = Project;
