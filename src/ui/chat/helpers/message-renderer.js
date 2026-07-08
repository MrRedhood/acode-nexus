import SessionService from "../../../services/session-service.js";
import parseMarkdown from "../../../utils/markdown.js";

export default class MessageRenderer {
  static animate(node) {
    node.style.opacity = "0";

    node.style.transform =
      "translateY(-18px)";

    node.style.transition =
      "none";

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        node.style.transition =
          "opacity 0.35s ease, transform 0.35s ease";

        node.style.opacity =
          "1";

        node.style.transform =
          "translateY(0)";
      });
    });
  }

  static append(
    chat,
    message,
    persist = true,
    showRegen = false,
    animate = true
  ) {
    const box =
      chat.container.querySelector(
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
      (message.role === "user"
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
        chat.convertFileReferences(
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
        chat.copyText(
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
          chat.regenerateResponse();
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
          chat.startEditMessage(
            message
          );
        }
      );
    }

    chat.attachCodeCopyListeners(
      msg
    );

    chat.attachFileReferenceListeners(
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

      if (
        attachmentNode
      ) {
        chat.fillMessageAttachments(
          attachmentNode,
          message.attachmentIds
        );
      }
    }

    if (animate) {
      this.animate(msg);
    }

    box.scrollTop =
      box.scrollHeight;

    chat.updateTokenCounter();

    return msg;
  }
}