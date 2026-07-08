export default class PreviewChangesTask {
  static async execute(
    task,
    plan,
    context
  ) {
    console.log(
      "PreviewChangesTask"
    );

    const actions =
      plan.actions || [];

    const preview =
      actions.map(
        (
          action,
          index
        ) => ({
          id:
            index + 1,
          type:
            action.type,
          file:
            action.file ||
            "[Unknown]",
          summary:
            this.createSummary(
              action
            ),
          action
        })
      );

    plan.preview =
      preview;

    return {
      success: true,
      previewed: true,
      preview
    };
  }

  static createSummary(
    action = {}
  ) {
    switch (
      action.type
    ) {
      case "patch_file":
        return `Patch ${action.file}`;

      case "replace_file":
        return `Replace ${action.file}`;

      case "create_file":
        return `Create ${action.file}`;

      case "delete_file":
        return `Delete ${action.file}`;

      case "rename_file":
        return `Rename ${action.from} → ${action.to}`;

      case "open_file":
        return `Open ${action.file}`;

      case "focus_file":
        return `Focus ${action.file}`;

      default:
        return action.type ||
          "Unknown action";
    }
  }
}