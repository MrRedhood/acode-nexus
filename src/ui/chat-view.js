import AIService from "../services/ai-service.js";
import SessionService from "../services/session-service.js";
import parseMarkdown from "../utils/markdown.js";

export default class ChatView {
  constructor(container) {
    this.container = container;
    this.activeController = null;
    this.isGenerating = false;
    this.editingMessageId = null;
    this.thinkingInterval = null;
  }

  render() {
    this.container.innerHTML = `
      <div id="chat-messages" class="nexus-chat"></div>

      <div class="nexus-input-area">
        <textarea
          id="chat-input"
          class="nexus-textarea"
          placeholder="Ask Nexus anything..."
        ></textarea>

        <button id="send-btn" class="nexus-button">
          Send
        </button>
      </div>
    `;

    this.renderMessages();

    const sendBtn =
      this.container.querySelector("#send-btn");

    const input =
      this.container.querySelector("#chat-input");

    sendBtn.addEventListener("click", () => {
      if (this.isGenerating) {
        this.stopGeneration();
      } else {
        this.sendMessage();
      }
    });

    input.addEventListener("keydown", e => {
      if (
        e.key === "Enter" &&
        !e.shiftKey &&
        !this.isGenerating
      ) {
        e.preventDefault();
        this.sendMessage();
      }
    });
  }

