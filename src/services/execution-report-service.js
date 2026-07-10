export default class ExecutionReportService {
  static create(
    metadata = {}
  ) {
    return {
      success: true,

      startedAt:
        metadata.startedAt ||
        Date.now(),

      finishedAt:
        null,

      duration: 0,

      strategy:
        metadata.strategy ||
        null,

      scope:
        metadata.scope ||
        null,

      risk:
        metadata.risk ||
        null,

      rollback: false,

      filesChanged: [],

      symbolsChanged: [],

      actions: [],

      previews: [],

      diagnostics: [],

      warnings: [],

      errors: [],

      result: null
    };
  }

  static finish(
    report,
    success = true
  ) {
    report.success =
      success;

    report.finishedAt =
      Date.now();

    report.duration =
      report.finishedAt -
      report.startedAt;

    return report;
  }

  static addAction(
    report,
    action
  ) {
    if (action) {
      report.actions.push(
        action
      );
    }
  }

  static addFile(
    report,
    file
  ) {
    if (
      file &&
      !report.filesChanged.includes(
        file
      )
    ) {
      report.filesChanged.push(
        file
      );
    }
  }

  static addSymbol(
    report,
    symbol
  ) {
    if (
      symbol &&
      !report.symbolsChanged.includes(
        symbol
      )
    ) {
      report.symbolsChanged.push(
        symbol
      );
    }
  }

  static addPreview(
    report,
    preview
  ) {
    if (preview) {
      report.previews.push(
        preview
      );
    }
  }

  static addDiagnostic(
    report,
    diagnostic
  ) {
    if (diagnostic) {
      report.diagnostics.push(
        diagnostic
      );
    }
  }

  static addWarning(
    report,
    warning
  ) {
    if (warning) {
      report.warnings.push(
        warning
      );
    }
  }

  static addError(
    report,
    error
  ) {
    if (!error) {
      return;
    }

    report.success =
      false;

    report.errors.push(
      error
    );
  }

  static setRollback(
    report,
    rollback = true
  ) {
    report.rollback =
      rollback;
  }

  static setResult(
    report,
    result
  ) {
    report.result =
      result;
  }

  static merge(
    report,
    other
  ) {
    if (!other) {
      return report;
    }

    report.success =
      report.success &&
      other.success;

    report.rollback =
      report.rollback ||
      other.rollback;

    for (const file of other.filesChanged ||
      []) {
      this.addFile(
        report,
        file
      );
    }

    for (const symbol of other.symbolsChanged ||
      []) {
      this.addSymbol(
        report,
        symbol
      );
    }

    report.actions.push(
      ...(other.actions ||
        [])
    );

    report.previews.push(
      ...(other.previews ||
        [])
    );

    report.diagnostics.push(
      ...(other.diagnostics ||
        [])
    );

    report.warnings.push(
      ...(other.warnings ||
        [])
    );

    report.errors.push(
      ...(other.errors ||
        [])
    );

    if (
      other.result !==
      undefined
    ) {
      report.result =
        other.result;
    }

    return report;
  }

  static summarize(
    report
  ) {
    return {
      success:
        report.success,

      duration:
        report.duration,

      files:
        report.filesChanged.length,

      symbols:
        report.symbolsChanged.length,

      actions:
        report.actions.length,

      warnings:
        report.warnings.length,

      errors:
        report.errors.length,

      rollback:
        report.rollback
    };
  }
}