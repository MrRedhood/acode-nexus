import ChatAI from "./chat-ai.js";
import SessionService from "../../../services/session-service.js";
import EditService from "../../../services/edit-service.js";
import TaskEditService from "../../../services/task-edit-service.js";

export default class ChatReplyHelper {
  static async generate(
    chat
  ) {
    const sendBtn =
      chat.container.querySelector(
        "#send-btn"
      );

    chat.isGenerating = true;

    chat.activeController =
      new AbortController();

    chat.commandMenu.hide();

    sendBtn.textContent = "■";

    try {
      const {
        assistantMessage
      } =
        await ChatAI.generate(
          chat,
          chat.activeController
            .signal
        );

      const editContext =
        EditService.getLastEditContext();

      if (editContext) {
        const results =
          await TaskEditService.execute(
            assistantMessage.content,
            editContext
          );

        console.log(
          "Task Execution:",
          results
        );

        EditService.clearLastEditContext();
      }

      SessionService.addExistingMessage(
        assistantMessage
      );

      return assistantMessage;
    } finally {
      chat.activeController =
        null;

      chat.isGenerating =
        false;

      sendBtn.textContent =
        "↑";
    }
  }
}