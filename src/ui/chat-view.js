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
    this.editingAttachmentIds = [];
    this.thinkingInterval = null;
    this.pendingAttachments = [];

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

        <div
          id="attachment-preview"
          class="nexus-attachment-preview"
        ></div>

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
    this.renderAttachmentPreview();

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

  openFilePicker(type) {
    const input =
      document.createElement("input");

    input.type = "file";

    if (type === "image") {
      input.accept = "image/*";
    }

    if (type === "txt") {
      input.accept = ".txt,text/plain";
    }

    if (type === "pdf") {
      input.accept = ".pdf,application/pdf";
    }

    if (type === "code") {
      input.accept =
        ".js,.ts,.jsx,.tsx,.py,.java,.cpp,.c,.cs,.html,.css,.json,.xml,.md";
    }

    input.addEventListener("change", async e => {
      const file = e.target.files?.[0];

      if (!file) return;

      await this.handleSelectedFile(
        file,
        type
      );
    });

    input.click();
  }

  async handleSelectedFile(file, type) {
    const attachment = {
      id:
        "att_" +
        Date.now() +
        "_" +
        Math.random()
          .toString(36)
          .slice(2),

      name: file.name,
      size: file.size,
      type
    };

    if (type === "image") {
      attachment.file = file;
    } else {
      attachment.content =
        await file.text();
    }

    this.pendingAttachments.push(
      attachment
    );

    this.renderAttachmentPreview();

    this.showToast(
      `${file.name} attached`
    );
  }

  renderAttachmentPreview() {
    const preview =
      this.container.querySelector(
        "#attachment-preview"
      );

    if (!preview) return;

    const existingAttachments =
      SessionService.getAttachments(
        this.editingAttachmentIds
      );

    const hasExisting =
      existingAttachments.length > 0;

    const hasPending =
      this.pendingAttachments.length > 0;

    if (!hasExisting && !hasPending) {
      preview.innerHTML = "";
      preview.style.display = "none";
      return;
    }

    preview.style.display = "flex";

    const existingHtml =
      existingAttachments
        .map(att => {
          const icon =
            att.type === "image"
              ? "📷"
              : att.type === "pdf"
              ? "📕"
              : "📎";

          return `
            <div class="nexus-attachment-chip">
              <span class="nexus-attachment-chip-text">
                ${icon}
                ${att.name}
                (${this.formatFileSize(att.size)})
              </span>

              <button
                class="nexus-attachment-remove-existing"
                data-id="${att.id}"
              >
                ×
              </button>
            </div>
          `;
        })
        .join("");

    const pendingHtml =
      this.pendingAttachments
        .map(att => {
          const icon =
            att.type === "image"
              ? "📷"
              : att.type === "pdf"
              ? "📕"
              : "📎";

          return `
            <div class="nexus-attachment-chip">
              <span class="nexus-attachment-chip-text">
                ${icon}
                ${att.name}
                (${this.formatFileSize(att.size)})
              </span>

              <button
                class="nexus-attachment-remove"
                data-id="${att.id}"
              >
                ×
              </button>
            </div>
          `;
        })
        .join("");

    preview.innerHTML =
      existingHtml + pendingHtml;

    preview
      .querySelectorAll(
        ".nexus-attachment-remove"
      )
      .forEach(btn => {
        btn.addEventListener("click", () => {
          this.removeAttachment(
            btn.dataset.id
          );
        });
      });

    preview
      .querySelectorAll(
        ".nexus-attachment-remove-existing"
      )
      .forEach(btn => {
        btn.addEventListener("click", () => {
          this.removeExistingAttachment(
            btn.dataset.id
          );
        });
      });
  }

  removeAttachment(id) {
    this.pendingAttachments =
      this.pendingAttachments.filter(
        att => att.id !== id
      );

    this.renderAttachmentPreview();
  }

  removeExistingAttachment(id) {
    this.editingAttachmentIds =
      this.editingAttachmentIds.filter(
        attId => attId !== id
      );

    this.renderAttachmentPreview();
  }

  renderMessageAttachments(
    attachmentIds = []
  ) {
    if (
      !attachmentIds ||
      attachmentIds.length === 0
    ) {
      return "";
    }

    const attachments =
      SessionService.getAttachments(
        attachmentIds
      );

    if (!attachments.length) {
      return "";
    }

    return `
      <div class="nexus-message-attachments">
        ${attachments
          .map(att => {
            const icon =
              att.type === "image"
                ? "📷"
                : att.type === "pdf"
                ? "📕"
                : "📎";

            return `
              <div class="nexus-message-attachment-chip">
                ${icon}
                ${att.name}
              </div>
            `;
          })
          .join("")}
      </div>
    `;
  }

  formatFileSize(bytes) {
    if (bytes < 1024) {
      return bytes + " B";
    }

    if (bytes < 1024 * 1024) {
      return (
        (bytes / 1024).toFixed(1) + " KB"
      );
    }

    return (
      (bytes / (1024 * 1024)).toFixed(1) +
      " MB"
    );
  }

    autoResizeTextarea(input) {
    input.style.height = "auto";

    const maxHeight = 180;
    const newHeight = Math.min(
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
      this.container.querySelector(
        "#chat-input"
      );

    if (!counter || !input) return;

    const messages =
      SessionService.getMessages();

    let totalChars =
      input.value.length;

    messages.forEach(msg => {
      totalChars +=
        msg.content.length;
    });

    const tokens =
      this.estimateTokens(
        totalChars
      );

    const display =
      tokens >= 1000
        ? (
            tokens / 1000
          ).toFixed(1) + "K"
        : tokens;

    counter.textContent =
      `Used: ${display} / 128K`;
  }

  renderMessages() {
    const box =
      this.container.querySelector(
        "#chat-messages"
      );

    if (!box) return;

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
  }

  startThinkingAnimation(
    node
  ) {
    let dots = 1;

    this.stopThinkingAnimation();

    this.thinkingInterval =
      setInterval(() => {
        dots++;
        if (dots > 3)
          dots = 1;

        node.innerHTML = `
          <strong>Nexus</strong><br>
          Thinking${".".repeat(dots)}
        `;
      }, 450);
  }

  stopThinkingAnimation() {
    if (
      this.thinkingInterval
    ) {
      clearInterval(
        this.thinkingInterval
      );
      this.thinkingInterval =
        null;
    }
  }

  showToast(text) {
    const old =
      document.querySelector(
        ".nexus-copy-toast"
      );

    if (old) old.remove();

    const toast =
      document.createElement(
        "div"
      );

    toast.className =
      "nexus-copy-toast";
    toast.textContent = text;

    document.body.appendChild(
      toast
    );

    setTimeout(
      () => toast.remove(),
      1500
    );
  }

  copyText(content) {
    navigator.clipboard
      .writeText(content)
      .then(() =>
        this.showToast(
          "Copied!"
        )
      )
      .catch(() =>
        this.showToast(
          "Copy failed"
        )
      );
  }

  stopGeneration() {
    if (
      this.activeController
    ) {
      this.activeController.abort();
    }
  }

  startEditMessage(
    message
  ) {
    const input =
      this.container.querySelector(
        "#chat-input"
      );

    this.editingMessageId =
      message.id;

    this.editingAttachmentIds =
      [
        ...(message
          .attachmentIds || [])
      ];

    input.value =
      message.content;

    input.focus();

    this.renderAttachmentPreview();

    this.autoResizeTextarea(
      input
    );

    this.updateTokenCounter();
  }

  attachCodeCopyListeners(
    msgNode
  ) {
    const buttons =
      msgNode.querySelectorAll(
        ".nexus-code-copy"
      );

    buttons.forEach(button => {
      button.addEventListener(
        "click",
        e => {
          e.stopPropagation();

          const wrapper =
            button.closest(
              ".nexus-code-block"
            );

          if (!wrapper) return;

          const textarea =
            wrapper.querySelector(
              ".nexus-hidden-code"
            );

          if (!textarea) return;

          this.copyText(
            textarea.value
          );
        }
      );
    });
  }

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
  }

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

    if (!box) return;

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

    const rendered =
      message.role ===
      "user"
        ? message.content.replace(
            /\n/g,
            "<br>"
          )
        : parseMarkdown(
            message.content
          );

    const label =
      message.role ===
      "user"
        ? "You"
        : "Nexus";

    const attachmentsHtml =
      message.role ===
      "user"
        ? this.renderMessageAttachments(
            message.attachmentIds
          )
        : "";

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

    msg.innerHTML = `
      <strong>${label}</strong><br>
      ${attachmentsHtml}
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

    box.appendChild(msg);

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

    async regenerateResponse() {
    if (this.isGenerating) return;

    SessionService.removeLastAssistantMessage();
    this.renderMessages();

    await this.generateAssistantReply();
  }

  async generateAssistantReply() {
    const sendBtn =
      this.container.querySelector(
        "#send-btn"
      );

    this.isGenerating = true;
    this.activeController =
      new AbortController();

    this.commandMenu.hide();

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

    this.startThinkingAnimation(
      thinkingNode
    );

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

      if (
        error.name ===
        "AbortError"
      ) {
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
      this.container.querySelector(
        "#chat-input"
      );

    const text = input.value.trim();

    if (
      !text &&
      this.pendingAttachments.length === 0 &&
      this.editingAttachmentIds.length === 0
    ) {
      return;
    }

    this.commandMenu.hide();

    if (this.editingMessageId) {
      const data =
        SessionService.load();

      const session =
        data.sessions.find(
          s =>
            s.id ===
            data.currentSessionId
        );

      if (!session) return;

      const msg =
        session.messages.find(
          m =>
            m.id ===
            this.editingMessageId
        );

      if (!msg) return;

      const newAttachmentIds = [];

      this.pendingAttachments.forEach(
        att => {
          SessionService.addAttachment(
            att
          );

          newAttachmentIds.push(
            att.id
          );
        }
      );

      msg.content = text || "[Attachment]";
      msg.attachmentIds = [
        ...this.editingAttachmentIds,
        ...newAttachmentIds
      ];

      SessionService.save(data);

      SessionService.removeMessagesAfter(
        this.editingMessageId
      );

      this.editingMessageId = null;
      this.editingAttachmentIds = [];
      this.pendingAttachments = [];

      this.renderAttachmentPreview();
      this.renderMessages();

      input.value = "";

      this.autoResizeTextarea(
        input
      );

      this.updateTokenCounter();

      await this.generateAssistantReply();
      return;
    }

    const attachmentIds = [];

    this.pendingAttachments.forEach(
      att => {
        SessionService.addAttachment(
          att
        );

        attachmentIds.push(att.id);
      }
    );

    const message =
      SessionService.createMessage(
        "user",
        text || "[Attachment]",
        attachmentIds
      );

    this.appendMessageObject(
      message,
      true,
      false,
      false
    );

    input.value = "";
    this.pendingAttachments = [];
    this.editingAttachmentIds = [];

    this.renderAttachmentPreview();

    this.autoResizeTextarea(input);
    this.updateTokenCounter();

    await this.generateAssistantReply();
  }
}