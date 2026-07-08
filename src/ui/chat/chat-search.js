import SearchService from "../../services/search-service.js";

export default class ChatSearch {
  static hints = [
    "where is ",
    "find ",
    "implemented",
    "defined",
    "locate"
  ];

  static isSearchQuery(
    text
  ) {
    const value =
      String(
        text || ""
      ).toLowerCase();

    return this.hints.some(
      hint =>
        value.includes(
          hint
        )
    );
  }

  static extractSymbol(
    text
  ) {
    const words =
      text.match(
        /[A-Za-z_][A-Za-z0-9_]*/g
      ) || [];

    let symbol =
      words.find(
        word =>
          /[a-z][A-Z]/.test(
            word
          )
      );

    if (symbol) {
      return symbol;
    }

    const ignored = [
      "where",
      "find",
      "implemented",
      "defined",
      "locate",
      "function",
      "method",
      "class",
      "interface",
      "enum",
      "variable",
      "const",
      "let",
      "var",
      "is"
    ];

    return (
      words.find(
        word =>
          word.length >
            2 &&
          !ignored.includes(
            word.toLowerCase()
          )
      ) || null
    );
  }

  static async execute(
    chat,
    text
  ) {
    if (
      !this.isSearchQuery(
        text
      )
    ) {
      return false;
    }

    const symbol =
      this.extractSymbol(
        text
      );

    if (!symbol) {
      return false;
    }

    const results =
      await SearchService.searchCode(
        symbol
      );

    let content =
      `${symbol} found in:\n\n`;

    if (
      results.length
    ) {
      results
        .slice(0, 10)
        .forEach(
          match => {
            content +=
              `• ${match.path}:${match.line}\n`;
          }
        );
    } else {
      content =
        `No results found for ${symbol}`;
    }

    chat.appendMessageObject(
      {
        id:
          "msg_" +
          Date.now(),
        role:
          "assistant",
        content
      },
      true,
      true,
      true
    );

    return true;
  }
}