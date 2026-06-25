import esbuild from "esbuild";

await esbuild.build({
  entryPoints: ["src/main.js"],
  bundle: true,
  outfile: "dist/main.js",
  format: "esm",
  sourcemap: true,
  minify: false
});

console.log("Build complete");