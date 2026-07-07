export default class PatchSetService {
  static build(actions = []) {
    const validActions =
      this.validate(actions);

    return this.groupByFile(
      validActions
    );
  }

  static validate(
    actions = []
  ) {
    return actions.filter(
      action =>
        action &&
        typeof action ===
          "object" &&
        action.type &&
        (
          action.file ||
          action.from
        )
    );
  }

  static groupByFile(
    actions = []
  ) {
    const files =
      new Map();

    for (const action of actions) {
      const key =
        action.file ||
        action.from;

      if (
        !files.has(key)
      ) {
        files.set(key, {
          file: key,
          actions: []
        });
      }

      files
        .get(key)
        .actions.push(
          action
        );
    }

    return Array.from(
      files.values()
    );
  }

  static getFiles(
    patchSet = []
  ) {
    return patchSet.map(
      item => item.file
    );
  }

  static getActionsForFile(
    patchSet,
    file
  ) {
    const match =
      patchSet.find(
        item =>
          item.file === file
      );

    return match
      ? match.actions
      : [];
  }

  static totalActions(
    patchSet = []
  ) {
    let total = 0;

    for (const file of patchSet) {
      total +=
        file.actions.length;
    }

    return total;
  }

  static isEmpty(
    patchSet = []
  ) {
    return (
      patchSet.length === 0
    );
  }

  static debug(
    patchSet = []
  ) {
    console.group(
      "Patch Set"
    );

    console.log(
      "Files:",
      patchSet.length
    );

    console.log(
      "Actions:",
      this.totalActions(
        patchSet
      )
    );

    for (const file of patchSet) {
      console.group(
        file.file
      );

      console.log(
        file.actions
      );

      console.groupEnd();
    }

    console.groupEnd();
  }
}