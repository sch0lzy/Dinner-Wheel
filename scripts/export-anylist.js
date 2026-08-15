/**
 * One-time local export of AnyList recipes to a JSON file
 * that the Dinner Wheel webpage can import.
 *
 * This uses the unofficial "anylist" npm package (reverse-engineered
 * AnyList API). It is NOT an official AnyList tool.
 *
 * Usage:
 *   1. cd scripts
 *   2. npm install
 *   3. Set your credentials as environment variables (do NOT hardcode them):
 *        Windows (PowerShell):
 *          $env:ANYLIST_EMAIL="you@example.com"
 *          $env:ANYLIST_PASSWORD="yourpassword"
 *   4. node export-anylist.js
 *
 * Output: ../recipes-export.json (array of { name, ingredients, note })
 * This file is gitignored and never sent anywhere except read by the webpage import button.
 */

const fs = require('fs');
const path = require('path');
const AnyList = require('anylist');

const email = process.env.ANYLIST_EMAIL;
const password = process.env.ANYLIST_PASSWORD;

if (!email || !password) {
  console.error('Missing credentials. Set ANYLIST_EMAIL and ANYLIST_PASSWORD environment variables before running this script.');
  process.exit(1);
}

const outputPath = path.join(__dirname, '..', 'recipes-export.json');

(async () => {
  const any = new AnyList({ email, password });

  try {
    await any.login();
    await any.getRecipes();

    const recipes = (any.recipes || []).map((r) => ({
      name: r.name || 'Untitled Recipe',
      note: r.note || '',
      ingredients: (r.ingredients || []).map((i) => i.rawIngredient || i.name).filter(Boolean),
    }));

    fs.writeFileSync(outputPath, JSON.stringify(recipes, null, 2), 'utf-8');
    console.log(`Exported ${recipes.length} recipe(s) to ${outputPath}`);
  } catch (err) {
    console.error('Export failed:', err.message || err);
    process.exitCode = 1;
  } finally {
    any.teardown();
  }
})();
