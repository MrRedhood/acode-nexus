import AIService from "../services/ai-service.js";

export default class ChatView {
  constructor(container) {
    this.container = container;
  }

  render() {
    this.container.innerHTML = `
      <div id="chat-messages" class="nexus-chat"></div>

      <textarea
        id="chat-input"
        class="nexus-textarea"
        placeholder="Ask Nexus anything..."
      ></textarea>

      <button id="send-btn" class="nexus-button">
        Send
      </button>
    `;

    const sendBtn = this.container.querySelector("#send-btn");

    sendBtn.addEventListener("click", () => {
      this.sendMessage();
    });
  }

  appendMessage(role, text) {
    const box = this.container.querySelector("#chat-messages");

    const msg = document.createElement("div");

    let cssClass = "nexus-msg ";

    if (role === "You") {
      cssClass += "nexus-user";
    } else {
      cssClass += "nexus-ai";
    }

    msg.className = cssClass;
    msg.innerHTML = `<strong>${role}</strong><br>${text}`;

    box.appendChild(msg);
    box.scrollTop = box.scrollHeight;
  }

  async sendMessage() {
    const input = this.container.querySelector("#chat-input");
    const text = input.value.trim();

    if (!text) return;

    input.disabled = true;

    this.appendMessage("You", text);
    input.value = "";

    this.appendMessage("Nexus", "Thinking...");

    const box = this.container.querySelector("#chat-messages");
    const thinkingNode = box.lastChild;

    try {
      const response = await AIService.sendMessage(text);

      thinkingNode.innerHTML =
        `<strong>Nexus</strong><br>${response}`;
    } catch (error) {
      console.error(error);

      thinkingNode.innerHTML =
        `<strong>Error</strong><br>${error.message}`;
    } finally {
      input.disabled = false;
      input.focus();
    }
  }
}