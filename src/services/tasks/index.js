import TaskEngineService from "../services/task-engine-service.js";

import ResolveTargetTask from "./resolve-target-task.js";
import GenerateActionsTask from "./generate-actions-task.js";
import PreviewChangesTask from "./preview-changes-task.js";
import ApplyActionsTask from "./apply-actions-task.js";
import VerifyWorkspaceTask from "./verify-workspace-task.js";

export default function registerTasks() {
  TaskEngineService.register(
    "resolve_target",
    ResolveTargetTask.execute
  );

  TaskEngineService.register(
    "generate_actions",
    GenerateActionsTask.execute
  );

  TaskEngineService.register(
    "preview_changes",
    PreviewChangesTask.execute
  );

  TaskEngineService.register(
    "apply_actions",
    ApplyActionsTask.execute
  );

  TaskEngineService.register(
    "verify_workspace",
    VerifyWorkspaceTask.execute
  );
}