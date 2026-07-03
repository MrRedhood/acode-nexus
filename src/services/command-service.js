import SearchService from "./search-service.js";
import ActionService from "./action-service.js";
import WorkspaceManager from "./workspace-manager.js";

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
        "Locate file"
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
    },
    {
      name: "cleanup",
      description:
        "Cleanup stale workspace cache"
    },
    {
      name: "js",
      description:
        "Execute JavaScript"
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

  static async execute(text) {
    if (
      !text ||
      !text.startsWith("/")
    ) {
      return {
        handled: false
      };
    }

    if (text === "/cleanup") {
      WorkspaceManager.cleanupEmptyBuckets();

      await WorkspaceManager.scanWorkspace();

      if (
        SearchService.rebuildIndex
      ) {
        await SearchService.rebuildIndex();
      }

      return {
        handled: true,
        content:
          "Workspace cache cleaned and reindexed."
      };
    }

    if (text.startsWith("/js ")) {
      const code =
        text.slice(4).trim();

      if (!code) {
        return {
          handled: true,
          content:
            "Usage: /js <javascript>"
        };
      }

      try {
        let result =
          eval(code);

        if (
          result &&
          typeof result.then ===
            "function"
        ) {
          result =
            await result;
        }

        let output;

        if (
          typeof result ===
          "undefined"
        ) {
          output =
            "undefined";
        } else if (
          typeof result ===
          "string"
        ) {
          output = result;
        } else {
          try {
            output =
              JSON.stringify(
                result,
                null,
                2
              );
          } catch {
            output =
              String(result);
          }
        }

        return {
          handled: true,
          content:
`JS Result:

${output}`
        };
      } catch (error) {
        return {
          handled: true,
          content:
`JS Error:

${
  error?.stack ||
  error?.message ||
  String(error)
}`
        };
      }
    }

    if (text.startsWith("/files ")) {
      const query =
        text.slice(7).trim();

      const results =
        SearchService.searchFiles(
          query
        );

      let content =
        `File results for: ${query}\n\n`;

      if (results.length) {
        results.forEach(file => {
          content +=
            `• ${file.name} (${file.path})\n`;
        });
      } else {
        content +=
          "No files found.";
      }

      return {
        handled: true,
        content
      };
    }

    if (text.startsWith("/code ")) {
      const query =
        text.slice(6).trim();

      const results =
        await SearchService.searchCode(
          query
        );

      let content =
        `Code results for: ${query}\n\n`;

      if (results.length) {
        results.forEach(
          match => {
            content +=
              `• ${match.path}:${match.line} ${match.text}\n`;
          }
        );
      } else {
        content +=
          "No code matches found.";
      }

      return {
        handled: true,
        content
      };
    }

    if (text.startsWith("/grep ")) {
      const query =
        text.slice(6).trim();

      const results =
        await SearchService.searchAllFiles(
          query
        );

      let content =
        `Global code results for: ${query}\n\n`;

      if (results.length) {
        results.forEach(
          match => {
            content +=
              `• ${match.path}:${match.line}\n${match.text}\n\n`;
          }
        );
      } else {
        content +=
          "No global matches found.";
      }

      return {
        handled: true,
        content
      };
    }

    if (text.startsWith("/read ")) {
      const args =
        text.slice(6).trim();

      const parts =
        args.split(" ");

      const path =
        parts[0];

      const startLine =
        parts[1]
          ? parseInt(
              parts[1],
              10
            )
          : 1;

      const endLine =
        parts[2]
          ? parseInt(
              parts[2],
              10
            )
          : null;

      const result =
        await SearchService.readFile(
          path,
          startLine,
          endLine
        );

      if (!result) {
        return {
          handled: true,
          content:
            "Unable to read file."
        };
      }

      return {
        handled: true,
        content:
`File: ${result.file}

Lines ${result.startLine}-${result.endLine}

${result.content}`
      };
    }

    if (text.startsWith("/open ")) {
      const path =
        text.slice(6).trim();

      const result =
        SearchService.openFile(path);

      if (!result) {
        return {
          handled: true,
          content:
            "File not found."
        };
      }

      const open =
        ActionService.findOpenEditorFile(
          result.name
        );

      return {
        handled: true,
        content:
`Found file:

${result.path}

Open in editor:
${open ? "Yes" : "No"}`
      };
    }

    if (text.startsWith("/focus ")) {
      const args =
        text.slice(7).trim();

      const parts =
        args.split(" ");

      const file =
        parts[0];

      const line =
        parts[1]
          ? parseInt(
              parts[1],
              10
            )
          : null;

      const result =
        await ActionService.executeAction(
          {
            type:
              "focus_file",
            file,
            line
          }
        );

      return {
        handled: true,
        content:
          result.success
            ? `Focused ${file}${
                line
                  ? ` at line ${line}`
                  : ""
              }`
            : `Focus failed: ${result.error}`
      };
    }

    return {
      handled: false
    };
  }
}