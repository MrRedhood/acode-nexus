import Nexus from "./core/nexus.js";

const PLUGIN_ID =
  "com.mrredhood.acode.nexus";

let nexus = null;

async function loadPdfJs() {
  if (window.pdfjsLib) {
    return;
  }

  const script =
    document.createElement("script");

  script.src =
    "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.4.168/pdf.min.js";

  document.head.appendChild(script);

  await new Promise(
    (resolve, reject) => {
      script.onload = resolve;
      script.onerror = reject;
    }
  );

  window.pdfjsLib.GlobalWorkerOptions.workerSrc =
    "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.4.168/pdf.worker.min.js";
}

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

  console.log("page:", page);

  console.log(
    "options:",
    options
  );

  try {
    await loadPdfJs();

    nexus = new Nexus(
      baseUrl,
      page,
      options
    );

    await nexus.init();

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