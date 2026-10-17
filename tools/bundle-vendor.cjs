// Optional developer step; the compiled, MIT-licensed bundle is already committed.
// npm install --prefix /tmp/closed365-qa esbuild
const path = require("path"),
  root = path.resolve(__dirname, "..");
let esbuild;
try {
  esbuild = require("esbuild");
} catch {
  esbuild = require("/tmp/closed365-qa/node_modules/esbuild");
}
esbuild.buildSync({
  entryPoints: [path.join(root, "src/vendor/addons/entry.js")],
  outfile: path.join(root, "src/vendor/room-tools.min.js"),
  bundle: true,
  minify: true,
  format: "iife",
  globalName: "ROOM_TOOLS",
  alias: { three: path.join(root, "src/vendor/addons/three-global.js") },
  legalComments: "inline",
});
