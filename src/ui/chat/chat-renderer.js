import SessionService from "../../services/session-service.js";
import ThinkingRenderer from "./helpers/thinking-renderer.js";
import ClipboardHelper from "./helpers/clipboard-helper.js";
import FileReferenceHelper from "./helpers/file-reference-helper.js";
import MessageRenderer from "./helpers/message-renderer.js";

export default {
  convertFileReferences(
    content
  ) {
    return FileReferenceHelper.convert(
      content
    );
  },

  attachFileReferenceListeners(
    msgNode
  ) {
    return FileReferenceHelper.attach(
      this,
      msgNode
    );
  },

  renderMessages() {
    const box =
      this.container.querySelector(
        "#chat-messages"
      );

    if (!box) {
      return;
    }

    box.innerHTML = "";

    const messages =
      SessionService.getMessages();

    let latestAssistantId =
      null;

    for (
      let i =
        messages.length - 1;
      i >= 0;
      i--
    ) {
      if (
        messages[i].role ===
        "assistant"
      ) {
        latestAssistantId =
          messages[i].id;
        break;
      }
    }

    messages.forEach(msg => {
      this.appendMessageObject(
        msg,
        false,
        msg.id ===
          latestAssistantId,
        false
      );
    });

    box.scrollTop =
      box.scrollHeight;

    this.updateTokenCounter();
  },

  startThinkingAnimation(
    node
  ) {
    return ThinkingRenderer.start(
      this,
      node
    );
  },

  stopThinkingAnimation() {
    return ThinkingRenderer.stop(
      this
    );
  },

  showToast(text) {
    return ClipboardHelper.showToast(
      this,
      text
    );
  },

  copyText(content) {
    return ClipboardHelper.copyText(
      this,
      content
    );
  },

  attachCodeCopyListeners(
    msgNode
  ) {
    return ClipboardHelper.attachCodeCopyListeners(
      this,
      msgNode
    );
  },

  animateMessage(node) {
    return MessageRenderer.animate(
      node
    );
  },

  appendMessageObject(
    message,
    persist = true,
    showRegen = false,
    animate = true
  ) {
    return MessageRenderer.append(
      this,
      message,
      persist,
      showRegen,
      animate
    );
  }
};