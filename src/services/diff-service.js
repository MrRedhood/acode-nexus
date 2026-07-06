export default class DiffService {
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
}