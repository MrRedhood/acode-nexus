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
      this.openAttachmentMenu();
    });

    input.addEventListener("input", () => {
      this.autoResizeTextarea(input);
      this.updateTokenCounter();
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

    openAttachmentMenu() {
    const overlay = document.createElement("div");
    overlay.className = "nexus-action-overlay";

    overlay.innerHTML = `
      <div class="nexus-action-sheet">
        <button data-type="image">Upload Image</button>
        <button data-type="txt">Upload Text File</button>
        <button data-type="pdf">Upload PDF</button>
        <button data-type="code">Upload Code File</button>
        <button data-type="cancel">Cancel</button>
      </div>
    `;

    document.body.appendChild(overlay);

    overlay.addEventListener("click", e => {
      if (e.target === overlay) {
        overlay.remove();
      }
    });

    overlay.querySelectorAll("button")
      .forEach(btn => {
        btn.addEventListener("click", () => {
          const type = btn.dataset.type;
          overlay.remove();

          if (type === "cancel") return;

          const labels = {
            image: "Image upload coming soon",
            txt: "Text upload coming soon",
            pdf: "PDF upload coming soon",
            code: "Code upload coming soon"
          };

          this.showToast(labels[type]);
        });
      });
  }

  async regenerateResponse() {
    if (this.isGenerating) return;

    SessionService.removeLastAssistantMessage();
    this.renderMessages();

    await this.generateAssistantReply();
  }

  async generateAssistantReply() {
    const sendBtn =
      this.container.querySelector("#send-btn");

    this.isGenerating = true;
    this.activeController =
      new AbortController();

    sendBtn.textContent = "■";

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

      sendBtn.textContent = "↑";
    }
  }

  async sendMessage() {
    if (this.isGenerating) return;

    const input =
      this.container.querySelector("#chat-input");

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

      this.renderMessages();

      input.value = "";
      this.autoResizeTextarea(input);
      this.updateTokenCounter();

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
      false
    );

    input.value = "";
    this.autoResizeTextarea(input);
    this.updateTokenCounter();

    await this.generateAssistantReply();
  }
}