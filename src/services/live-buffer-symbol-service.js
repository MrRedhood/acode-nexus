export default class LiveBufferSymbolService {
  static findClass(
    buffer,
    className
  ) {
    return this.findPattern(
      buffer,
      new RegExp(
        `export\\s+default\\s+class\\s+${className}\\b|class\\s+${className}\\b`
      )
    );
  }

  static findFunction(
    buffer,
    functionName
  ) {
    return this.findPattern(
      buffer,
      new RegExp(
        `static\\s+${functionName}\\s*\\(|${functionName}\\s*\\(`
      )
    );
  }

  static findPattern(
    buffer,
    pattern
  ) {
    const lines =
      String(buffer || "")
        .split("\n");

    for (
      let i = 0;
      i < lines.length;
      i++
    ) {
      if (
        pattern.test(
          lines[i]
        )
      ) {
        return this.extractBlock(
          lines,
          i
        );
      }
    }

    return null;
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