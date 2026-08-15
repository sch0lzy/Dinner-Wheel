/**
 * Pushes items from a Dinner Wheel grocery-list export into one of your
 * AnyList shopping lists.
 *
 * This uses the unofficial "anylist" npm package (reverse-engineered
 * AnyList API). It is NOT an official AnyList tool.
 *
 * Usage:
 *   1. cd scripts (if not already there) && npm install
 *   2. In the Dinner Wheel webpage, click "Grocery List" under This Week's
 *      Meals, then "Download JSON". Save/keep the file as
 *      grocery-list-export.json in the project root (one level up from
 *      this scripts folder), or pass a custom path as an argument.
 *   3. Set credentials and target list name as environment variables:
 *        Windows (PowerShell):
 *          $env:ANYLIST_EMAIL="you@example.com"
 *          $env:ANYLIST_PASSWORD="yourpassword"
 *          $env:ANYLIST_LIST_NAME="Groceries"   # exact name of your AnyList list
 *   4. node push-to-anylist.js
 *      (or: node push-to-anylist.js path\to\other-file.json)
 */

const fs = require('fs');
const path = require('path');
const AnyList = require('anylist');

const email = process.env.ANYLIST_EMAIL;
const password = process.env.ANYLIST_PASSWORD;
const listName = process.env.ANYLIST_LIST_NAME;

if (!email || !password) {
  console.error('Missing credentials. Set ANYLIST_EMAIL and ANYLIST_PASSWORD environment variables before running this script.');
  process.exit(1);
}

if (!listName) {
  console.error('Missing target list. Set ANYLIST_LIST_NAME to the exact name of your AnyList shopping list (e.g. "Groceries").');
  process.exit(1);
}

const inputPath = process.argv[2]
  ? path.resolve(process.argv[2])
  : path.join(__dirname, '..', 'grocery-list-export.json');

if (!fs.existsSync(inputPath)) {
  console.error(`Grocery list file not found: ${inputPath}`);
  console.error('Export it from the Dinner Wheel webpage first (This Week\'s Meals > Grocery List > Download JSON).');
  process.exit(1);
}

let items;
try {
  items = JSON.parse(fs.readFileSync(inputPath, 'utf-8'));
  if (!Array.isArray(items)) throw new Error('Expected a JSON array of strings.');
} catch (err) {
  console.error('Failed to read grocery list file:', err.message || err);
  process.exit(1);
}

(async () => {
  const any = new AnyList({ email, password });

  try {
    await any.login();
    await any.getLists();

    const list = any.getListByName(listName);
    if (!list) {
      const available = any.lists.map((l) => l.name).join(', ');
      console.error(`List "${listName}" not found. Available lists: ${available}`);
      process.exitCode = 1;
      return;
    }

    let added = 0;
    for (const raw of items) {
      const name = String(raw).trim();
      if (!name) continue;
      const item = any.createItem({ name });
      await list.addItem(item);
      added += 1;
    }

    console.log(`Added ${added} item(s) to "${listName}".`);
  } catch (err) {
    console.error('Push failed:', err.message || err);
    process.exitCode = 1;
  } finally {
    any.teardown();
  }
})();
