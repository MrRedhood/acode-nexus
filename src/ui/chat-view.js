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

  sendMessage() {
    const input = this.container.querySelector("#chat-input");
    const text = input.value.trim();

    if (!text) return;

    this.appendMessage("You", text);

    const provider = document.getElementById("provider-select").value;
    const model = document.getElementById("model-select").value;

    setTimeout(() => {
      this.appendMessage(
        "Nexus",
        `[${provider} | ${model}] Nexus received: ${text}`
      );
    }, 300);

    input.value = "";
  }
}