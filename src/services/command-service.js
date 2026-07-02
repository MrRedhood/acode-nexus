export default class CommandService {
  static commands = [
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
    },
    {
      name: "files",
      description:
        "Search workspace files"
    },
    {
      name: "code",
      description:
        "Search code"
    },
    {
      name: "open",
      description:
        "Open file"
    },
    {
      name: "grep",
      description:
        "Search all files"
    },
    {
      name: "read",
      description:
        "Read file lines"
    },
    {
      name: "focus",
      description:
        "Focus open file and jump line"
    }
  ];

  static getCommands() {
    return this.commands;
  }

  static search(query = "") {
    const lower =
      query.toLowerCase();

    return this.commands.filter(
      cmd =>
        cmd.name.includes(lower)
    );
  }
}