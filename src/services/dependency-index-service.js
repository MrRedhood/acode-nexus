import SearchService from "./search-service.js";
import WorkspaceScopeService from "./workspace-scope-service.js";

export default class DependencyIndexService {
  static index = new Map();

  static async buildIndex() {
    this.index.clear();

    const files =
      WorkspaceScopeService
        .getScopedFiles()
        .filter(file =>
          SearchService.isSearchableFile(file)
        );

    for (const file of files) {
      try {
        const content =
          await SearchService.fetchFileContent(
            file
          );

        if (!content) {
          continue;
        }

        this.indexFile(
          file,
          content
        );
      } catch (error) {
        console.error(
          "Dependency index failed:",
          file.path,
          error
        );
      }
    }

    console.log(
      "Dependency index:",
      this.index.size,
      "files"
    );

    return this.index;
  }

  static indexFile(
    file,
    content
  ) {
    const imports = [];
    const exports = [];
    const classes = [];
    const functions = [];

    const importRegex =
      /import\s+([\s\S]*?)\s+from\s+["'](.+?)["']/g;

    const exportRegex =
      /export\s+(?:default\s+)?(?:class|function|const|let|var)?\s*([A-Za-z_$][A-Za-z0-9_$]*)?/g;

    const classRegex =
      /class\s+([A-Za-z_$][A-Za-z0-9_$]*)/g;

    const functionRegex =
      /(async\s+)?function\s+([A-Za-z_$][A-Za-z0-9_$]*)|static\s+([A-Za-z_$][A-Za-z0-9_$]*)\s*\(|([A-Za-z_$][A-Za-z0-9_$]*)\s*\(/g;

    let match;

    while (
      (match =
        importRegex.exec(
          content
        ))
    ) {
      imports.push({
        statement:
          match[1].trim(),
        source:
          match[2]
      });
    }

    while (
      (match =
        exportRegex.exec(
          content
        ))
    ) {
      exports.push(
        match[1] ||
          "default"
      );
    }

    while (
      (match =
        classRegex.exec(
          content
        ))
    ) {
      classes.push(
        match[1]
      );
    }

    while (
      (match =
        functionRegex.exec(
          content
        ))
    ) {
      const name =
        match[2] ||
        match[3] ||
        match[4];

      if (
        name &&
        !functions.includes(
          name
        )
      ) {
        functions.push(
          name
        );
      }
    }

    this.index.set(
      file.path,
      {
        file:
          file.name,
        path:
          file.path,
        imports,
        exports,
        classes,
        functions
      }
    );
  }

  static getFile(
    path
  ) {
    return (
      this.index.get(path) ||
      null
    );
  }

  static getAll() {
    return Array.from(
      this.index.values()
    );
  }

  static findImporters(
    path
  ) {
    const name =
      path
        .split("/")
        .pop()
        ?.replace(
          /\.[^.]+$/,
          ""
        );

    return this.getAll().filter(
      file =>
        file.imports.some(
          imp =>
            imp.source.includes(
              name
            )
        )
    );
  }

  static findExport(
    symbol
  ) {
    for (const file of this.getAll()) {
      if (
        file.exports.includes(
          symbol
        )
      ) {
        return file;
      }
    }

    return null;
  }

  static findClass(
    name
  ) {
    for (const file of this.getAll()) {
      if (
        file.classes.includes(
          name
        )
      ) {
        return file;
      }
    }

    return null;
  }

  static findFunction(
    name
  ) {
    for (const file of this.getAll()) {
      if (
        file.functions.includes(
          name
        )
      ) {
        return file;
      }
    }

    return null;
  }
}