import Nexus from "./core/nexus.js";

const PLUGIN_ID = "com.mrredhood.acode.nexus";
let nexus = null;

function init(baseUrl, page, options) {
  nexus = new Nexus(baseUrl, page, options);
  nexus.init();
}

function destroy() {
  if (nexus) {
    nexus.destroy();
    nexus = null;
  }
}

acode.setPluginInit(PLUGIN_ID, init);
acode.setPluginUnmount(PLUGIN_ID, destroy);