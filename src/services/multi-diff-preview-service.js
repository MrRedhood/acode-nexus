import DiffPreviewService from "./diff-preview-service.js";

export default class MultiDiffPreviewService {
  static async preview(
    patchSet = []
  ) {
    if (
      !patchSet.length
    ) {
      return false;
    }

    for (const fileSet of patchSet) {
      for (const action of fileSet.actions) {
        let approved =
          false;

        switch (
          action.type
        ) {
          case "patch_file":
            approved =
              await DiffPreviewService.previewPatch(
                action
              );
            break;

          case "replace_file":
            approved =
              await DiffPreviewService.previewReplace(
                action
              );
            break;

          default:
            approved =
              true;
        }

        if (
          !approved
        ) {
          return false;
        }
      }
    }

    return true;
  }

  static async previewFile(
    fileSet
  ) {
    if (
      !fileSet
    ) {
      return false;
    }

    return await this.preview([
      fileSet
    ]);
  }

  static countFiles(
    patchSet = []
  ) {
    return patchSet.length;
  }

  static countActions(
    patchSet = []
  ) {
    let count = 0;

    for (const fileSet of patchSet) {
      count +=
        fileSet.actions.length;
    }

    return count;
  }

  static summary(
    patchSet = []
  ) {
    return {
      files:
        this.countFiles(
          patchSet
        ),
      actions:
        this.countActions(
          patchSet
        )
    };
  }
}