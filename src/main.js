import Nexus from "./core/nexus.js";
import IndexingService from "./services/indexing-service.js";
import WorkspaceSummaryService from "./services/workspace-summary-service.js";

window.IndexingService =
  IndexingService;

window.WorkspaceSummaryService =
  WorkspaceSummaryService;

const PLUGIN_ID =
  "com.mrredhood.acode.nexus";

let nexus = null;

console.log(
  "TOP LEVEL ACODE:",
  acode
);

console.log(
  "TOP LEVEL ACODE KEYS:",
  Object.keys(acode)
);

console.log(
  "HAS setPluginInit:",
  typeof acode.setPluginInit
);

console.log(
  "HAS fileBrowser:",
  typeof acode.fileBrowser
);

console.log(
  "HAS require:",
  typeof acode.require
);

async function init(
  baseUrl,
  page,
  options
) {
  console.log(
    "NEXUS INIT START"
  );

  console.log(
    "baseUrl:",
    baseUrl
  );

  console.log(
    "page:",
    page
  );

  console.log(
    "options:",
    options
  );

  console.log(
    "INIT ACODE:",
    acode
  );

  console.log(
    "INIT ACODE KEYS:",
    Object.keys(acode)
  );

  console.log(
    "INIT fileBrowser:",
    typeof acode.fileBrowser
  );

  try {
    nexus =
      new Nexus(
        baseUrl,
        page,
        options
      );

    await nexus.init();

    const index =
      await IndexingService.buildIndex();

    if (!index) {
      console.error(
        "[INDEX FAILED]"
      );
      return;
    }

    try {
      const summary =
        WorkspaceSummaryService.buildSummary();

      console.log(
        "[SUMMARY BUILT]",
        summary
      );
    } catch (error) {
      console.error(
        "[SUMMARY BUILD FAILED]",
        error
      );
    }

    console.log(
      "NEXUS INIT DONE"
    );
  } catch (err) {
    console.error(
      "NEXUS INIT ERROR:",
      err
    );
  }
}

function destroy() {
  console.log(
    "NEXUS DESTROY"
  );

  if (nexus) {
    nexus.destroy();
    nexus = null;
  }
}

acode.setPluginInit(
  PLUGIN_ID,
  init
);

acode.setPluginUnmount(
  PLUGIN_ID,
  destroy
);