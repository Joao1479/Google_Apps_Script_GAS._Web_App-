function doGet(e) {
  return HtmlService.createTemplateFromFile('index')
    .evaluate()
    .setTitle('3D Price Library')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

const DB_NAME = '3D_Pricing_Database';

function getDb() {
  let files = DriveApp.getFilesByName(DB_NAME);
  if (files.hasNext()) {
    return SpreadsheetApp.open(files.next());
  } else {
    // Create new spreadsheet if it doesn't exist
    let ss = SpreadsheetApp.create(DB_NAME);
    let sheet3D = ss.getSheets()[0];
    sheet3D.setName('Total 3D');
    
    let sheetNot3D = ss.insertSheet('Item Not 3D');
    
    // Setup headers
    sheet3D.appendRow(['Timestamp', 'Plate Identifier', 'Grams', 'Cost', 'Time', 'Project Name', 'Grand Total Cost', 'Project Link']);
    sheet3D.getRange("A1:H1").setFontWeight("bold").setBackground("#d0e0e3");
    
    sheetNot3D.appendRow(['Timestamp', 'Item Link', 'Quantity', 'Total Item Cost', 'Project Name']);
    sheetNot3D.getRange("A1:E1").setFontWeight("bold").setBackground("#ead1dc");
    
    return ss;
  }
}

function saveProject(payload) {
  try {
    let ss = getDb();
    const timestamp = new Date();
    
    // Save Plates to Total 3D
    let sheet3D = ss.getSheetByName('Total 3D');
    payload.plates.forEach((plate, index) => {
      sheet3D.appendRow([
        timestamp, 
        `Plate ${index + 1}`, // Plate Identifier
        plate.grams, 
        plate.cost, 
        plate.originalTimeStr || `${plate.timeMins}m`, 
        payload.projectName, 
        payload.grandTotal, 
        payload.projectLink
      ]);
    });
    
    // Save Items to Item Not 3D
    let sheetNot3D = ss.getSheetByName('Item Not 3D');
    payload.items.forEach((item) => {
      sheetNot3D.appendRow([
        timestamp, 
        item.link, 
        item.qty, 
        item.qty * item.unitCost, 
        payload.projectName
      ]);
    });

    return true;
  } catch (error) {
    throw new Error("Failed to save project: " + error.message);
  }
}
