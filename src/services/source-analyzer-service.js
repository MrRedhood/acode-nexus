export default class SourceAnalyzerService {
  static analyze(
    content
  ) {
    return {
      imports:
        this.extractImports(
          content
        ),

      exports:
        this.extractExports(
          content
        ),

      classes:
        this.extractClasses(
          content
        ),

      functions:
        this.extractFunctions(
          content
        )
    };
  }

  static getExtension(
    name
  ) {
    if (!name) {
      return "";
    }

    const parts =
      name.split(".");

    if (
      parts.length < 2
    ) {
      return "";
    }

    return parts.pop();
  }

  static extractImports(
    content
  ) {
    const matches =
      content.matchAll(
        /import\s+.*?from\s+["'](.+?)["']/g
      );

    return [
      ...new Set(
        [...matches].map(
          match =>
            match[1]
        )
      )
    ];
  }

  static extractExports(
    content
  ) {
    const matches =
      content.matchAll(
        /export\s+(?:default\s+)?(?:class|function|const|let|var)?\s*([A-Za-z0-9_$]*)/g
      );

    return [
      ...new Set(
        [...matches]
          .map(
            match =>
              match[1]
          )
          .filter(Boolean)
      )
    ];
  }

  static extractClasses(
    content
  ) {
    const matches =
      content.matchAll(
        /class\s+([A-Za-z0-9_$]+)/g
      );

    return [
      ...new Set(
        [...matches].map(
          match =>
            match[1]
        )
      )
    ];
  }

  static extractFunctions(
    content
  ) {
    const matches =
      content.matchAll(
        /(?:async\s+)?([A-Za-z0-9_$]+)\s*\([^)]*\)\s*\{/g
      );

    return [
      ...new Set(
        [...matches]
          .map(
            match =>
              match[1]
          )
          .filter(
            name =>
              ![
                "if",
                "for",
                "while",
                "switch",
                "catch"
              ].includes(
                name
              )
          )
      )
    ];
  }
}