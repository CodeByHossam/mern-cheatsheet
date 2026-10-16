// verify.js — consistency checker for this reference site (optional tool, no build step).
//
//   node verify.js
//
// Checks everything the AGENTS.md checklist asks for:
//   * expected file/folder layout (4 content folders + css + js)
//   * HTML escaping inside every <pre><code> block + no double-escapes
//   * <pre>/<h2> tag balance and the closing structure of each page
//   * every internal href/src resolves (file exists + #anchor exists)
//   * s1..s25 (and the s17a/s17b + s18a/s18b sub-anchors) exist exactly once across the pages
//   * the sidebar is IDENTICAL on all 5 pages (modulo ../ prefix) and lists all 25 + sub-links
//   * index.html deep-links every section and every project file
//   * css/js links use the right relative depth on each page
//   * js/main.js parses, css braces balance, no stale references
//
// Exit code 0 = all good, 1 = at least one failure.

const fs = require("fs");
const path = require("path");
const vm = require("vm");

const ROOT = __dirname;
let failures = 0;
const ok = (msg) => console.log("ok   " + msg);
const bad = (msg) => {
  failures++;
  console.log("FAIL " + msg);
};
const read = (rel) => fs.readFileSync(path.join(ROOT, rel), "utf8");
const exists = (rel) => fs.existsSync(path.join(ROOT, rel));

// ── expected layout ─────────────────────────────────────────────
const PAGES = [
  "index.html",
  "backend/backend.html",
  "frontend/frontend.html",
  "devops/devops.html",
  "reference/reference.html",
];
const CSS = "css/styles.css";
const JS = "js/main.js";
const EXTRAS = ["AGENTS.md", "verify.js"];
const FOLDERS = ["backend", "frontend", "devops", "reference", "css", "js"];

let layoutOk = true;
[...PAGES, CSS, JS, ...EXTRAS].forEach((f) => {
  if (!exists(f)) {
    layoutOk = false;
    bad("missing file " + f);
  }
});
FOLDERS.forEach((d) => {
  if (!fs.existsSync(path.join(ROOT, d)) || !fs.statSync(path.join(ROOT, d)).isDirectory()) {
    layoutOk = false;
    bad("missing folder " + d);
  }
});
const actualFolders = fs
  .readdirSync(ROOT, { withFileTypes: true })
  .filter((e) => e.isDirectory() && !e.name.startsWith(".")) // .git and other dotfolders are fine
  .map((e) => e.name)
  .sort();
if (actualFolders.join() !== FOLDERS.slice().sort().join()) {
  layoutOk = false;
  bad("unexpected folders: " + actualFolders.join(", "));
}
if (layoutOk) ok("layout: " + PAGES.length + " pages + " + CSS + " + " + JS + " + " + EXTRAS.join(", "));
if (exists("mern_boilerplate_reference.html")) bad("old single file is back");

