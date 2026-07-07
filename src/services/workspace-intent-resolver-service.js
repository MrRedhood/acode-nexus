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

    const candidates =
      new Map();

    const addCandidate = (
      key,
      candidate
    ) => {
      const existing =
        candidates.get(key);

      if (!existing) {
        candidates.set(
          key,
          candidate
        );
        return;
      }

      existing.score +=
        candidate.score;

      existing.matches++;

      existing.keywords.push(
        ...candidate.keywords
      );
    };

    for (const keyword of keywords) {
      const lower =
        keyword.toLowerCase();

      const symbols =
        WorkspaceSymbolIndexService.findSimilar(
          keyword
        ) || [];

      for (const symbol of symbols) {
        let score = 80;

        if (
          symbol.name &&
          symbol.name
            .toLowerCase() ===
            lower
        ) {
          score += 100;
        } else if (
          symbol.name &&
          symbol.name
            .toLowerCase()
            .includes(lower)
        ) {
          score += 50;
        }

        addCandidate(
          `${symbol.path}:${symbol.name}`,
          {
            type:
              "symbol",

            score,

            matches: 1,

            keywords: [
              keyword
            ],

            result:
              symbol
          }
        );
      }

      const code =
        await SearchService.searchCode(
          keyword
        );

      for (const match of code) {
        let score = 20;

        const line =
          String(
            match.text || ""
          ).toLowerCase();

        if (
          line.includes(
            lower
          )
        ) {
          score += 20;
        }

        addCandidate(
          `${match.path}:${match.line}`,
          {
            type:
              "code",

            score,

            matches: 1,

            keywords: [
              keyword
            ],

            result:
              match
          }
        );
      }

      const files =
        SearchService.searchFiles(
          keyword
        );

      for (const file of files) {
        let score = 30;

        const name =
          String(
            file.name || ""
          ).toLowerCase();

        if (
          name === lower
        ) {
          score += 80;
        } else if (
          name.includes(
            lower
          )
        ) {
          score += 40;
        }

        addCandidate(
          file.path,
          {
            type:
              "file",

            score,

            matches: 1,

            keywords: [
              keyword
            ],

            result:
              file
          }
        );
      }
    }

    return {
      keywords,

      candidates:
        Array.from(
          candidates.values()
        ).sort(
          (
            a,
            b
          ) =>
            b.score -
            a.score
        )
    };
  }

  static extractKeywords(
    request
  ) {
    const tokens =
      String(
        request || ""
      ).match(
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