import SearchService from "./search-service.js";
import WorkspaceSymbolIndexService from "./workspace-symbol-index-service.js";

export default class WorkspaceIntentResolverService {
  static IGNORE_WORDS = new Set([
    "fix",
    "bug",
    "issue",
    "problem",
    "error",
    "make",
    "change",
    "update",
    "modify",
    "rewrite",
    "replace",
    "optimize",
    "improve",
    "refactor",
    "rename",
    "delete",
    "remove",
    "insert",
    "add",
    "please",
    "can",
    "you",
    "the",
    "this",
    "that",
    "file",
    "function",
    "class",
    "method",
    "variable",
    "code",
    "to",
    "in",
    "of",
    "for",
    "on",
    "and",
    "is"
  ]);

  static async resolve(
    request
  ) {
    const keywords =
      this.extractKeywords(
        request
      );

    const candidates = [];

    for (const keyword of keywords) {
      const symbols =
        WorkspaceSymbolIndexService.findSimilar(
          keyword
        ) || [];

      for (const symbol of symbols) {
        candidates.push({
          score: 100,
          type: "symbol",
          keyword,
          result: symbol
        });
      }

      const code =
        await SearchService.searchCode(
          keyword
        );

      for (const match of code) {
        candidates.push({
          score: 60,
          type: "code",
          keyword,
          result: match
        });
      }

      const files =
        SearchService.searchFiles(
          keyword
        );

      for (const file of files) {
        candidates.push({
          score: 30,
          type: "file",
          keyword,
          result: file
        });
      }
    }

    candidates.sort(
      (a, b) =>
        b.score - a.score
    );

    return {
      keywords,
      candidates
    };
  }

  static extractKeywords(
    request
  ) {
    const tokens =
      String(request || "")
        .match(
          /[A-Za-z_$][A-Za-z0-9_$]*/g
        ) || [];

    return [
      ...new Set(
        tokens.filter(
          token =>
            !this.IGNORE_WORDS.has(
              token.toLowerCase()
            )
        )
      )
    ];
  }
}