const esbuild = require("esbuild");
const path = require("path");

const isWatch = process.argv.includes("--watch");

const config = {
  entryPoints: ["core/lib/catex/entry.tsx"],
  bundle: true,
  outdir: "dist",
  format: "iife",
  globalName: "CatexExtensions",
  jsx: "automatic",
  alias: {
    "@": path.resolve(__dirname),
  },
  loader: {
    ".woff": "dataurl",
    ".woff2": "dataurl",
    ".ttf": "dataurl",
    ".eot": "dataurl",
    ".svg": "dataurl",
  },
};

if (isWatch) {
  esbuild.context(config).then((ctx) => {
    ctx.watch();
    console.log("[catex] watching...");
  });
} else {
  esbuild.build(config).then(() => {
    console.log("[catex] build done");
  });
}