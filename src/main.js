import Nexus from "./core/nexus.js";
import IndexingService from "./services/indexing-service.js";

const PLUGIN_ID = "com.mrredhood.acode.nexus";
let nexus = null;

console.log("TOP LEVEL ACODE:", acode);
console.log("TOP LEVEL ACODE KEYS:", Object.keys(acode));
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

function init(baseUrl, page, options) {
  console.log("NEXUS INIT START");
  console.log("baseUrl:", baseUrl);
  console.log("page:", page);
  console.log("options:", options);

  console.log("INIT ACODE:", acode);
  console.log("INIT ACODE KEYS:", Object.keys(acode));
  console.log(
    "INIT fileBrowser:",
    typeof acode.fileBrowser
  );

  try {
    nexus = new Nexus(baseUrl, page, options);
    nexus.init();
    console.log("NEXUS INIT DONE");
  } catch (err) {
    console.error("NEXUS INIT ERROR:", err);
  }
}

function destroy() {
  console.log("NEXUS DESTROY");

  if (nexus) {
    nexus.destroy();
    nexus = null;
  }
}

acode.setPluginInit(PLUGIN_ID, init);
acode.setPluginUnmount(PLUGIN_ID, destroy);