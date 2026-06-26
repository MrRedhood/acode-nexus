export default class CommandMenu {
  constructor(chatView) {
    this.chatView = chatView;

    this.commands = [
      {
        name: "explain",
        description:
          "Explain code or concepts"
      },
      {
        name: "fix",
        description:
          "Debug and fix issues"
      },
      {
        name: "refactor",
        description:
          "Improve structure"
      },
      {
        name: "optimize",
        description:
          "Improve performance"
      },
      {
        name: "summarize",
        description:
          "Summarize content"
      }
    ];
  }

  update(text) {
    this.hide();

    if (!text.startsWith("/")) {
      return;
    }

    const query =
      text.slice(1).toLowerCase();

    const filtered =
      this.commands.filter(cmd =>
        cmd.name.includes(query)
      );

    if (!filtered.length) {
      return;
    }

    const menu =
      document.createElement("div");

    menu.className =
      "nexus-command-menu";

    menu.innerHTML = filtered
      .map(
        cmd => `
          <button
            class="nexus-command-item"
            data-command="${cmd.name}"
          >
            <strong>/${cmd.name}</strong><br>
            <small>${cmd.description}</small>
          </button>
        `
      )
      .join("");

    document.body.appendChild(menu);

    menu
      .querySelectorAll(
        ".nexus-command-item"
      )
      .forEach(btn => {
        btn.addEventListener(
          "click",
          () => {
            this.chatView.insertCommand(
              btn.dataset.command
            );

            this.hide();
          }
        );
      });

    this.menu = menu;
  }

  hide() {
    if (this.menu) {
      this.menu.remove();
      this.menu = null;
    }
  }
}