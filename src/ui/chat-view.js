import AIService from "../services/ai-service.js";
import SessionService from "../services/session-service.js";
import parseMarkdown from "../utils/markdown.js";

export default class ChatView {
  constructor(container) {
    this.container = container;
    this.activeController = null;
    this.isGenerating = false;
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
      this.sendMessage();
    });

    input.addEventListener("keydown", e => {
      if (e.key === "Enter" && !e.shiftKey) {
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

    messages.forEach(msg => {
      this.appendMessageObject(msg, false);
    });

    box.scrollTop = box.scrollHeight;
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

    setTimeout(() => {
      toast.remove();
    }, 1500);
  }

  copyText(content) {
    navigator.clipboard
      .writeText(content)
      .then(() => this.showToast("Copied!"))
      .catch(() => this.showToast("Copy failed"));
  }

  attachCodeCopyListeners(msgNode) {
    const buttons =
      msgNode.querySelectorAll(
        ".nexus-code-copy"
      );

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

  appendMessageObject(message, persist = true) {
    const box =
      this.container.querySelector("#chat-messages");

    if (!box) return;

    const msg = document.createElement("div");

    msg.className =
      "nexus-msg " +
      (message.role === "user"
        ? "nexus-user"
        : "nexus-ai");

    if (message.id) {
      msg.dataset.messageId = message.id;
    }

    const rendered =
      message.role === "user"
        ? message.content.replace(/\n/g, "<br>")
        : parseMarkdown(message.content);

    const label =
      message.role === "user"
        ? "You"
        : "Nexus";

    const extraButtons =
      message.role === "assistant"
        ? `
          <button
            class="nexus-msg-action-btn nexus-regen-btn"
          >
            ↻
          </button>
        `
        : "";

    msg.innerHTML = `
      <strong>${label}</strong><br>
      ${rendered}
      <div class="nexus-msg-actions">
        <button
          class="nexus-msg-action-btn nexus-copy-btn"
        >
          Copy
        </button>
        ${extraButtons}
      </div>
    `;

    const copyBtn =
      msg.querySelector(".nexus-copy-btn");

    copyBtn.addEventListener("click", () => {
      this.copyText(message.content);
    });

    const regenBtn =
      msg.querySelector(".nexus-regen-btn");

    if (regenBtn) {
      regenBtn.addEventListener("click", () => {
        this.regenerateResponse();
      });
    }

    this.attachCodeCopyListeners(msg);

    box.appendChild(msg);
    box.scrollTop = box.scrollHeight;

    if (persist) {
      SessionService.addMessage(
        message.role,
        message.content
      );
    }

    return msg;
  }

  async regenerateResponse() {
    if (this.isGenerating) return;

    SessionService.removeLastAssistantMessage();
    this.renderMessages();

    const lastUser =
      SessionService.getLastUserMessage();

    if (!lastUser) return;

    await this.generateAssistantReply();
  }

  async generateAssistantReply() {
    const input =
      this.container.querySelector("#chat-input");

    const sendBtn =
      this.container.querySelector("#send-btn");

    this.isGenerating = true;

    input.disabled = true;
    sendBtn.disabled = true;

    const thinkingNode =
      this.appendMessageObject(
        {
          id: "thinking",
          role: "assistant",
          content: "Thinking..."
        },
        false
      );

    try {
      const response =
        await AIService.sendMessage();

      thinkingNode.remove();

      this.appendMessageObject({
        role: "assistant",
        content: response
      });

    } catch (error) {
      console.error(error);

      thinkingNode.innerHTML =
        `<strong>Error</strong><br>${error.message}`;
    } finally {
      this.isGenerating = false;
      input.disabled = false;
      sendBtn.disabled = false;
      input.focus();
    }
  }

  async sendMessage() {
    if (this.isGenerating) return;

    const input =
      this.container.querySelector("#chat-input");

    const text = input.value.trim();

    if (!text) return;

    this.appendMessageObject({
      role: "user",
      content: text
    });

    input.value = "";

    await this.generateAssistantReply();
  }
}