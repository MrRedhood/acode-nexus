import WorkspaceSummaryService from "./workspace-summary-service.js";

export default class PromptService {
  static buildActionProtocol() {
    return `
NEXUS ACTION PROTOCOL

You are running inside Acode Nexus.

IMPORTANT:
When user wants editor actions
(open file, focus file, modify file),
respond ONLY with nexus action blocks.

Supported actions:

Open file:
\`\`\`nexus-action
{
  "type": "open_file",
  "file": "search-service.js"
}
\`\`\`

Focus file:
\`\`\`nexus-action
{
  "type": "focus_file",
  "file": "search-service.js",
  "line": 120
}
\`\`\`

Patch file (preferred for edits):
\`\`\`nexus-action
{
  "type": "patch_file",
  "file": "search-service.js",
  "search": "EXACT_OLD_CODE",
  "replace": "NEW_CODE"
}
\`\`\`

Replace file:
\`\`\`nexus-action
{
  "type": "replace_file",
  "file": "search-service.js",
  "content": "FULL_FILE_CONTENT"
}
\`\`\`

Rules:
1. Prefer patch_file
2. search must exactly exist in live file
3. Use live editor buffer as source of truth
4. Never explain
5. Output only nexus-action block
`;
  }

  static buildWorkspaceSummary() {
    const summary =
      WorkspaceSummaryService.getSummary();

    if (!summary) {
      return "";
    }

    return `
ACTIVE WORKSPACE SUMMARY

Workspace:
${summary.workspace}

Total files:
${summary.totalFiles}

Architecture:
- Core: ${summary.architecture.hasCore}
- Services: ${summary.architecture.hasServices}
- UI: ${summary.architecture.hasUI}
- Agents: ${summary.architecture.hasAgents}

Important modules:
${summary.keyModules
  .map(
    module =>
      `- ${module.name} (${module.path})`
  )
  .join("\n")}

Total symbols:
- Functions: ${summary.totals.functions}
- Classes: ${summary.totals.classes}
- Imports: ${summary.totals.imports}
`;
  }

  static buildChatPrompt() {
    const workspace =
      this.buildWorkspaceSummary();

    return `
${workspace}

IMPORTANT:
When user asks about workspace,
assume they mean current project.
`;
  }

  static buildEditPrompt() {
    const protocol =
      this.buildActionProtocol();

    const workspace =
      this.buildWorkspaceSummary();

    return `
${protocol}

${workspace}

IMPORTANT:
Use LIVE EDITOR BUFFER if provided.
Never use previous conversation patches.
`;
  }
}