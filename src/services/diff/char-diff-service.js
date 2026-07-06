export default class CharDiffService {
  static highlight(diff) {
    for (
      let i = 0;
      i < diff.length - 1;
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

      this.highlightPair(
        remove,
        add
      );
    }

    return diff;
  }

  static highlightPair(
    remove,
    add
  ) {
    const oldText =
      remove.text || "";

    const newText =
      add.text || "";

    if (
      !oldText.length &&
      !newText.length
    ) {
      remove.html = "";
      add.html = "";
      return;
    }

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
          suffix -
          1
      ] ===
        newText[
          newText.length -
            suffix -
            1
        ]
    ) {
      suffix++;
    }

    const similarity =
      (prefix + suffix) /
      Math.max(
        oldText.length,
        newText.length,
        1
      );

    if (
      similarity < 0.25
    ) {
      remove.html =
        this.escapeHtml(
          oldText
        );

      add.html =
        this.escapeHtml(
          newText
        );

      return;
    }

    const oldPrefix =
      this.escapeHtml(
        oldText.slice(
          0,
          prefix
        )
      );

    const oldMiddle =
      this.escapeHtml(
        oldText.slice(
          prefix,
          oldText.length -
            suffix
        )
      );

    const oldSuffix =
      this.escapeHtml(
        oldText.slice(
          oldText.length -
            suffix
        )
      );

    remove.html =
      oldPrefix +
      (
        oldMiddle
          ? `<span class="nexus-diff-char-remove">${oldMiddle}</span>`
          : ""
      ) +
      oldSuffix;

    const newPrefix =
      this.escapeHtml(
        newText.slice(
          0,
          prefix
        )
      );

    const newMiddle =
      this.escapeHtml(
        newText.slice(
          prefix,
          newText.length -
            suffix
        )
      );

    const newSuffix =
      this.escapeHtml(
        newText.slice(
          newText.length -
            suffix
        )
      );

    add.html =
      newPrefix +
      (
        newMiddle
          ? `<span class="nexus-diff-char-add">${newMiddle}</span>`
          : ""
      ) +
      newSuffix;
  }

  static escapeHtml(text) {
    return String(text || "")
      .replace(
        /&/g,
        "&amp;"
      )
      .replace(
        /</g,
        "&lt;"
      )
      .replace(
        />/g,
        "&gt;"
      );
  }
}