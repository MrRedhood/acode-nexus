import AIService from "../services/ai-service.js";
import SessionService from "../services/session-service.js";
import parseMarkdown from "../utils/markdown.js";
import AttachmentMenu from "./menus/attachment-menu.js";
import CommandMenu from "./menus/command-menu.js";

export default class ChatView {
  constructor(container) {
    this.container = container;
    this.activeController = null;
    this.isGenerating = false;
    this.editingMessageId = null;
    this.thinkingInterval = null;

    this.attachmentMenu =
      new AttachmentMenu(this);

    this.commandMenu =
      new CommandMenu(this);
  }

  render() {
    this.container.innerHTML = `
      <div id="chat-messages" class="nexus-chat"></div>

      <div class="nexus-input-area">
        <div class="nexus-token-bar">
          <span id="token-counter">Used: 0 / 128K</span>
        </div>

        <div class="nexus-input-row">
          <button id="attach-btn" class="nexus-circle-btn">+</button>

          <textarea
            id="chat-input"
            class="nexus-textarea"
            placeholder="Ask Nexus anything..."
          ></textarea>

          <button
            id="send-btn"
            class="nexus-circle-btn nexus-send-btn"
          >
            ↑
          </button>
        </div>
      </div>
    `;

    this.renderMessages();

    const sendBtn =
      this.container.querySelector("#send-btn");

    const input =
      this.container.querySelector("#chat-input");

    const attachBtn =
      this.container.querySelector("#attach-btn");

    sendBtn.addEventListener("click", () => {
      if (this.isGenerating) {
        this.stopGeneration();
      } else {
        this.sendMessage();
      }
    });

    attachBtn.addEventListener("click", () => {
      this.attachmentMenu.open();
    });

    input.addEventListener("input", () => {
      this.autoResizeTextarea(input);
      this.updateTokenCounter();
      this.commandMenu.update(input.value);
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

    this.autoResizeTextarea(input);
    this.updateTokenCounter();
  }

  insertCommand(command) {
    const input =
      this.container.querySelector("#chat-input");

    if (!input) return;

    input.value = "/" + command + " ";
    input.focus();

    this.autoResizeTextarea(input);
    this.updateTokenCounter();
  }

  autoResizeTextarea(input) {
    input.style.height = "auto";

    const maxHeight = 180;
    const newHeight = Math.min(
      input.scrollHeight,
      maxHeight
    );

    input.style.height = newHeight + "px";
    input.style.overflowY =
      input.scrollHeight > maxHeight
        ? "auto"
        : "hidden";
  }

  estimateTokens(charCount) {
    return Math.ceil(charCount / 4);
  }

  updateTokenCounter() {
    const counter =
      this.container.querySelector(
        "#token-counter"
      );

    const input =
      this.container.querySelector("#chat-input");

    if (!counter || !input) return;

    const messages =
      SessionService.getMessages();

    let totalChars = input.value.length;

    messages.forEach(msg => {
      totalChars += msg.content.length;
    });

    const tokens =
      this.estimateTokens(totalChars);

    const display =
      tokens >= 1000
        ? (tokens / 1000).toFixed(1) + "K"
        : tokens;

    counter.textContent =
      `Used: ${display} / 128K`;
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
    this.updateTokenCounter();
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

    this.editingMessageId = message.id;
    input.value = message.content;
    input.focus();

    this.autoResizeTextarea(input);
    this.updateTokenCounter();
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

  animateMessage(node) {
    node.style.opacity = "0";
    node.style.transform = "translateY(-18px)";
    node.style.transition = "none";

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        node.style.transition =
          "opacity 0.35s ease, transform 0.35s ease";
        node.style.opacity = "1";
        node.style.transform = "translateY(0)";
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

    if (animate) {
      this.animateMessage(msg);
    }

    box.scrollTop = box.scrollHeight;
    this.updateTokenCounter();

    return msg;
  }