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

    this.highlightChanges(
      diff
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
          text: oldLine,
          html: null
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
          text: newLine,
          html: null
        });

        newLineNumber++;
      }
    }

    return diff;
  }

  static escapeHtml(text) {
    return String(text || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }

  static highlightChanges(
    diff
  ) {
    for (
      let i = 0;
      i <
      diff.length - 1;
      i++
    ) {
      const remove =
        diff[i];

      const add =
        diff[i + 1];

      if (
        remove.type !==
          "remove" ||
        add.type !== "add"
      ) {
        continue;
      }

      const oldText =
        remove.text;

      const newText =
        add.text;

      let prefix = 0;

      while (
        prefix <
          oldText.length &&
        prefix <
          newText.length &&
        oldText[prefix] ===
          newText[prefix]
      ) {
        prefix++;
      }

      let suffix = 0;

      while (
        suffix <
          oldText.length -
            prefix &&
        suffix <
          newText.length -
            prefix &&
        oldText[
          oldText.length -
            1 -
            suffix
        ] ===
          newText[
            newText.length -
              1 -
              suffix
          ]
      ) {
        suffix++;
      }

      const oldMiddle =
        oldText.slice(
          prefix,
          oldText.length -
            suffix
        );

      const newMiddle =
        newText.slice(
          prefix,
          newText.length -
            suffix
        );

      remove.html =
        this.escapeHtml(
          oldText.slice(
            0,
            prefix
          )
        ) +
        `<span class="nexus-diff-char-remove">` +
        this.escapeHtml(
          oldMiddle
        ) +
        `</span>` +
        this.escapeHtml(
          oldText.slice(
            oldText.length -
              suffix
          )
        );

      add.html =
        this.escapeHtml(
          newText.slice(
            0,
            prefix
          )
        ) +
        `<span class="nexus-diff-char-add">` +
        this.escapeHtml(
          newMiddle
        ) +
        `</span>` +
        this.escapeHtml(
          newText.slice(
            newText.length -
              suffix
          )
        );
    }
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
          index =>
            index >= 0
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
          index -
          CONTEXT;
        i <=
        index +
          CONTEXT;
        i++
      ) {
        if (
          i >= 0 &&
          i <
            diff.length
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
      i <
      diff.length;
      i++
    ) {
      if (
        !visible.has(i)
      ) {
        continue;
      }

      if (
        i -
          previous >
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