import PatchPlannerService from "./patch-planner-service.js";

export default class EditContextService {
  static async prepare(
    userRequest,
    liveBuffer
  ) {
    const plan =
      await PatchPlannerService.createPlan(
        userRequest
      );

    if (!plan) {
      return {
        plan: null,
        context:
          liveBuffer
      };
    }

    switch (
      plan.strategy
    ) {
      case "rename_symbol":
        return this.buildRenameContext(
          plan,
          userRequest,
          liveBuffer
        );

      case "patch_function":
        return this.buildFunctionContext(
          plan,
          userRequest,
          liveBuffer
        );

      case "insert":
        return this.buildInsertContext(
          plan,
          userRequest,
          liveBuffer
        );

      default:
        return {
          plan,
          context:
            liveBuffer
        };
    }
  }

  static buildRenameContext(
    plan,
    userRequest,
    liveBuffer
  ) {
    return {
      plan,

      context: `
TARGET FILE:
${plan.file}

TARGET:
${plan.symbolType}

LINES:
${plan.startLine}-${plan.endLine}

CODE:
${plan.content}

USER REQUEST:
${userRequest}
`
    };
  }

  static buildFunctionContext(
    plan,
    userRequest,
    liveBuffer
  ) {
    return {
      plan,

      context: `
FUNCTION CONTEXT

${plan.content || liveBuffer}

USER REQUEST:
${userRequest}
`
    };
  }

  static buildInsertContext(
    plan,
    userRequest,
    liveBuffer
  ) {
    return {
      plan,

      context: `
CURRENT CODE:

${liveBuffer}

USER REQUEST:

${userRequest}
`
    };
  }
}