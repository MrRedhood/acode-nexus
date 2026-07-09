import StorageService from "./storage-service.js";
import PromptService from "./prompt-service.js";
import ProviderService from "./provider-service.js";
import EditMessageParser from "./edit-message-parser.js";
import EditOrchestratorService from "./edit-orchestrator-service.js";

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

    const session =
      await EditOrchestratorService.prepare(
        userRequest,
        liveBuffer
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
          session.actionContext
      }
    ];

    return {
      provider,
      apiKey,
      model,
      processedMessages,
      plan:
        session.plan,
      context:
        session.editContext,
      taskPlan:
        session.taskPlan
    };
  }

  static getLastEditContext() {
    return EditOrchestratorService.getEditContext();
  }

  static getLastTaskPlan() {
    return EditOrchestratorService.getTaskPlan();
  }

  static clearLastEditContext() {
    EditOrchestratorService.clear();
  }

  static clearLastTaskPlan() {}

  static clearExecutionState() {
    EditOrchestratorService.clear();
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