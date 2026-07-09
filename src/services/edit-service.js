import StorageService from "./storage-service.js";
import PromptService from "./prompt-service.js";
import ProviderService from "./provider-service.js";
import PatchPlannerService from "./patch-planner-service.js";
import EditContextService from "./edit-context-service.js";
import TaskPlanService from "./task-plan-service.js";
import ActionContextBuilderService from "./action-context-builder-service.js";
import EditMessageParser from "./edit-message-parser.js";
import EditStateService from "./edit-state-service.js";

export default class EditService {
  static async prepareMessages(
    messages
  ) {
    const provider =
      StorageService.get(
        "provider"
      );

    const apiKey =
      StorageService.get(
        "apiKey"
      );

    const model =
      StorageService.get(
        "model"
      );

    if (!provider) {
      throw new Error(
        "No provider selected"
      );
    }

    if (!apiKey) {
      throw new Error(
        "No API key saved"
      );
    }

    if (!model) {
      throw new Error(
        "No model selected"
      );
    }

    const liveBuffer =
      EditMessageParser.extractLiveBuffer(
        messages
      );

    if (!liveBuffer) {
      throw new Error(
        "No live editor buffer found"
      );
    }

    const rawUserRequest =
      EditMessageParser.extractUserRequest(
        messages
      );

    const userRequest =
      EditMessageParser.cleanUserRequest(
        rawUserRequest
      );

    const plan =
      await PatchPlannerService.createPlan(
        userRequest
      );

    const context =
      await EditContextService.prepare(
        plan,
        userRequest,
        liveBuffer
      );

    const taskPlan =
      TaskPlanService.createPlan(
        userRequest,
        plan
      );

    context.request =
      userRequest;

    context.liveBuffer =
      liveBuffer;

    context.taskPlan =
      taskPlan;

    EditStateService.setLastEditContext(
      context
    );

    EditStateService.setLastTaskPlan(
      taskPlan
    );

    const userPrompt =
      ActionContextBuilderService.build(
        context
      );

    const processedMessages = [
      {
        role: "system",
        content:
          PromptService.buildEditPrompt()
      },
      {
        role: "user",
        content:
          userPrompt
      }
    ];

    return {
      provider,
      apiKey,
      model,
      processedMessages,
      plan,
      context,
      taskPlan
    };
  }

  static getLastEditContext() {
    return EditStateService.getLastEditContext();
  }

  static getLastTaskPlan() {
    return EditStateService.getLastTaskPlan();
  }

  static clearLastEditContext() {
    EditStateService.clearLastEditContext();
  }

  static clearLastTaskPlan() {
    EditStateService.clearLastTaskPlan();
  }

  static clearExecutionState() {
    EditStateService.clearExecutionState();
  }

  static async sendMessageStream(
    messages,
    onChunk,
    signal = null
  ) {
    const {
      provider,
      apiKey,
      model,
      processedMessages,
      plan,
      context,
      taskPlan
    } =
      await this.prepareMessages(
        messages
      );

    console.log(
      "PATCH PLAN:",
      plan
    );

    console.log(
      "TASK PLAN:",
      taskPlan
    );

    console.log(
      "EDIT CONTEXT:",
      context
    );

    console.log(
      "EDIT MODE PROMPT:",
      JSON.stringify(
        processedMessages,
        null,
        2
      )
    );

    return await ProviderService.streamChat(
      provider,
      apiKey,
      model,
      processedMessages,
      onChunk,
      signal
    );
  }
}