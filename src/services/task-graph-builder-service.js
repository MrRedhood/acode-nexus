export default class TaskGraphBuilderService {
  static build(
    request,
    editPlan = null
  ) {
    const graph = [];

    const strategy =
      editPlan?.strategy ||
      "replace_file";

    const scope =
      editPlan?.scope ||
      "file";

    const risk =
      editPlan?.risk ||
      "low";

    const add = (
      type,
      title,
      payload = {}
    ) => {
      graph.push({
        type,
        title,
        payload
      });
    };

    // Always resolve the target first.
    add(
      "resolve_target",
      "Resolve workspace target",
      {
        request,
        strategy
      }
    );

    switch (strategy) {
      case "rename_symbol":
        add(
          "find_references",
          "Find symbol references"
        );

        add(
          "analyze_dependencies",
          "Analyze dependencies"
        );

        break;

      case "patch_function":
      case "patch_class":
        add(
          "analyze_dependencies",
          "Analyze dependencies"
        );

        break;

      case "replace_file":
        break;

      case "create_file":
        break;

      case "delete_file":
        add(
          "analyze_dependencies",
          "Analyze dependencies"
        );

        break;

      case "refactor":
        add(
          "analyze_dependencies",
          "Analyze dependencies"
        );

        add(
          "find_references",
          "Find symbol references"
        );

        break;

      default:
        break;
    }

    if (
      scope ===
      "workspace"
    ) {
      add(
        "impact_analysis",
        "Analyze workspace impact"
      );
    }

    if (
      risk !== "low"
    ) {
      add(
        "preview_changes",
        "Preview changes"
      );
    }

    add(
      "generate_actions",
      "Generate actions"
    );

    add(
      "apply_actions",
      "Apply actions"
    );

    add(
      "verify_workspace",
      "Verify workspace"
    );

    return graph;
  }
}