import SessionService from "../../services/session-service.js";
import parseMarkdown from "../../utils/markdown.js";
import ThinkingRenderer from "./helpers/thinking-renderer.js";
import ClipboardHelper from "./helpers/clipboard-helper.js";
import FileReferenceHelper from "./helpers/file-reference-helper.js";

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
    node.style.opacity =
      "0";

    node.style.transform =
      "translateY(-18px)";

    node.style.transition =
      "none";

    requestAnimationFrame(
      () => {
        requestAnimationFrame(
          () => {
            node.style.transition =
              "opacity 0.35s ease, transform 0.35s ease";

            node.style.opacity =
              "1";

            node.style.transform =
              "translateY(0)";
          }
        );
      }
    );
  },

  appendMessageObject(
    message,
    persist = true,
    showRegen = false,
    animate = true
  ) {
    const box =
      this.container.querySelector(
        "#chat-messages"
      );

    if (!box) {
      return;
    }

    if (persist) {
      SessionService.addExistingMessage(
        message
      );
    }

    const msg =
      document.createElement(
        "div"
      );

    msg.className =
      "nexus-msg " +
      (message.role ===
      "user"
        ? "nexus-user"
        : "nexus-ai");

    let rendered;

    if (
      message.role ===
      "user"
    ) {
      rendered =
        message.content.replace(
          /\n/g,
          "<br>"
        );
    } else {
      rendered =
        this.convertFileReferences(
          parseMarkdown(
            message.content
          )
        );
    }

    const label =
      message.role ===
      "user"
        ? "You"
        : "Nexus";

    let extraButtons =
      "";

    if (
      message.role ===
        "assistant" &&
      showRegen
    ) {
      extraButtons = `
        <button class="nexus-msg-action-btn nexus-regen-btn">
          ↻
        </button>
      `;
    } else if (
      message.role ===
      "user"
    ) {
      extraButtons = `
        <button class="nexus-msg-action-btn nexus-edit-btn">
          Edit
        </button>
      `;
    }

    const attachmentContainer =
      message.role ===
      "user"
        ? `<div class="nexus-async-attachments"></div>`
        : "";

    msg.innerHTML = `
      <strong>${label}</strong><br>
      ${attachmentContainer}
      ${rendered}

      <div class="nexus-msg-actions">
        <button class="nexus-msg-action-btn nexus-copy-btn">
          Copy
        </button>
        ${extraButtons}
      </div>
    `;

    msg.querySelector(
      ".nexus-copy-btn"
    ).addEventListener(
      "click",
      () => {
        this.copyText(
          message.content
        );
      }
    );

    const regenBtn =
      msg.querySelector(
        ".nexus-regen-btn"
      );

    if (regenBtn) {
      regenBtn.addEventListener(
        "click",
        () => {
          this.regenerateResponse();
        }
      );
    }

    const editBtn =
      msg.querySelector(
        ".nexus-edit-btn"
      );

    if (editBtn) {
      editBtn.addEventListener(
        "click",
        () => {
          this.startEditMessage(
            message
          );
        }
      );
    }

    this.attachCodeCopyListeners(
      msg
    );

    this.attachFileReferenceListeners(
      msg
    );

    box.appendChild(msg);

    if (
      message.role ===
      "user"
    ) {
      const attachmentNode =
        msg.querySelector(
          ".nexus-async-attachments"
        );

      if (attachmentNode) {
        this.fillMessageAttachments(
          attachmentNode,
          message.attachmentIds
        );
      }
    }

    if (animate) {
      this.animateMessage(
        msg
      );
    }

    box.scrollTop =
      box.scrollHeight;

    this.updateTokenCounter();

    return msg;
  }
};