// ── per-page structural checks ──────────────────────────────────
const escapeRe = /&(?:[a-zA-Z][a-zA-Z0-9]*|#\d+|#x[0-9a-fA-F]+);/g;

PAGES.forEach((file) => {
  const text = read(file);
  const count = (re) => (text.match(re) || []).length;

  if (count(/<pre>/g) !== count(/<\/pre>/g)) bad(`${file}: <pre> ${count(/<pre>/g)} vs </pre> ${count(/<\/pre>/g)}`);
  if (count(/<h2[\s>]/g) !== count(/<\/h2>/g)) bad(`${file}: <h2> ${count(/<h2[\s>]/g)} vs </h2> ${count(/<\/h2>/g)}`);

  // every <pre><code> body must be fully escaped
  let blocks = 0;
  let rawIssue = 0;
  text.replace(/<pre>\s*<code(?:\s[^>]*)?>([\s\S]*?)<\/code\s*>\s*<\/pre>/g, (_, body) => {
    blocks++;
    const stripped = body.replace(escapeRe, "");
    if (/[<>&]/.test(stripped)) {
      rawIssue++;
      const line = stripped.split("\n").find((l) => /[<>&]/.test(l)) || "";
      bad(`${file}: raw < > & inside a code block: ${JSON.stringify(line.trim().slice(0, 70))}`);
    }
    return _;
  });

  ["&amp;amp;", "&amp;lt;", "&amp;gt;", "&amp;quot;", "&amp;#"].forEach((p) => {
    if (text.includes(p)) bad(`${file}: double-escaped entity ${p}`);
  });

  if (!/<\/main>\s*<script[^>]*><\/script>\s*<\/body>\s*<\/html>\s*$/.test(text))
    bad(`${file}: closing structure (</main> → <script> → </body> → </html>)`);

  const depth = file.includes("/") ? "../" : "";
  if (!text.includes(`href="${depth}${CSS}"`)) bad(`${file}: css link should be ${depth}${CSS}`);
  if (!text.includes(`src="${depth}${JS}"`)) bad(`${file}: js link should be ${depth}${JS}`);

  if (!rawIssue) ok(`${file}: ${blocks} code blocks escaped, tags balanced`);
});

// ── link resolution ─────────────────────────────────────────────
let links = 0;
let deadLinks = 0;
PAGES.forEach((file) => {
  const text = read(file);
  const dir = path.dirname(path.join(ROOT, file));
  const re = /(?:href|src)="([^"]+)"/g;
  let m;
  while ((m = re.exec(text)) !== null) {
    const url = m[1];
    if (/^(https?:|mailto:|#)/.test(url)) continue;
    links++;
    const [filePart, frag] = url.split("#");
    const target = path.resolve(dir, filePart);
    if (!fs.existsSync(target)) {
      deadLinks++;
      bad(`${file}: dead link ${url}`);
      continue;
    }
    if (frag && !fs.readFileSync(target, "utf8").includes(`id="${frag}"`)) {
      deadLinks++;
      bad(`${file}: dead anchor ${url}`);
    }
  }
});
if (!deadLinks) ok(`${links} internal href/src links all resolve (files + anchors)`);

// ── section ids exist exactly once ──────────────────────────────
const owners = {};
PAGES.forEach((file) => {
  const text = read(file);
  text.replace(/<h2 id="(s\d+)">/g, (_, id) => ((owners[id] = owners[id] || []).push(file), _));
  text.replace(/<h3 id="(s\d+[ab])">/g, (_, id) => ((owners[id] = owners[id] || []).push(file), _));
});
let idIssues = 0;
for (let n = 1; n <= 25; n++) {
  const id = "s" + n;
  if (!owners[id] || owners[id].length !== 1) {
    idIssues++;
    bad(`${id} occurs ${owners[id] ? owners[id].length : 0}x`);
  }
}
["s17a", "s17b", "s18a", "s18b"].forEach((id) => {
  if (!owners[id] || owners[id].length !== 1) {
    idIssues++;
    bad(`${id} occurs ${owners[id] ? owners[id].length : 0}x`);
  }
});
if (!idIssues) ok("s1..s25 (+ s17a/s17b/s18a/s18b) each exist exactly once");

// ── sidebar is identical on all pages, lists all 25 ─────────────
const sidebars = {};
PAGES.forEach((file) => {
  const m = read(file).match(/<nav class="sidebar"[^>]*>([\s\S]*?)<\/nav>/);
  if (!m) {
    bad(`${file}: sidebar <nav> not found`);
    return;
  }
  // normalise the relative prefix so root and nested pages compare equal
  sidebars[file] = m[1].replace(/\.\.\//g, "").trim();
});

const navFiles = Object.keys(sidebars);
if (navFiles.length === PAGES.length) {
  const ref = sidebars[navFiles[0]];
  const inconsistent = navFiles.filter((f) => sidebars[f] !== ref);
  if (inconsistent.length) {
    bad("sidebar differs on: " + inconsistent.join(", ") + " — update ALL 5 pages");
  } else {
    const ids = [];
    ref.replace(/#(s\d+[ab]?)(?=\")/g, (_, id) => (ids.push(id), _));
    const top = ids.filter((i) => /^s\d+$/.test(i));
    const missing = [];
    for (let n = 1; n <= 25; n++) if (top.filter((i) => i === "s" + n).length !== 1) missing.push("s" + n);
    const subs = ids.filter((i) => /s\d+[ab]$/.test(i)).sort().join();
    if (missing.length) bad("sidebar missing/duplicated: " + missing.join(", "));
    else if (subs !== "s17a,s17b,s18a,s18b") bad("sidebar sub-links: " + subs);
    else ok("sidebar identical on all 5 pages, lists all 25 + s17a/s17b/s18a/s18b");
  }
}

// ── hub completeness ────────────────────────────────────────────
const hub = read("index.html");
const hubMissing = [];
for (let n = 1; n <= 25; n++) if (!hub.includes(`#s${n}"`)) hubMissing.push("s" + n);
[...PAGES.filter((p) => p !== "index.html"), CSS, JS, ...EXTRAS].forEach((f) => {
  if (!hub.includes(`"${f}"`)) hubMissing.push(f);
});
if (hubMissing.length) bad("index.html missing links to: " + hubMissing.join(", "));
else ok("index.html deep-links all 25 sections + every project file");

// ── shared assets sanity ────────────────────────────────────────
try {
  new vm.Script(read(JS));
  ok(`${JS} parses`);
} catch (e) {
  bad(`${JS} syntax error: ${e.message}`);
}
const css = read(CSS);
if ((css.match(/{/g) || []).length === (css.match(/}/g) || []).length) ok(`${CSS} braces balanced`);
else bad(`${CSS} braces unbalanced`);

["scrollspy endsWith", 'href.indexOf("#") + 1'].forEach((needle, i) => {
  const label = i === 0 ? "scrollspy handles deep links" : "search resolves deep links";
  const src = read(JS);
  const present = i === 0 ? src.includes('endsWith("#" + current)') : src.includes('href.indexOf("#") + 1');
  present ? ok(label) : bad(label + " (patch missing in " + JS + ")");
});

console.log(failures ? `\n${failures} FAILURE(S)` : "\nALL CHECKS PASSED");
process.exit(failures ? 1 : 0);
