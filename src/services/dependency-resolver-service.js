import DependencyIndexService from "./dependency-index-service.js";

export default class DependencyResolverService {
  static resolve(symbolName) {
    if (!symbolName) {
      return null;
    }

    const owner =
      DependencyIndexService.findFunction(
        symbolName
      ) ||
      DependencyIndexService.findClass(
        symbolName
      ) ||
      DependencyIndexService.findExport(
        symbolName
      );

    if (!owner) {
      return null;
    }

    const importers =
      DependencyIndexService.findImporters(
        owner.file
      ) || [];

    const imports =
      owner.imports || [];

    const exports =
      owner.exports || [];

    const functions =
      owner.functions || [];

    const classes =
      owner.classes || [];

    return {
      symbol: {
        name: symbolName,
        file: owner.file,
        path: owner.path
      },

      owner,

      imports,

      importers,

      exports,

      functions,

      classes,

      summary: this.buildSummary({
        owner,
        imports,
        importers,
        exports,
        functions,
        classes
      })
    };
  }

  static buildSummary({
    owner,
    imports,
    importers,
    exports,
    functions,
    classes
  }) {
    const lines = [];

    lines.push(
      `OWNER: ${owner.file}`
    );

    if (exports.length) {
      lines.push("");
      lines.push("EXPORTS:");

      for (const item of exports) {
        lines.push(
          `- ${item}`
        );
      }
    }

    if (classes.length) {
      lines.push("");
      lines.push("CLASSES:");

      for (const item of classes) {
        lines.push(
          `- ${item}`
        );
      }
    }

    if (functions.length) {
      lines.push("");
      lines.push("FUNCTIONS:");

      for (const item of functions) {
        lines.push(
          `- ${item}`
        );
      }
    }

    if (imports.length) {
      lines.push("");
      lines.push("IMPORTS:");

      for (const item of imports) {
        lines.push(
          `- ${item.statement} → ${item.source}`
        );
      }
    }

    if (importers.length) {
      lines.push("");
      lines.push("IMPORTED BY:");

      for (const item of importers) {
        lines.push(
          `- ${item.file}`
        );
      }
    }

    return lines.join("\n");
  }
}