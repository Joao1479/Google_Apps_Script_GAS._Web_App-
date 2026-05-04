---
name: google-apps-script-workflow
description: Streamlined workflow and constraints for building Google Apps Script (GAS) Web Apps with HTML/JS/CSS.
---

# Google Apps Script (GAS) Web App Workflow

This skill defines the standard operating procedure for generating, editing, and previewing web applications designed to be deployed via Google Apps Script (GAS).

## 1. Architectural Constraints & Code Organization
- **Modular Multi-File Pattern**: Instead of injecting everything into a massive `index.html`, explicitly divide the frontend into `index.html`, `css.html` (for styling), and `js.html` (for application logic and mock backends).
- **Include Directives**: Use GAS templating `<style><?!= include('css'); ?></style>` in the `<head>` and `<script><?!= include('js'); ?></script>` at the base of the `<body>` in `index.html` to import these segments. This avoids breaking local mock plugins and keeps the structure clean.
- **Vanilla Tech Stack Paradigm**: Use ONLY pure HTML5, vanilla CSS3, and vanilla JavaScript (ES6+).
- **Zero External Dependencies**: It is STRICTLY PROHIBITED to use external frontend frameworks, UI libraries, or CDNs (e.g., React, Angular, Tailwind, Bootstrap, jQuery) *unless explicitly forced by the user in the prompt*.
- **No JS Modules**: Do not use `<script type="module">` as GAS does not support native ES modules in the browser without an external bundling process.
- **Descriptive Comments**: You MUST assure that comprehensive, descriptive comments are included throughout the HTML, CSS, and JS explaining the function of specific components, logic handlers, and overall structure. This is critical for maintainability.

## 2. Local Preview & Mocking (Crucial for AI Studio)
To ensure the application can be previewed locally and iterativly developed in AI Studio before deployment to GAS, you MUST mock the `google.script.run` API internally so UI interactions don't break.

Add this fallback at the very beginning of the main `<script>` tag:

```javascript
if (typeof window.google === 'undefined') {
console.info("Initializing fallback mocked google.script environment for local preview.");
window.google = {
script: {
run: {
withSuccessHandler: function(cb) {
return {
withFailureHandler: function(errCb) {
return {
// MOCK BACKEND FUNCTIONS HERE
// Example:
// loadData: function() { setTimeout(() => cb(mockData), 300); },
// saveData: function(data) { setTimeout(() => cb(true), 300); }
}
}
}
}
}
}
};
}
```

## 3. Communication Protocol (`google.script.run`)
- Always use `google.script.run` with `withSuccessHandler` (and optionally `withFailureHandler`) for client-to-server communication.
- **Serialization limits**: Keep payloads serialized where possible. Convert complex objects using `JSON.stringify()` on the frontend and `JSON.parse()` on the `Code.gs` backend if necessary to avoid silent failures when passing Maps or Dates.

## 4. Backend Operations (`Code.gs`)
When requested to write or review backend GAS code, adhere to these standards:
- **Entry Point**: Always include the `doGet(e)` function to serve the web app interface using `HtmlService.createTemplateFromFile('index').evaluate()`. This allows `<?!= include('file'); ?>` scriptlet parsing.
- **Include Helper**: MUST permanently add the helper function `function include(filename) { return HtmlService.createHtmlOutputFromFile(filename).getContent(); }` at the global scope in `Code.gs`.
- **Identity & Auto-Login**: Utilize `Session.getActiveUser().getEmail()` for automatic authentication when tracking user states or quotas natively without asking for external login prompts.
- **Google Workspace as DB**: Use Google Workspace APIs (`SpreadsheetApp` for Google Sheets, `DriveApp` for Folders/Files) as the backend database. Handlers must gracefully handle the initial absence of files (e.g., dynamically creating the required Sheet and applying Headers if it doesn't exist).

## 5. Commenting & Code Maintainability
- Provide explicit, step-by-step explanatory comments throughout both the frontend `index.html` and the backend `Code.gs` files.
- ALWAYS generate the app's User Interface (text, buttons, labels), code variables, comments, and explanations entirely in ENGLISH, ensuring logic is decoupled from regional prompt variations.