  renderMessages() {
    const box =
      this.container.querySelector("#chat-messages");

    if (!box) return;

    box.innerHTML = "";

    const messages =
      SessionService.getMessages();

    let latestAssistantId = null;

    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i].role === "assistant") {
        latestAssistantId = messages[i].id;
        break;
      }
    }

    messages.forEach(msg => {
      this.appendMessageObject(
        msg,
        false,
        msg.id === latestAssistantId,
        false
      );
    });

    box.scrollTop = box.scrollHeight;
  }

  startThinkingAnimation(node) {
    let dots = 1;

    this.stopThinkingAnimation();

    this.thinkingInterval = setInterval(() => {
      dots++;
      if (dots > 3) dots = 1;

      node.innerHTML = `
        <strong>Nexus</strong><br>
        Thinking${".".repeat(dots)}
      `;
    }, 450);
  }

  stopThinkingAnimation() {
    if (this.thinkingInterval) {
      clearInterval(this.thinkingInterval);
      this.thinkingInterval = null;
    }
  }

  showToast(text) {
    const old =
      document.querySelector(".nexus-copy-toast");

    if (old) old.remove();

    const toast =
      document.createElement("div");

    toast.className = "nexus-copy-toast";
    toast.textContent = text;

    document.body.appendChild(toast);

    setTimeout(() => toast.remove(), 1500);
  }

  copyText(content) {
    navigator.clipboard
      .writeText(content)
      .then(() => this.showToast("Copied!"))
      .catch(() => this.showToast("Copy failed"));
  }

  stopGeneration() {
    if (this.activeController) {
      this.activeController.abort();
    }
  }

  startEditMessage(message) {
    const input =
      this.container.querySelector("#chat-input");

    const sendBtn =
      this.container.querySelector("#send-btn");

    this.editingMessageId = message.id;
    input.value = message.content;
    input.focus();

    sendBtn.textContent = "Save & Regenerate";
  }

  attachCodeCopyListeners(msgNode) {
    const buttons =
      msgNode.querySelectorAll(".nexus-code-copy");

    buttons.forEach(button => {
      button.addEventListener("click", e => {
        e.stopPropagation();

        const wrapper =
          button.closest(".nexus-code-block");

        if (!wrapper) return;

        const textarea =
          wrapper.querySelector(
            ".nexus-hidden-code"
          );

        if (!textarea) return;

        this.copyText(textarea.value);
      });
    });
  }

  appendMessageObject(
    message,
    persist = true,
    showRegen = false,
    animate = true
  ) {
    const box =
      this.container.querySelector("#chat-messages");

    if (!box) return;

    if (persist) {
      SessionService.addExistingMessage(message);
    }

    const msg = document.createElement("div");

    msg.className =
      "nexus-msg " +
      (message.role === "user"
        ? "nexus-user"
        : "nexus-ai");

    if (animate) {
      msg.classList.add("nexus-msg-enter");
    }

    const rendered =
      message.role === "user"
        ? message.content.replace(/\n/g, "<br>")
        : parseMarkdown(message.content);

    const label =
      message.role === "user"
        ? "You"
        : "Nexus";

    let extraButtons = "";

    if (
      message.role === "assistant" &&
      showRegen
    ) {
      extraButtons = `
        <button class="nexus-msg-action-btn nexus-regen-btn">
          ↻
        </button>
      `;
    } else if (message.role === "user") {
      extraButtons = `
        <button class="nexus-msg-action-btn nexus-edit-btn">
          Edit
        </button>
      `;
    }

    msg.innerHTML = `
      <strong>${label}</strong><br>
      ${rendered}
      <div class="nexus-msg-actions">
        <button class="nexus-msg-action-btn nexus-copy-btn">
          Copy
        </button>
        ${extraButtons}
      </div>
    `;

    msg.querySelector(".nexus-copy-btn")
      .addEventListener("click", () => {
        this.copyText(message.content);
      });

    const regenBtn =
      msg.querySelector(".nexus-regen-btn");

    if (regenBtn) {
      regenBtn.addEventListener("click", () => {
        this.regenerateResponse();
      });
    }

    const editBtn =
      msg.querySelector(".nexus-edit-btn");

    if (editBtn) {
      editBtn.addEventListener("click", () => {
        this.startEditMessage(message);
      });
    }

    this.attachCodeCopyListeners(msg);

    box.appendChild(msg);
    box.scrollTop = box.scrollHeight;

    return msg;
  }

  async regenerateResponse() {
    if (this.isGenerating) return;

    SessionService.removeLastAssistantMessage();
    this.renderMessages();

    await this.generateAssistantReply();
  }

  async generateAssistantReply() {
    const input =
      this.container.querySelector("#chat-input");

    const sendBtn =
      this.container.querySelector("#send-btn");

    this.isGenerating = true;
    this.activeController =
      new AbortController();

    input.disabled = true;
    sendBtn.textContent = "Stop";

    const thinkingNode =
      this.appendMessageObject(
        {
          id: "thinking",
          role: "assistant",
          content: "Thinking..."
        },
        false,
        false,
        true
      );

    this.startThinkingAnimation(thinkingNode);

    try {
      const response =
        await AIService.sendMessage(
          this.activeController.signal
        );

      this.stopThinkingAnimation();
      thinkingNode.remove();

      this.appendMessageObject(
        {
          id:
            "msg_" +
            Date.now() +
            "_" +
            Math.random()
              .toString(36)
              .slice(2),
          role: "assistant",
          content: response
        },
        true,
        true,
        true
      );

      this.renderMessages();
    } catch (error) {
      this.stopThinkingAnimation();

      if (error.name === "AbortError") {
        thinkingNode.innerHTML =
          `<strong>Nexus</strong><br>Generation stopped`;
      } else {
        thinkingNode.innerHTML =
          `<strong>Error</strong><br>${error.message}`;
      }
    } finally {
      this.activeController = null;
      this.isGenerating = false;

      input.disabled = false;
      input.focus();

      sendBtn.textContent =
        this.editingMessageId
          ? "Save & Regenerate"
          : "Send";
    }
  }

  async sendMessage() {
    if (this.isGenerating) return;

    const input =
      this.container.querySelector("#chat-input");

    const sendBtn =
      this.container.querySelector("#send-btn");

    const text = input.value.trim();

    if (!text) return;

    if (this.editingMessageId) {
      SessionService.updateMessage(
        this.editingMessageId,
        text
      );

      SessionService.removeMessagesAfter(
        this.editingMessageId
      );

      this.editingMessageId = null;
      sendBtn.textContent = "Send";

      this.renderMessages();
      input.value = "";

      await this.generateAssistantReply();
      return;
    }

    this.appendMessageObject(
      {
        id:
          "msg_" +
          Date.now() +
          "_" +
          Math.random()
            .toString(36)
            .slice(2),
        role: "user",
        content: text
      },
      true,
      false,
      true
    );

    input.value = "";

    await this.generateAssistantReply();
  }
}