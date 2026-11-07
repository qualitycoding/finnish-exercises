// Planning spike (R6): content-note checker satisfying T-061. S-004 copies it to tools/check-notes.mjs.
import { readFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const GROUPS = [
  ["yle", ["yle.fi"]],
  ["sanoma", ["hs.fi", "is.fi"]],
  ["alma", ["iltalehti.fi", "kauppalehti.fi", "talouselama.fi"]],
  ["mtv", ["mtvuutiset.fi"]],
  ["stt", ["stt.fi"]],
];

/** Publisher group of a URL: a known group, otherwise the host without www. */
export function publisherGroup(url) {
  const host = new URL(url).hostname.replace(/^www\./, "");
  for (const [g, hosts] of GROUPS) if (hosts.some((h) => host === h || host.endsWith(`.${h}`))) return g;
  return host;
}

const section = (md, title) => {
  const m = md.match(new RegExp(`^## ${title}\\s*$([\\s\\S]*?)(?=^## |(?![\\s\\S]))`, "m"));
  return m ? m[1] : null;
};
const rows = (body) => body.split("\n").filter((l) => /^\|/.test(l) && !/^\|\s*:?-/.test(l)).slice(1);
const urls = (s) => s.match(/https:\/\/[^\s|)]+/g) || [];

export function checkNote(md, file = "note.md") {
  const p = [];
  const facts = section(md, "Facts");
  if (facts === null || rows(facts).length === 0) p.push(`${file}: [N1] no '## Facts' table with rows`);
  else rows(facts).forEach((r, i) => {
    const groups = new Set(urls(r).map(publisherGroup));
    if (groups.size < 2) p.push(`${file}: [N2] fact row ${i + 1} has sources from ${groups.size} publisher group(s)`);
  });
  const people = section(md, "Real people");
  if (people === null) p.push(`${file}: [N3] no '## Real people' section`);
  else if (!/^None\.\s*$/m.test(people)) rows(people).forEach((r, i) => {
    if (urls(r).length === 0) p.push(`${file}: [N4] real-person row ${i + 1} has no https source`);
  });
  return p;
}

export function checkAll(root) {
  const manifest = JSON.parse(readFileSync(join(root, "data/manifest.json"), "utf8"));
  const problems = [];
  for (const f of manifest.themes) {
    const id = f.replace(/^themes\//, "").replace(/\.json$/, "");
    const note = join(root, "content-notes", `${id}.md`);
    if (!existsSync(note)) problems.push(`content-notes/${id}.md: [N0] missing`);
    else problems.push(...checkNote(readFileSync(note, "utf8"), `content-notes/${id}.md`));
  }
  return problems;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const root = process.argv[2] || join(dirname(fileURLToPath(import.meta.url)), "..");
  const problems = checkAll(root);
  console.log(problems.join("\n") || "all content notes valid");
  process.exit(problems.length ? 1 : 0);
}
