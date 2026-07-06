export default class DiffService {
  static build(
    originalText,
    modifiedText
  ) {
    const diff =
      this.buildRawDiff(
        originalText,
        modifiedText
      );

    return this.collapseContext(
      diff
    );
  }

  static buildRawDiff(
    originalText,
    modifiedText
  ) {
    const oldLines =
      String(originalText || "")
        .split("\n");

    const newLines =
      String(modifiedText || "")
        .split("\n");

    const maxLines =
      Math.max(
        oldLines.length,
        newLines.length
      );

    const diff = [];

    let oldLineNumber = 1;
    let newLineNumber = 1;

    for (
      let i = 0;
      i < maxLines;
      i++
    ) {
      const oldLine =
        oldLines[i];

      const newLine =
        newLines[i];

      if (
        oldLine === newLine
      ) {
        diff.push({
          type: "context",

          oldLine:
            oldLine !== undefined
              ? oldLineNumber
              : null,

          newLine:
            newLine !== undefined
              ? newLineNumber
              : null,

          text:
            oldLine ?? ""
        });

        if (
          oldLine !== undefined
        ) {
          oldLineNumber++;
        }

        if (
          newLine !== undefined
        ) {
          newLineNumber++;
        }

        continue;
      }

      if (
        oldLine !== undefined
      ) {
        diff.push({
          type: "remove",

          oldLine:
            oldLineNumber,

          newLine: null,

          text: oldLine
        });

        oldLineNumber++;
      }

      if (
        newLine !== undefined
      ) {
        diff.push({
          type: "add",

          oldLine: null,

          newLine:
            newLineNumber,

          text: newLine
        });

        newLineNumber++;
      }
    }

    return diff;
  }

  static collapseContext(
    diff
  ) {
    const CONTEXT = 3;

    const changed =
      diff
        .map(
          (row, index) =>
            row.type !==
            "context"
              ? index
              : -1
        )
        .filter(
          index => index >= 0
        );

    if (
      changed.length === 0
    ) {
      return diff;
    }

    const visible =
      new Set();

    changed.forEach(index => {
      for (
        let i =
          index - CONTEXT;
        i <=
        index + CONTEXT;
        i++
      ) {
        if (
          i >= 0 &&
          i < diff.length
        ) {
          visible.add(i);
        }
      }
    });

    const result = [];

    let previous =
      -1000;

    for (
      let i = 0;
      i < diff.length;
      i++
    ) {
      if (
        !visible.has(i)
      ) {
        continue;
      }

      if (
        i - previous >
        1
      ) {
        const hidden =
          i -
          previous -
          1;

        if (
          hidden > 0
        ) {
          result.push({
            type:
              "collapsed",

            hiddenLines:
              hidden
          });
        }
      }

      result.push(diff[i]);

      previous = i;
    }

    if (
      previous <
      diff.length - 1
    ) {
      result.push({
        type:
          "collapsed",

        hiddenLines:
          diff.length -
          previous -
          1
      });
    }

    return result;
  }
}