  async generateAssistantReply() {
    const sendBtn =
      this.container.querySelector(
        "#send-btn"
      );

    const escapeHtml = text =>
      (text || "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");

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

    let streamedText = "";
    let assistantNode = null;

    try {
      const assistantMessage = {
        id:
          "msg_" +
          Date.now() +
          "_" +
          Math.random()
            .toString(36)
            .slice(2),
        role: "assistant",
        content: ""
      };

      await AIService.sendMessageStream(
        fullText => {
          streamedText =
            fullText;
                    if (
            !assistantNode
          ) {
            this.stopThinkingAnimation();

            if (
              thinkingNode &&
              thinkingNode.parentNode
            ) {
              thinkingNode.remove();
            }

            assistantNode =
              this.appendMessageObject(
                assistantMessage,
                false,
                true,
                true
              );
          }

          const actions =
            assistantNode.querySelector(
              ".nexus-msg-actions"
            );

          assistantNode.innerHTML = `
            <strong>Nexus</strong><br>
            ${escapeHtml(
              fullText
            ).replace(
              /\n/g,
              "<br>"
            )}
          `;

          if (actions) {
            assistantNode.appendChild(
              actions
            );
          }

          const box =
            this.container.querySelector(
              "#chat-messages"
            );

          if (box) {
            box.scrollTop =
              box.scrollHeight;
          }
        },
        this.activeController.signal
      );

            assistantMessage.content =
        streamedText ||
        "No response returned.";

      if (assistantNode) {
        const actions =
          assistantNode.querySelector(
            ".nexus-msg-actions"
          );

        assistantNode.innerHTML = `
          <strong>Nexus</strong><br>
          ${parseMarkdown(
            assistantMessage.content
          )}
        `;

        if (actions) {
          assistantNode.appendChild(
            actions
          );
        }

        this.attachCodeCopyListeners(
          assistantNode
        );
      }

      SessionService.addExistingMessage(
        assistantMessage
      );
    } catch (error) {
      this.stopThinkingAnimation();

      if (
        error.name ===
        "AbortError"
      ) {
        if (
          thinkingNode &&
          thinkingNode.parentNode
        ) {
          thinkingNode.innerHTML =
            `<strong>Nexus</strong><br>Generation stopped`;
        }
      } else {
        if (
          thinkingNode &&
          thinkingNode.parentNode
        ) {
          thinkingNode.innerHTML =
            `<strong>Error</strong><br>${error.message}`;
        } else {
          this.showToast(
            error.message ||
              "Generation failed"
          );
        }
      }
    } finally {
      this.activeController =
        null;

      this.isGenerating =
        false;

      sendBtn.textContent =
        "↑";
    }
  },