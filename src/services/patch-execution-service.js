import PatchService from "./patch-service.js";
import PatchValidatorService from "./patch-validator-service.js";

export default class PatchExecutionService {
  static async execute(
    action,
    editContext = null
  ) {
    const validation =
      action.type ===
      "patch_file"
        ? PatchValidatorService.validatePatchAction(
            action
          )
        : PatchValidatorService.validateAction(
            action
          );

    if (!validation.valid) {
      return {
        success: false,
        error:
          validation.error
      };
    }

    switch (
      action.type
    ) {
      case "patch_file":
        return await PatchService.patchFile(
          action,
          editContext
        );

      case "replace_file":
        return await PatchService.replaceFile(
          action,
          editContext
        );

      case "replace_symbol":
        return await PatchService.replaceSymbol(
          action,
          editContext
        );

      case "undo_file":
        return await PatchService.undoFile(
          action
        );

      default:
        return {
          success: false,
          error: `Unsupported action: ${action.type}`
        };
    }
  }

  static async executeGroup(
    actions = [],
    editContext = null
  ) {
    const results = [];

    for (const action of actions) {
      const result =
        await this.execute(
          action,
          editContext
        );

      results.push(result);

      if (!result.success) {
        return {
          success: false,
          results
        };
      }
    }

    return {
      success: true,
      results
    };
  }
}