export default class ThinkingRenderer {
  static start(chat, node) {
    let dots = 1;

    this.stop(chat);

    chat.thinkingInterval =
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
  }

  static stop(chat) {
    if (
      chat.thinkingInterval
    ) {
      clearInterval(
        chat.thinkingInterval
      );

      chat.thinkingInterval =
        null;
    }
  }
}