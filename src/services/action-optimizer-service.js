export default class ActionOptimizerService {
  static optimize(
    actions = []
  ) {
    if (
      !Array.isArray(
        actions
      ) ||
      !actions.length
    ) {
      return [];
    }

    let optimized =
      this.removeDuplicates(
        actions
      );

    optimized =
      this.mergePatchActions(
        optimized
      );

    optimized =
      this.removeRedundantFocus(
        optimized
      );

    optimized =
      this.sortExecution(
        optimized
      );

    return optimized;
  }

  static removeDuplicates(
    actions
  ) {
    const seen =
      new Set();

    return actions.filter(
      action => {
        const key =
          JSON.stringify(
            action
          );

        if (
          seen.has(key)
        ) {
          return false;
        }

        seen.add(
          key
        );

        return true;
      }
    );
  }

  static mergePatchActions(
    actions
  ) {
    const merged =
      [];

    const byFile =
      new Map();

    for (const action of actions) {
      if (
        action.type !==
          "patch_file" &&
        action.type !==
          "replace_file"
      ) {
        merged.push(
          action
        );

        continue;
      }

      const key =
        action.file;

      if (
        !byFile.has(
          key
        )
      ) {
        byFile.set(
          key,
          []
        );
      }

      byFile
        .get(key)
        .push(action);
    }

    for (const list of byFile.values()) {
      if (
        list.length ===
        1
      ) {
        merged.push(
          list[0]
        );

        continue;
      }

      merged.push(
        ...list
      );
    }

    return merged;
  }

  static removeRedundantFocus(
    actions
  ) {
    const focused =
      new Set();

    return actions.filter(
      action => {
        if (
          action.type !==
          "focus_file"
        ) {
          return true;
        }

        if (
          focused.has(
            action.file
          )
        ) {
          return false;
        }

        focused.add(
          action.file
        );

        return true;
      }
    );
  }

  static sortExecution(
    actions
  ) {
    const priority = {
      open_file: 1,

      focus_file: 2,

      create_file: 3,

      replace_file: 4,

      replace_symbol: 5,

      patch_file: 6,

      rename_file: 7,

      delete_file: 8,

      undo_file: 9
    };

    return actions
      .slice()
      .sort(
        (a, b) =>
          (priority[
            a.type
          ] || 100) -
          (priority[
            b.type
          ] || 100)
      );
  }

  static summarize(
    actions
  ) {
    const summary =
      {};

    for (const action of actions) {
      summary[
        action.type
      ] =
        (summary[
          action.type
        ] || 0) + 1;
    }

    return summary;
  }
}