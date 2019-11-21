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
      ref: "Project",
      default: null
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
  if (project.ancestor) {
    await removeChildFromAncestor(project.ancestor, project._id);
  }
  next();
});

projectSchema.pre("save", async function(next) {
  const updatedProject = this;
  const savedProject = await Project.findById(updatedProject._id);
  if (savedProject) {
    updateAncestorReferencesOnChildren(savedProject, updatedProject);
    await updateChildrenReferencesOnAncestor(savedProject, updatedProject);
  } else {
    await addChildToAncestor(updatedProject.ancestor, updatedProject._id);
    await updateAncestor(updatedProject.children, updatedProject._id);
  }
  next();
});

const updateChildren = async (ancestorId, children) => {
  await Project.updateOne({ _id: ancestorId }, { children });
};

const removeChildFromAncestor = async (savedAncestorId, updatedProjectId) => {
  const ancestor = await Project.findById(savedAncestorId);
  const updatedAncestorChildren = ancestor.children.filter(child => {
    return JSON.stringify(child) !== JSON.stringify(updatedProjectId);
  });
  updateChildren(ancestor._id, updatedAncestorChildren);
};

const addChildToAncestor = async (updatedAncestorId, updatedProjectId) => {
  if (updatedAncestorId) {
    const ancestor = await Project.findById(updatedAncestorId);
    if (!ancestor.children.includes(updatedProjectId)) {
      ancestor.children.push(updatedProjectId);
    }
    updateChildren(ancestor._id, ancestor.children);
  }
};

const swapAncestor = async (
  savedAncestorId,
  updatedAncestorId,
  updatedProjectId
) => {
  await removeChildFromAncestor(savedAncestorId, updatedProjectId);
  await addChildToAncestor(updatedAncestorId, updatedProjectId);
};

const updateChildrenReferencesOnAncestor = async (
  savedProject,
  updatedProject
) => {
  const savedAncestorId = savedProject.ancestor;
  const updatedAncestorId = updatedProject.ancestor;

  if (!updatedAncestorId && savedAncestorId) {
    await removeChildFromAncestor(savedAncestorId, updatedProject._id);
  } else if (!savedAncestorId && updatedAncestorId) {
    await addChildToAncestor(updatedAncestorId, updatedProject._id);
  } else if (
    savedAncestorId &&
    updatedAncestorId &&
    savedAncestorId !== updatedAncestorId
  ) {
    await swapAncestor(savedAncestorId, updatedAncestorId, updatedProject._id);
  }
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
