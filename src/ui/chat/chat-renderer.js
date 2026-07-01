import SessionService from "../../services/session-service.js";
import SearchService from "../../services/search-service.js";
import parseMarkdown from "../../utils/markdown.js";

export default {
  convertFileReferences(content) {
    if (!content) {
      return "";
    }

    return content.replace(
      /([A-Za-z0-9_./-]+\.(js|json|css|md)):(\d+)/g,
      (match, file, ext, line) => {
        return `
          <span
            class="nexus-file-ref"
            data-file="${file}"
            data-line="${line}"
            style="
              color:#7ab7ff;
              text-decoration:underline;
              cursor:pointer;
            "
          >
            ${match}
          </span>
        `;
      }
    );
  },

  attachFileReferenceListeners(msgNode) {
    const refs =
      msgNode.querySelectorAll(
        ".nexus-file-ref"
      );

    refs.forEach(ref => {
      ref.addEventListener(
        "click",
        () => {
          const filepath =
            ref.dataset.file;

          const line =
            parseInt(
              ref.dataset.line,
              10
            );

          const file =
            SearchService.openFile(
              filepath
            );

          if (!file) {
            this.showToast(
              "File not found"
            );
            return;
          }

          if (
            typeof editorManager ===
              "undefined" ||
            !editorManager ||
            !editorManager.switchFile
          ) {
            this.showToast(
              "editorManager missing"
            );
            return;
          }

          const openedFile =
            editorManager.files.find(
              f =>
                f.filename ===
                file.name
            );

          if (!openedFile) {
            this.showToast(
              "File tab not open"
            );
            return;
          }

          editorManager.switchFile(
            openedFile.id
          );

          let attempts = 0;
          const maxAttempts = 40;

          const waitForFile =
            setInterval(() => {
              attempts++;

              const active =
                editorManager.activeFile;

              if (
                active &&
                active.filename ===
                  openedFile.filename
              ) {
                clearInterval(
                  waitForFile
                );

                setTimeout(() => {
                  if (
                    editorManager.editor &&
                    editorManager.editor
                      .gotoLine
                  ) {
                    editorManager.editor.gotoLine(
                      line
                    );
                  }
                }, 100);
              }

              if (
                attempts >=
                maxAttempts
              ) {
                clearInterval(
                  waitForFile
                );

                this.showToast(
                  "File switch timeout"
                );
              }
            }, 100);
        }
      );
    });
  },

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
  },

  startThinkingAnimation(node) {
    let dots = 1;

    this.stopThinkingAnimation();

    this.thinkingInterval =
      setInterval(() => {
        dots++;

        if (dots > 3) {
          dots = 1;
        }

        node.innerHTML = `
          <strong>Nexus</strong><br>
          Thinking${".".repeat(dots)}
        `;
      }, 450);
  },

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
  },

  showToast(text) {
    const old =
      document.querySelector(
        ".nexus-copy-toast"
      );

    if (old) {
      old.remove();
    }

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
  },

  copyText(content) {
    if (!content) {
      this.showToast(
        "Nothing to copy"
      );
      return;
    }

    const fallbackCopy = () => {
      try {
        const textarea =
          document.createElement(
            "textarea"
          );

        textarea.value =
          content;
        textarea.style.position =
          "fixed";
        textarea.style.left =
          "-9999px";
        textarea.style.top =
          "0";

        document.body.appendChild(
          textarea
        );

        textarea.focus();
        textarea.select();

        const success =
          document.execCommand(
            "copy"
          );

        document.body.removeChild(
          textarea
        );

        if (success) {
          this.showToast(
            "Copied!"
          );
        } else {
          this.showToast(
            "Copy failed"
          );
        }
      } catch (error) {
        console.error(
          "Copy fallback failed:",
          error
        );

        this.showToast(
          "Copy failed"
        );
      }
    };

    if (
      navigator.clipboard &&
      navigator.clipboard.writeText
    ) {
      navigator.clipboard
        .writeText(content)
        .then(() => {
          this.showToast(
            "Copied!"
          );
        })
        .catch(() => {
          fallbackCopy();
        });
    } else {
      fallbackCopy();
    }
  },

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

          if (!wrapper) {
            return;
          }

          const textarea =
            wrapper.querySelector(
              ".nexus-hidden-code"
            );

          if (!textarea) {
            return;
          }

          this.copyText(
            textarea.value
          );
        }
      );
    });
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
      message.role === "user"
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
      message.role === "user"
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