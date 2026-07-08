import AIService from "../../services/ai-service.js";
import parseMarkdown from "../../utils/markdown.js";

export default class ChatAI {
  static async generate(
    chat,
    signal
  ) {
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

    let assistantNode =
      null;

    const thinkingNode =
      chat.appendMessageObject(
        {
          id: "thinking",
          role: "assistant",
          content: "Thinking..."
        },
        false,
        false,
        true
      );

    chat.startThinkingAnimation(
      thinkingNode
    );

    try {
      const finalResponse =
        await AIService.sendMessageStream(
          fullText => {
            assistantMessage.content =
              fullText;

            if (
              thinkingNode &&
              thinkingNode.parentNode
            ) {
              chat.stopThinkingAnimation();

              thinkingNode.remove();

              assistantNode =
                chat.appendMessageObject(
                  {
                    id:
                      assistantMessage.id,
                    role:
                      "assistant",
                    content: ""
                  },
                  false,
                  true,
                  true
                );
            }

            if (
              assistantNode
            ) {
              const actions =
                assistantNode.querySelector(
                  ".nexus-msg-actions"
                );

              assistantNode.innerHTML = `
<strong>Nexus</strong><br>
${chat.convertFileReferences(
  parseMarkdown(
    fullText
  )
)}
`;

              if (
                actions
              ) {
                assistantNode.appendChild(
                  actions
                );
              }

              chat.attachCodeCopyListeners(
                assistantNode
              );

              chat.attachFileReferenceListeners(
                assistantNode
              );

              const box =
                chat.container.querySelector(
                  "#chat-messages"
                );

              if (
                box
              ) {
                box.scrollTop =
                  box.scrollHeight;
              }
            }
          },
          signal
        );

      assistantMessage.content =
        finalResponse ||
        assistantMessage.content ||
        "No response returned.";

      if (
        !assistantNode
      ) {
        chat.stopThinkingAnimation();

        if (
          thinkingNode &&
          thinkingNode.parentNode
        ) {
          thinkingNode.remove();
        }

        assistantNode =
          chat.appendMessageObject(
            assistantMessage,
            false,
            true,
            true
          );
      }

      if (
        assistantNode
      ) {
        const actions =
          assistantNode.querySelector(
            ".nexus-msg-actions"
          );

        assistantNode.innerHTML = `
<strong>Nexus</strong><br>
${chat.convertFileReferences(
  parseMarkdown(
    assistantMessage.content
  )
)}
`;

        if (
          actions
        ) {
          assistantNode.appendChild(
            actions
          );

          const copyBtn =
            assistantNode.querySelector(
              ".nexus-copy-btn"
            );

          if (
            copyBtn
          ) {
            copyBtn.onclick =
              () => {
                chat.copyText(
                  assistantMessage.content
                );
              };
          }
        }

        chat.attachCodeCopyListeners(
          assistantNode
        );

        chat.attachFileReferenceListeners(
          assistantNode
        );
      }

      return {
        assistantMessage,
        assistantNode
      };
    } catch (error) {
      chat.stopThinkingAnimation();

      if (
        error &&
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
            `<strong>Error</strong><br>${
              error?.message ||
              "Unknown error"
            }`;
        } else {
          chat.showToast(
            error?.message ||
              "Generation failed"
          );
        }
      }

      throw error;
    }
  }
}