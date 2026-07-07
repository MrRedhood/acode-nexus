export default class LiveBufferSymbolService {
  static findSymbol(
    buffer,
    symbolName
  ) {
    return (
      this.findFunction(
        buffer,
        symbolName
      ) ||
      this.findClass(
        buffer,
        symbolName
      )
    );
  }

  static findAllSymbols(
    buffer
  ) {
    return [
      ...this.findAllClasses(
        buffer
      ),
      ...this.findAllFunctions(
        buffer
      )
    ];
  }

  static findAllClasses(
    buffer
  ) {
    return this.findAllByPattern(
      buffer,
      /(?:export\s+default\s+)?class\s+([A-Za-z_$][A-Za-z0-9_$]*)/
    ).map(symbol => ({
      type: "class",
      ...symbol
    }));
  }

  static findAllFunctions(
    buffer
  ) {
    return this.findAllByPattern(
      buffer,
      /(?:static\s+|async\s+)?([A-Za-z_$][A-Za-z0-9_$]*)\s*\(|([A-Za-z_$][A-Za-z0-9_$]*)\s*=\s*(?:async\s*)?\(/
    ).map(symbol => ({
      type: "function",
      ...symbol
    }));
  }

  static findClass(
    buffer,
    className
  ) {
    return (
      this.findAllClasses(
        buffer
      ).find(
        symbol =>
          symbol.name ===
          className
      ) || null
    );
  }

  static findFunction(
    buffer,
    functionName
  ) {
    return (
      this.findAllFunctions(
        buffer
      ).find(
        symbol =>
          symbol.name ===
          functionName
      ) || null
    );
  }

  static findAllByPattern(
    buffer,
    pattern
  ) {
    const lines =
      String(buffer || "")
        .split("\n");

    const results = [];

    for (
      let i = 0;
      i < lines.length;
      i++
    ) {
      pattern.lastIndex = 0;

      const match =
        pattern.exec(
          lines[i]
        );

      if (!match) {
        continue;
      }

      const block =
        this.extractBlock(
          lines,
          i
        );

      results.push({
        name:
          match[1] ||
          match[2],
        ...block
      });
    }

    return results;
  }

  static extractBlock(
    lines,
    startIndex
  ) {
    let braceDepth = 0;
    let started = false;
    let endIndex =
      startIndex;

    for (
      let i = startIndex;
      i < lines.length;
      i++
    ) {
      const line =
        lines[i];

      for (const ch of line) {
        if (ch === "{") {
          braceDepth++;
          started = true;
        }

        if (ch === "}") {
          braceDepth--;
        }
      }

      endIndex = i;

      if (
        started &&
        braceDepth === 0
      ) {
        break;
      }
    }

    return {
      startLine:
        startIndex + 1,

      endLine:
        endIndex + 1,

      content:
        lines
          .slice(
            startIndex,
            endIndex + 1
          )
          .join("\n")
    };
  }
}