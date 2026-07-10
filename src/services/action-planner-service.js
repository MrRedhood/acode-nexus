export default class ActionPlannerService {
  static build(
    plan,
    editContext = null
  ) {
    const strategy =
      plan?.strategy ||
      "replace_file";

    const scope =
      plan?.scope ||
      "file";

    const risk =
      plan?.risk ||
      "low";

    const target =
      editContext?.target ||
      null;

    const planner = {
      strategy,
      scope,
      risk,

      output:
        "nexus-action",

      actionType:
        this.getActionType(
          strategy
        ),

      patchStyle:
        this.getPatchStyle(
          strategy
        ),

      targetType:
        target
          ?.symbolType ||
        "file",

      preserveFormatting:
        true,

      preserveComments:
        true,

      preserveImports:
        true,

      verifyImports:
        false,

      verifyReferences:
        false,

      verifyWorkspace:
        scope ===
        "workspace",

      includeDefinition:
        Boolean(
          editContext
            ?.definition
        ),

      includeReferences:
        Boolean(
          editContext
            ?.references
            ?.length
        ),

      includeDependencyGraph:
        Boolean(
          editContext
            ?.dependency
        ),

      includeImpactAnalysis:
        Boolean(
          editContext
            ?.impact
        ),

      allowCreateFiles:
        strategy ===
        "create_file",

      allowDeleteFiles:
        strategy ===
        "delete_file",

      allowRename:
        strategy ===
        "rename_symbol",

      allowWorkspaceChanges:
        scope ===
        "workspace",

      minimalChanges:
        strategy !==
        "replace_file",

      explanation:
        false
    };

    if (
      planner.allowRename
    ) {
      planner.verifyReferences =
        true;
    }

    if (
      strategy ===
      "imports"
    ) {
      planner.verifyImports =
        true;
    }

    if (
      strategy ===
      "refactor"
    ) {
      planner.verifyImports =
        true;

      planner.verifyReferences =
        true;

      planner.verifyWorkspace =
        true;
    }

    return planner;
  }

  static getActionType(
    strategy
  ) {
    switch (
      strategy
    ) {
      case "patch_function":
      case "patch_class":
      case "insert":
      case "delete":
        return "replace_symbol";

      case "rename_symbol":
        return "replace_symbol";

      case "replace_file":
        return "replace_file";

      case "create_file":
        return "create_file";

      case "delete_file":
        return "delete_file";

      default:
        return "patch_file";
    }
  }

  static getPatchStyle(
    strategy
  ) {
    switch (
      strategy
    ) {
      case "patch_function":
      case "patch_class":
        return "minimal";

      case "insert":
        return "insert-only";

      case "delete":
        return "delete-only";

      case "replace_file":
        return "full-file";

      case "rename_symbol":
        return "symbol";

      default:
        return "minimal";
    }
  }
}