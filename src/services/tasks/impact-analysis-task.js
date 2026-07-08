export default class ImpactAnalysisTask {
  static async execute(
    task,
    plan,
    context
  ) {
    console.log(
      "ImpactAnalysisTask"
    );

    const target =
      context?.resolvedTarget ||
      context?.target ||
      context?.editContext
        ?.target;

    if (!target) {
      return {
        success: false,
        error:
          "No resolved target."
      };
    }

    const references =
      context.references ||
      [];

    const dependency =
      context.dependency ||
      null;

    const affected =
      new Map();

    const addFile = (
      file,
      reason
    ) => {
      if (!file) {
        return;
      }

      if (
        !affected.has(file)
      ) {
        affected.set(file, {
          file,
          reasons: []
        });
      }

      const item =
        affected.get(file);

      if (
        !item.reasons.includes(
          reason
        )
      ) {
        item.reasons.push(
          reason
        );
      }
    };

    addFile(
      target.path ||
        target.file,
      "Target"
    );

    for (const ref of references) {
      addFile(
        ref.path ||
          ref.file,
        "Reference"
      );
    }

    if (
      dependency?.imports
    ) {
      for (const item of dependency.imports) {
        addFile(
          item.path ||
            item.file,
          "Import"
        );
      }
    }

    if (
      dependency?.importers
    ) {
      for (const item of dependency.importers) {
        addFile(
          item.path ||
            item.file,
          "Importer"
        );
      }
    }

    const affectedFiles =
      Array.from(
        affected.values()
      );

    context.impact = {
      scope:
        affectedFiles.length >
        1
          ? "workspace"
          : "file",

      affectedFiles
    };

    return {
      success: true,

      scope:
        context.impact.scope,

      totalFiles:
        affectedFiles.length,

      affectedFiles
    };
  }
}