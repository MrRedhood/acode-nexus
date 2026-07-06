// LCS TEST
export default class LCSService {
  static build(
    originalText,
    modifiedText
  ) {
    const oldLines =
      String(originalText || "")
        .split("\n");

    const newLines =
      String(modifiedText || "")
        .split("\n");

    const matrix =
      this.buildMatrix(
        oldLines,
        newLines
      );

    return this.backtrack(
      matrix,
      oldLines,
      newLines
    );
  }

  static buildMatrix(
    oldLines,
    newLines
  ) {
    const rows =
      oldLines.length + 1;

    const cols =
      newLines.length + 1;

    const matrix =
      Array.from(
        {
          length: rows
        },
        () =>
          new Array(cols).fill(0)
      );

    for (
      let i =
        oldLines.length - 1;
      i >= 0;
      i--
    ) {
      for (
        let j =
          newLines.length - 1;
        j >= 0;
        j--
      ) {
        if (
          oldLines[i] ===
          newLines[j]
        ) {
          matrix[i][j] =
            matrix[i + 1][
              j + 1
            ] + 1;
        } else {
          matrix[i][j] =
            Math.max(
              matrix[i + 1][j],
              matrix[i][j + 1]
            );
        }
      }
    }

    return matrix;
  }

  static backtrack(
    matrix,
    oldLines,
    newLines
  ) {
    const diff = [];

    let i = 0;
    let j = 0;

    let oldLine = 1;
    let newLine = 1;

    while (
      i < oldLines.length &&
      j < newLines.length
    ) {
      if (
        oldLines[i] ===
        newLines[j]
      ) {
        diff.push({
          type:
            "context",

          oldLine,

          newLine,

          text:
            oldLines[i]
        });

        i++;
        j++;

        oldLine++;
        newLine++;

        continue;
      }

      if (
        matrix[i + 1][j] >=
        matrix[i][j + 1]
      ) {
        diff.push({
          type:
            "remove",

          oldLine,

          newLine:
            null,

          text:
            oldLines[i],

          html: null
        });

        i++;
        oldLine++;
      } else {
        diff.push({
          type:
            "add",

          oldLine:
            null,

          newLine,

          text:
            newLines[j],

          html: null
        });

        j++;
        newLine++;
      }
    }

    while (
      i < oldLines.length
    ) {
      diff.push({
        type:
          "remove",

        oldLine,

        newLine:
          null,

        text:
          oldLines[i],

        html: null
      });

      i++;
      oldLine++;
    }

    while (
      j < newLines.length
    ) {
      diff.push({
        type:
          "add",

        oldLine:
          null,

        newLine,

        text:
          newLines[j],

        html: null
      });

      j++;
      newLine++;
    }

    return diff;
  }
}