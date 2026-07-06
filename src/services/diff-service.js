import LCSService from "./diff/lcs-service.js";
import CharDiffService from "./diff/char-diff-service.js";
import ContextService from "./diff/context-service.js";

export default class DiffService {
  static build(
    originalText,
    modifiedText
  ) {
    let diff =
      LCSService.build(
        originalText,
        modifiedText
      );

    diff =
      CharDiffService.highlight(
        diff
      );

    diff =
      ContextService.collapse(
        diff
      );

    return diff;
  }
}