export default class EditMessageParser {
  static extractLiveBuffer(
    messages
  ) {
    if (!messages?.length) {
      return null;
    }

    for (
      let i = messages.length - 1;
      i >= 0;
      i--
    ) {
      const msg =
        messages[i];

      if (
        msg.role !== "user" ||
        !msg.content
      ) {
        continue;
      }

      const text =
        msg.content;

      if (
        !(
          text.includes(
            "LIVE EDITOR BUFFER"
          ) ||
          text.includes(
            "ACTIVE FILE"
          ) ||
          text.includes(
            "LIVE EDITOR FILE"
          )
        )
      ) {
        continue;
      }

      const fenced =
        text.match(
          /```(?:[\w-]+)?\n([\s\S]*?)```/
        );

      if (
        fenced &&
        fenced[1]
      ) {
        return fenced[1].trim();
      }

      return text.trim();
    }

    return null;
  }

  static extractUserRequest(
    messages
  ) {
    if (!messages?.length) {
      return "";
    }

    for (
      let i = messages.length - 1;
      i >= 0;
      i--
    ) {
      const msg =
        messages[i];

      if (
        msg.role === "user" &&
        msg.content
      ) {
        return msg.content;
      }
    }

    return "";
  }

  static cleanUserRequest(
    text
  ) {
    if (!text) {
      return "";
    }

    const markers = [
      "ACTIVE FILE (LIVE EDITOR BUFFER)",
      "LIVE EDITOR FILE",
      "ACTIVE FILE"
    ];

    let cleaned =
      text;

    for (const marker of markers) {
      const index =
        cleaned.indexOf(
          marker
        );

      if (
        index !== -1
      ) {
        cleaned =
          cleaned.slice(
            0,
            index
          );
      }
    }

    return cleaned.trim();
  }
}