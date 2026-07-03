export default class DebugService {
  static hooks = new Map();

  static resolvePath(path) {
    if (!path) {
      return null;
    }

    try {
      const parts =
        path.split(".");

      let current = window;

      for (const part of parts) {
        if (
          current == null
        ) {
          return null;
        }

        current =
          current[part];
      }

      return current;
    } catch (error) {
      console.error(error);
      return null;
    }
  }

  static probe(
    objectPath,
    keyword = ""
  ) {
    const target =
      this.resolvePath(
        objectPath
      );

    if (!target) {
      return `Object not found: ${objectPath}`;
    }

    const lower =
      keyword.toLowerCase();

    const results =
      new Set();

    const scan = (
      obj,
      prefix,
      depth = 0
    ) => {
      if (
        !obj ||
        depth > 2
      ) {
        return;
      }

      try {
        Object.keys(obj)
          .forEach(key => {
            const fullPath =
              prefix
                ? `${prefix}.${key}`
                : key;

            if (
              !keyword ||
              key
                .toLowerCase()
                .includes(lower)
            ) {
              results.add(
                fullPath
              );
            }

            const value =
              obj[key];

            if (
              value &&
              typeof value ===
                "object"
            ) {
              scan(
                value,
                fullPath,
                depth + 1
              );
            }
          });
      } catch {}
    };

    scan(
      target,
      objectPath
    );

    if (!results.size) {
      return "No matches found.";
    }

    return Array.from(
      results
    )
      .slice(0, 100)
      .join("\n");
  }

  static tap(
    objectPath,
    methodName
  ) {
    const target =
      this.resolvePath(
        objectPath
      );

    if (!target) {
      return {
        success: false,
        error:
          "Object not found"
      };
    }

    const method =
      target[methodName];

    if (
      typeof method !==
      "function"
    ) {
      return {
        success: false,
        error:
          "Method not found"
      };
    }

    const hookKey =
      `${objectPath}.${methodName}`;

    if (
      this.hooks.has(
        hookKey
      )
    ) {
      return {
        success: false,
        error:
          "Already hooked"
      };
    }

    this.hooks.set(
      hookKey,
      method
    );

    target[methodName] =
      function (...args) {
        console.log(
          `[TAP] ${hookKey}`,
          args
        );

        debugger;

        return method.apply(
          this,
          args
        );
      };

    return {
      success: true
    };
  }

  static untap() {
    for (const [
      key,
      original
    ] of this.hooks) {
      const parts =
        key.split(".");

      const methodName =
        parts.pop();

      const objectPath =
        parts.join(".");

      const target =
        this.resolvePath(
          objectPath
        );

      if (
        target &&
        methodName
      ) {
        target[
          methodName
        ] = original;
      }
    }

    const count =
      this.hooks.size;

    this.hooks.clear();

    return count;
  }
}