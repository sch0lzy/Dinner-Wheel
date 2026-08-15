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

Recipe names will be added to your wheel (duplicates are skipped).
