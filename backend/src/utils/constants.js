const UserRolesEnum = {
  MEMBER: "member",
  ADMIN: "admin",
  PROJECT_ADMIN: "project_admin",
};

const AvailableUserRole = Object.values(UserRolesEnum);

const TaskStatusEnum = {
  TODO: "todo",
  IN_PROGRESS: "in_progress",
  DONE: "done",
};

const AvailableTaskStatus = Object.values(TaskStatusEnum);

export {
  UserRolesEnum,
  AvailableUserRole,
  TaskStatusEnum,
  AvailableTaskStatus,
};
