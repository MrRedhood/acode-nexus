import TaskEngineService from "../services/task-engine-service.js";

import ResolveTargetTask from "./resolve-target-task.js";
import GenerateActionsTask from "./generate-actions-task.js";
import PreviewChangesTask from "./preview-changes-task.js";
import ApplyActionsTask from "./apply-actions-task.js";
import VerifyWorkspaceTask from "./verify-workspace-task.js";
import AnalyzeDependenciesTask from "./analyze-dependencies-task.js";
import FindReferencesTask from "./find-references-task.js";
import ImpactAnalysisTask from "./impact-analysis-task.js";

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

  TaskEngineService.register(
  "analyze_dependencies",
  AnalyzeDependenciesTask.execute
);

  TaskEngineService.register(
  "find_references",
  FindReferencesTask.execute
);

  TaskEngineService.register(
  "impact_analysis",
  ImpactAnalysisTask.execute
);
}