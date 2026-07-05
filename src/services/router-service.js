export default class RouterService {
  static isEditRequest(messages) {
    if (
      !messages ||
      !messages.length
    ) {
      return false;
    }

    const latest =
      messages[
        messages.length - 1
      ];

    if (
      !latest ||
      latest.role !== "user"
    ) {
      return false;
    }

    const content =
      latest.content || "";

    return (
      content.includes(
        "LIVE EDITOR BUFFER"
      ) ||
      content.includes(
        "LIVE EDITOR FILE"
      ) ||
      content.includes(
        "ACTIVE FILE"
      )
    );
  }
}