# SKILL: GAS Slides Generator
**Purpose:** Transform raw text, outlines, or Markdown into a fully functional, professionally designed Google Slides presentation using Google Apps Script (GAS).

## 🎯 Trigger
* "Create a presentation in GAS"
* "Make a Google Slides script from this text"
* "Transform this markdown into a GAS Pitch Deck"

## 🛠️ Workflow / Execution Steps

### 1. Analyze Content & Structure
* Read the provided text/markdown.
* Break the content down into distinct slides.
* For each slide, identify: `Title`, `Body Content`, and `Metadata` (e.g., Sources, Footnotes).

### 2. Define the Aesthetic (Design System)
If the user doesn't specify an aesthetic, default to **"Modern Startup Pitch Deck"**.
Define the following design tokens:
* **Palette:** `colorBg` (Background), `colorAccent` (Brand color/Blocks), `colorDark` (Titles), `colorLight` (Text on accent), `colorGrey` (Body text).
* **Typography:** Choose a modern Google Font (e.g., `"Inter"`, `"Montserrat"`, `"Roboto"`).
* **Placeholder Media:** Select 4-5 relevant Unsplash URLs (`https://images.unsplash.com/photo-...`) that match the theme (tech, business, abstract).

### 3. Map to Dynamic Layouts
Structure the GAS array `slidesData` using predefined layouts to avoid visual monotony. 
* **Layout 1 (Split):** Left side Title/Body, Right side full-height Image.
* **Layout 2 (Top Heavy):** Top horizontal Image, Bottom Title, and an overlapping Accent Block containing the Body.
* **Layout 3 (Banner):** Top horizontal Accent Banner for the Title, Bottom split with Body and Image.
* **Layout 4 (Inverted Split):** Left side Accent Block with Light Text, Right side full-height Image.

### 4. Code the Apps Script (`.gs`)
Generate the Google Apps Script following these rules:
* Start with `var prs = SlidesApp.create("Presentation_Name");`
* Create the `slidesData` array with objects: `{ title: "", body: "", layout: X, imgUrl: "" }`.
* Loop through `slidesData` using `prs.appendSlide(SlidesApp.PredefinedLayout.BLANK)`.
* **Geometry:** Use explicit coordinates for shapes and text boxes (e.g., `.setTop(50).setLeft(40).setWidth(320).setHeight(240)`). Note that standard slides are 720x405 points.
* **Typography Formatting:** Apply styles using `getText().getTextStyle()`.
* **Smart Formatting (Bonus):** If the text contains sources like `[Source: ...]`, write a regex or `indexOf` loop in GAS to automatically reduce their font size to 9 and apply italic + lighter color.
* Delete the default first slide: `prs.getSlides()[0].remove();`

### 5. Delivery & Instructions
Deliver the `.gs` code block or file to the user.
Provide the following standard execution instructions:
1. Go to [script.google.com](https://script.google.com).
2. Create a new project.
3. Paste the code into `Code.gs`.
4. Click `Run` (▶️) and grant the necessary Google Drive/Slides permissions.
5. Find the generated presentation in the root of your Google Drive.

## 📝 Example Output Structure (Mental Model for AI)
```javascript
function generateSlides() {
  var prs = SlidesApp.create("Deck");
  var colorAccent = "#6351F6"; // Example
  // ... layouts ...
}
```
