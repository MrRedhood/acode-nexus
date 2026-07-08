export default class ClipboardHelper {
  static showToast(
    chat,
    text
  ) {
    const old =
      document.querySelector(
        ".nexus-copy-toast"
      );

    if (old) {
      old.remove();
    }

    const toast =
      document.createElement(
        "div"
      );

    toast.className =
      "nexus-copy-toast";

    toast.textContent =
      text;

    document.body.appendChild(
      toast
    );

    setTimeout(
      () => toast.remove(),
      1500
    );
  }

  static copyText(
    chat,
    content
  ) {
    if (!content) {
      this.showToast(
        chat,
        "Nothing to copy"
      );
      return;
    }

    const fallbackCopy =
      () => {
        try {
          const textarea =
            document.createElement(
              "textarea"
            );

          textarea.value =
            content;

          textarea.style.position =
            "fixed";

          textarea.style.left =
            "-9999px";

          textarea.style.top =
            "0";

          document.body.appendChild(
            textarea
          );

          textarea.focus();
          textarea.select();

          const success =
            document.execCommand(
              "copy"
            );

          document.body.removeChild(
            textarea
          );

          if (success) {
            this.showToast(
              chat,
              "Copied!"
            );
          } else {
            this.showToast(
              chat,
              "Copy failed"
            );
          }
        } catch (error) {
          console.error(
            "Copy fallback failed:",
            error
          );

          this.showToast(
            chat,
            "Copy failed"
          );
        }
      };

    if (
      navigator.clipboard &&
      navigator.clipboard.writeText
    ) {
      navigator.clipboard
        .writeText(content)
        .then(() => {
          this.showToast(
            chat,
            "Copied!"
          );
        })
        .catch(() => {
          fallbackCopy();
        });
    } else {
      fallbackCopy();
    }
  }

  static attachCodeCopyListeners(
    chat,
    msgNode
  ) {
    const buttons =
      msgNode.querySelectorAll(
        ".nexus-code-copy"
      );

    buttons.forEach(
      button => {
        button.addEventListener(
          "click",
          e => {
            e.stopPropagation();

            const wrapper =
              button.closest(
                ".nexus-code-block"
              );

            if (!wrapper) {
              return;
            }

            const textarea =
              wrapper.querySelector(
                ".nexus-hidden-code"
              );

            if (!textarea) {
              return;
            }

            this.copyText(
              chat,
              textarea.value
            );
          }
        );
      }
    );
  }
}