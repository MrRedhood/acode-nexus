export default class ChatView {
  constructor(container) {
    this.container = container;
    this.messages = [];
  }

  render() {
    this.container.innerHTML = `
      <div id="chat-messages" style="height:300px;overflow:auto;border:1px solid #333;padding:8px;margin-top:12px;"></div>

      <textarea id="chat-input" placeholder="Type message..."
      style="width:100%;margin-top:12px;height:70px;"></textarea>

      <button id="send-btn" style="margin-top:8px;width:100%;">
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
    msg.style.marginBottom = "10px";
    msg.innerHTML = `<b>${role}:</b> ${text}`;

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
    }, 400);

    input.value = "";
  }
}