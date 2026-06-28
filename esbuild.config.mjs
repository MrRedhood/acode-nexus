import esbuild from "esbuild";

await esbuild.build({
  entryPoints: ["src/main.js"],
  bundle: true,
  outfile: "dist/main.js",
  format: "esm",
  sourcemap: true,
  minify: false,
  target: "es2020"
});

console.log("Build complete");