# AnyList Export Script

Exports your AnyList recipes to `../recipes-data.json`. This file is committed to
the repo so the Dinner Wheel app automatically loads the same recipe library on
any device (no manual import needed on first visit), and lets you click
**Sync Recipe Library** any time you push an updated export.

This uses the unofficial [`anylist`](https://www.npmjs.com/package/anylist) npm
package (reverse-engineered API). It is **not** an official AnyList tool, is not
affiliated with AnyList, and runs entirely on your own machine — your credentials
are never committed to git or uploaded anywhere.

## Setup

```powershell
cd scripts
npm install
```

## Run

Set your AnyList credentials as environment variables for the current session only,
then run the export:

```powershell
$env:ANYLIST_EMAIL="you@example.com"
$env:ANYLIST_PASSWORD="yourpassword"
node export-anylist.js
```

This creates `recipes-data.json` in the project root (one level up), containing
an array of your recipes:

```json
[
  { "name": "Congee", "note": "", "ingredients": ["1 cup rice", "..."] }
]
```

## Publishing an updated recipe library

1. Run the export script above to regenerate `recipes-data.json`.
2. Commit and push it to GitHub (`git add recipes-data.json`, commit, push).
3. On any device, open the app and click **Sync Recipe Library** to pull in the
   new recipes (existing ones are left alone; duplicates are skipped). New
   devices/browsers with no saved recipes yet will load it automatically.

You can also use **Import Recipes** to load any one-off JSON file by hand;
recipe names will be added to your wheel (duplicates are skipped), and ingredient
lists are stored per-recipe so they can be used to build a grocery list later.

## Sending This Week's Meals ingredients back to AnyList

Once you've spun the wheel and added a few meals to **This Week's Meals**:

1. In the app, click **Grocery List** under This Week's Meals, then **Download JSON**
   (this saves `grocery-list-export.json` to your Downloads folder — move it to the
   project root, one level up from this `scripts` folder).
2. Set your credentials and target AnyList list name as environment variables:
   ```powershell
   $env:ANYLIST_EMAIL="you@example.com"
   $env:ANYLIST_PASSWORD="yourpassword"
   $env:ANYLIST_LIST_NAME="Groceries"
   ```
   (Use the exact name of your AnyList shopping list.)
3. Run:
   ```powershell
   node push-to-anylist.js
   ```

This adds each ingredient as a new item to that AnyList list. Recipes without
imported ingredient data are listed under the grocery panel so you can type them
in manually before downloading/copying.
