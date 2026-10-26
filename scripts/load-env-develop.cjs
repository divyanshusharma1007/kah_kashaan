const fs = require("node:fs");
const path = require("node:path");

const envName = process.env.APP_ENV === "develop" ? ".env.develop" : ".env.local";
const envPath = path.resolve(process.cwd(), envName);

if (!fs.existsSync(envPath)) {
  throw new Error(
    `Missing ${envName}. Copy .env.example to ${envName} and fill in the required values.`,
  );
}

const source = fs.readFileSync(envPath, "utf8");
const lines = [];
let pending = "";

for (const rawLine of source.split(/\r?\n/)) {
  const line = pending + rawLine;
  const quoteCount = (line.match(/(?<!\\)"/g) || []).length;
  if (quoteCount % 2 === 1) {
    pending = `${line}\n`;
    continue;
  }
  pending = "";
  lines.push(line);
}

if (pending) {
  lines.push(pending);
}

for (const line of lines) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith("#")) {
    continue;
  }

  const withoutExport = trimmed.startsWith("export ")
    ? trimmed.slice("export ".length).trim()
    : trimmed;
  const separator = withoutExport.indexOf("=");
  if (separator <= 0) {
    continue;
  }

  const key = withoutExport.slice(0, separator).trim();
  if (!key || Object.prototype.hasOwnProperty.call(process.env, key)) {
    continue;
  }

  let value = withoutExport.slice(separator + 1).trim();
  const hashIndex = value.search(/(^|\s)#/);
  if (!value.startsWith('"') && !value.startsWith("'") && hashIndex !== -1) {
    value = value.slice(0, hashIndex).trim();
  }

  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    value = value.slice(1, -1);
  }

  process.env[key] = value.replace(/\\n/g, "\n");
}
