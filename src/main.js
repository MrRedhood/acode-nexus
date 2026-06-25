import Nexus from "./core/nexus.js";

const PLUGIN_ID = "com.mrredhood.acode.nexus";
let nexus = null;

function init(baseUrl, page, options) {
  console.log("NEXUS INIT START");
  console.log("baseUrl:", baseUrl);
  console.log("page:", page);
  console.log("options:", options);

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