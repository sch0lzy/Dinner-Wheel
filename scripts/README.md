# AnyList Export Script

Exports your AnyList recipes to `../recipes-export.json`, which you can then load
into the Dinner Wheel webpage using its **Import from AnyList JSON** button.

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

This creates `recipes-export.json` in the project root (one level up), containing
an array of your recipes:

```json
[
  { "name": "Congee", "note": "", "ingredients": ["1 cup rice", "..."] }
]
```

## Import into Dinner Wheel

1. Open `index.html` in your browser (or your locally-served/deployed site).
2. Click **Import Recipes** in the Recipes panel.
3. Select `recipes-export.json`.

Recipe names will be added to your wheel (duplicates are skipped), and ingredient
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
