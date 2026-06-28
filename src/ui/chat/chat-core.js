import SessionService from "../../services/session-service.js";
import StorageService from "../../services/storage-service.js";
import AttachmentStorage from "../../services/attachment-storage.js";

export default {
  render() {
    this.container.innerHTML = `
      <div id="chat-messages" class="nexus-chat"></div>

      <div class="nexus-input-area">
        <div class="nexus-token-bar">
          <span id="token-counter">
            Used: 0 / 32K
          </span>
        </div>

        <div
          id="attachment-preview"
          class="nexus-attachment-preview"
        ></div>

        <div class="nexus-input-row">
          <button
            id="attach-btn"
            class="nexus-circle-btn"
          >
            +
          </button>

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
    this.renderAttachmentPreview();

    const sendBtn =
      this.container.querySelector(
        "#send-btn"
      );

    const input =
      this.container.querySelector(
        "#chat-input"
      );

    const attachBtn =
      this.container.querySelector(
        "#attach-btn"
      );

    sendBtn.addEventListener(
      "click",
      () => {
        if (this.isGenerating) {
          this.stopGeneration();
        } else {
          this.sendMessage();
        }
      }
    );

    attachBtn.addEventListener(
      "click",
      () => {
        this.attachmentMenu.open();
      }
    );

    input.addEventListener(
      "input",
      () => {
        this.autoResizeTextarea(
          input
        );

        this.updateTokenCounter();

        this.commandMenu.update(
          input.value
        );
      }
    );

    input.addEventListener(
      "keydown",
      e => {
        if (
          e.key === "Enter" &&
          !e.shiftKey &&
          !this.isGenerating
        ) {
          e.preventDefault();
          this.sendMessage();
        }
      }
    );

    this.autoResizeTextarea(
      input
    );

    this.updateTokenCounter();
  },

  insertCommand(command) {
    const input =
      this.container.querySelector(
        "#chat-input"
      );

    if (!input) return;

    input.value =
      "/" + command + " ";

    input.focus();

    this.autoResizeTextarea(
      input
    );

    this.updateTokenCounter();
  },

  autoResizeTextarea(input) {
    input.style.height =
      "auto";

    const maxHeight = 180;

    const newHeight =
      Math.min(
        input.scrollHeight,
        maxHeight
      );

    input.style.height =
      newHeight + "px";

    input.style.overflowY =
      input.scrollHeight >
      maxHeight
        ? "auto"
        : "hidden";
  },

  estimateTokens(charCount) {
    return Math.ceil(
      charCount / 3
    );
  },

  formatTokenLimit(value) {
    if (value >= 1000000) {
      return (
        (
          value /
          1000000
        ).toFixed(1)
          .replace(".0", "") +
        "M"
      );
    }

    if (value >= 1000) {
      return (
        (
          value / 1000
        ).toFixed(1)
          .replace(".0", "") +
        "K"
      );
    }

    return String(value);
  },

  async calculateAttachmentChars(
    attachmentIds = []
  ) {
    let total = 0;

    for (const id of attachmentIds) {
      try {
        const attachment =
          await AttachmentStorage.getAttachment(
            id
          );

        if (attachment) {
          total +=
            (
              attachment.content ||
              ""
            ).length;
        }
      } catch (error) {
        console.error(
          error
        );
      }
    }

    return total;
  },

  async updateTokenCounter() {
    const counter =
      this.container.querySelector(
        "#token-counter"
      );

    const input =
      this.container.querySelector(
        "#chat-input"
      );

    if (!counter || !input) {
      return;
    }

    const messages =
      SessionService.getMessages();

    let totalChars =
      input.value.length;

    for (const msg of messages) {
      totalChars +=
        (
          msg.content || ""
        ).length;

      totalChars +=
        await this.calculateAttachmentChars(
          msg.attachmentIds || []
        );
    }

    const pending =
      this.pendingAttachments ||
      [];

    for (const att of pending) {
      totalChars +=
        (
          att.content || ""
        ).length;
    }

    const tokens =
      this.estimateTokens(
        totalChars
      );

    const display =
      this.formatTokenLimit(
        tokens
      );

    const contextLimit =
      StorageService.get(
        "contextLimit"
      ) || 32000;

    const limitDisplay =
      this.formatTokenLimit(
        contextLimit
      );

    const usage =
      tokens /
      contextLimit;

    counter.style.color =
      "";

    if (usage >= 0.95) {
      counter.style.color =
        "#ff4d4d";
    } else if (
      usage >= 0.8
    ) {
      counter.style.color =
        "#ffb84d";
    }

    counter.textContent =
      `Used: ${display} / ${limitDisplay}`;
  }
};