#!/usr/bin/env node
const { spawn } = require("child_process");
const path = require("path");
const patch = path.join(__dirname, "patch-expo-externals.js");
try {
  require(patch);
} catch (e) {
  // continue even if patching fails
}

const args = process.argv.slice(2);
const cmd = process.platform === "win32" ? "npx.cmd" : "npx";
const child = spawn(cmd, ["expo", "start", ...args], { stdio: "inherit" });
child.on("exit", function (code) {
  process.exit(code);
});
