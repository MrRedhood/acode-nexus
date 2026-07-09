export default class WorkspaceSummaryPromptService {
  static buildPrompt(
    summary
  ) {
    const keyModules =
      summary.keyModules
        .slice(0, 8)
        .map(
          file =>
            `- ${file.name} (${file.path})`
        )
        .join("\n");

    const directories =
      summary.directories
        .slice(0, 12)
        .join(", ");

    const architecture =
      Object.entries(
        summary.architecture
      )
        .filter(
          ([, value]) => value
        )
        .map(([key]) => key)
        .join(", ");

    return `
ACTIVE WORKSPACE:
${summary.workspace}

WORKSPACE OVERVIEW:
- Total files: ${summary.totalFiles}
- Total functions: ${summary.totals.functions}
- Total classes: ${summary.totals.classes}
- Total imports: ${summary.totals.imports}

ARCHITECTURE:
${architecture || "Unknown"}

DIRECTORIES:
${directories || "None"}

KEY MODULES:
${keyModules || "None"}

Important:
You are inside this workspace.
Use workspace knowledge when answering coding questions.
Do not hallucinate files that do not exist.
`;
  }
}