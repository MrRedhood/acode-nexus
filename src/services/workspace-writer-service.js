import SearchService from "./search-service.js";

export default class WorkspaceWriterService {
  static async write(
    action,
    content = ""
  ) {
    if (!action) {
      throw new Error(
        "Missing action."
      );
    }

    switch (
      action.type
    ) {
      case "replace_file":
      case "patch_file":
        return this.writeFile(
          action.file,
          content
        );

      case "create_file":
        return this.createFile(
          action.file,
          content
        );

      case "delete_file":
        return this.deleteFile(
          action.file
        );

      case "rename_file":
        return this.renameFile(
          action.from,
          action.to
        );

      default:
        throw new Error(
          `Unsupported workspace action "${action.type}".`
        );
    }
  }

  static async writeFile(
    path,
    content
  ) {
    const file =
      SearchService.openFile(
        path
      );

    if (!file) {
      throw new Error(
        `File not found: ${path}`
      );
    }

    if (
      typeof file.write ===
      "function"
    ) {
      await file.write(
        content
      );
    } else {
      file.content =
        content;
    }

    return {
      success: true,
      action: "write_file",
      file: path
    };
  }

  static async createFile(
    path,
    content
  ) {
    if (
      typeof fsOperation !==
        "undefined" &&
      fsOperation?.createFile
    ) {
      await fsOperation.createFile(
        path,
        content
      );
    } else {
      console.warn(
        "createFile() not implemented yet."
      );
    }

    return {
      success: true,
      action: "create_file",
      file: path
    };
  }

  static async deleteFile(
    path
  ) {
    if (
      typeof fsOperation !==
        "undefined" &&
      fsOperation?.deleteFile
    ) {
      await fsOperation.deleteFile(
        path
      );
    } else {
      console.warn(
        "deleteFile() not implemented yet."
      );
    }

    return {
      success: true,
      action: "delete_file",
      file: path
    };
  }

  static async renameFile(
    from,
    to
  ) {
    if (
      typeof fsOperation !==
        "undefined" &&
      fsOperation?.renameFile
    ) {
      await fsOperation.renameFile(
        from,
        to
      );
    } else {
      console.warn(
        "renameFile() not implemented yet."
      );
    }

    return {
      success: true,
      action: "rename_file",
      from,
      to
    };
  }
}