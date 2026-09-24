import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.resolve(__dirname, "../data");

function collectionPath(collection) {
  return path.join(dataDir, `${collection}.json`);
}

export async function read(collection) {
  const text = await fs.readFile(collectionPath(collection), "utf8");
  return JSON.parse(text);
}

export async function find(collection, id) {
  const records = await read(collection);
  return records.find(record => record.id === id) ?? null;
}

export async function insert(collection, record) {
  const records = await read(collection);

  records.push(record);

  await fs.writeFile(
    collectionPath(collection),
    JSON.stringify(records, null, 2) + "\n"
  );

  return record;
}

export async function update(collection, id, changes) {
  const records = await read(collection);
  const index = records.findIndex(record => record.id === id);

  if (index === -1) {
    return null;
  }

  records[index] = {
    ...records[index],
    ...changes
  };

  await fs.writeFile(
    collectionPath(collection),
    JSON.stringify(records, null, 2) + "\n"
  );

  return records[index];
}

export async function reset() {
  const collections = [
    "onboardings",
    "customers",
    "verifications",
    "accounts"
  ];

  for (const collection of collections) {
    await fs.writeFile(
      collectionPath(collection),
      "[]\n"
    );
  }
}
