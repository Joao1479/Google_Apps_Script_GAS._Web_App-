/**
 * @file Code.gs
 * @description Google Apps Script backend for the Advanced Daily Task Tracker.
 */

/**
 * TRIGGER GOOGLE PERMISSIONS:
 * Selecione esta função "authorize" no menu do topo do Editor de Apps Script e clique em "Executar" / "Run".
 * Isto forçará o ecrã de "Revisão de Permissões" a aparecer para que o DriveApp e SpreadsheetApp funcionem no seu website.
 */
function authorize() {
  var email = Session.getActiveUser().getEmail();
  Logger.log("Authorized for: " + email);
  // Estes comandos inertes obrigam o Apps Script a injetar os 'scopes' necessários de Drive e Sheets no Web App manifest.
  var triggerDriveScope = DriveApp.getRootFolder();
  var triggerSheetsScope = SpreadsheetApp.create("temp").getId();
  DriveApp.getFileById(triggerSheetsScope).setTrashed(true);
}

function doGet(e) {
  return HtmlService.createHtmlOutputFromFile('index')
    .setTitle('Advanced Daily Task Tracker')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function getUserEmail() {
  return Session.getActiveUser().getEmail();
}

function getWeeklyTvTimeFromSheet() {
  try {
    var email = getUserEmail();
    var nameParts = email.split('@');
    var accountName = nameParts.length > 0 ? nameParts[0] : email;
    var fileName = "Daily Task Tracker [" + accountName + "]";
    
    var folderName = "Agentes Daily task Tracker";
    var folders = DriveApp.getFoldersByName(folderName);
    if (!folders.hasNext()) return null;
    var targetFolder = folders.next();
    
    var folderFiles = targetFolder.getFilesByName(fileName);
    var spreadsheet;
    if (folderFiles.hasNext()) {
      spreadsheet = SpreadsheetApp.openById(folderFiles.next().getId());
    } else {
      var globalFiles = DriveApp.getFilesByName(fileName);
      if (globalFiles.hasNext()) {
         spreadsheet = SpreadsheetApp.openById(globalFiles.next().getId());
      } else {
         return null; 
      }
    }
    
    var sheetTv = spreadsheet.getSheetByName("Vertical Training") || spreadsheet.getSheetByName("Vertical Trainning") || spreadsheet.getSheetByName("Treino Vertical");
    if (!sheetTv) return null;
    
    var lastRow = sheetTv.getLastRow();
    if (lastRow <= 1) return null;
    
    var data = sheetTv.getRange(2, 1, lastRow - 1, 3).getValues(); 
    var displayData = sheetTv.getRange(2, 1, lastRow - 1, 3).getDisplayValues();
    
    var d = new Date();
    var tz = Session.getScriptTimeZone();
    var dayOfWeek = d.getDay();
    var currDate = d.getDate();
    var sundayDate = new Date(d.getTime());
    sundayDate.setDate(currDate - dayOfWeek);
    var currentWeekStartStr = Utilities.formatDate(sundayDate, tz, "yyyy-MM-dd");
    var todayStr = Utilities.formatDate(d, tz, "yyyy-MM-dd");
    
    var pastTvSumSecs = 0;
    
    for (var i = 0; i < data.length; i++) {
       var rowDateRaw = data[i][0];
       var weekStartRaw = data[i][1];
       var timeStr = displayData[i][2]; // Expected HH:mm:ss string representation
       
       var rowDate = (rowDateRaw instanceof Date) ? Utilities.formatDate(rowDateRaw, tz, "yyyy-MM-dd") : rowDateRaw.toString();
       var weekStart = (weekStartRaw instanceof Date) ? Utilities.formatDate(weekStartRaw, tz, "yyyy-MM-dd") : weekStartRaw.toString();

       if (weekStart === currentWeekStartStr && rowDate !== todayStr) {
           var parts = timeStr.split(':');
           if (parts.length === 3) {
             pastTvSumSecs += (parseInt(parts[0], 10) * 3600) + (parseInt(parts[1], 10) * 60) + parseInt(parts[2], 10);
           }
       }
    }
    return pastTvSumSecs;
  } catch(e) {
    return null;
  }
}

function loadData() {
  try {
    var email = getUserEmail();
    var props = PropertiesService.getUserProperties();
    var data = props.getProperty('TaskTrackerData_' + email);
    
    var tz = Session.getScriptTimeZone();
    var d = new Date();
    var todayStr = Utilities.formatDate(d, tz, "yyyy-MM-dd");
    
    // --- Calcular o TV Time da Semana ---
    var pastTvSum = 0;
    var gSheetTvSum = getWeeklyTvTimeFromSheet();
    
    if (gSheetTvSum !== null) {
        pastTvSum = gSheetTvSum;
    } else {
        var tvHistoryStr = props.getProperty('TaskTrackerTvHistory_' + email);
        var tvHistory = tvHistoryStr ? JSON.parse(tvHistoryStr) : {};
        var dayOfWeek = d.getDay(); // 0 is Sunday
        var currDate = d.getDate();
        for (var i = 0; i <= dayOfWeek; i++) {
            var tempDate = new Date(d);
            tempDate.setDate(currDate - dayOfWeek + i);
            var dateStr = Utilities.formatDate(tempDate, tz, "yyyy-MM-dd");
            if (dateStr !== todayStr) {
                pastTvSum += (parseInt(tvHistory[dateStr]) || 0);
            }
        }
    }

    if (data) {
       var parsed = JSON.parse(data);
       parsed.pastTvSecsThisWeek = pastTvSum;
       
       if (parsed.lastSavedDate && parsed.lastSavedDate !== todayStr) {
           // It's a new day! Reset the daily tracked metrics.
           parsed.caseTimerSecs = 0;
           parsed.breakTimerSecs = 0;
           parsed.tvTimerSecs = 0;
           if (parsed.queues) {
              parsed.queues.forEach(function(q) { q.count = 0; });
           }
           parsed.detailedLogs = [];
       }
       
       parsed.lastSavedDate = todayStr;
       
       return JSON.stringify(parsed);
    } else {
       return JSON.stringify({ pastTvSecsThisWeek: pastTvSum, lastSavedDate: todayStr });
    }
  } catch (error) { return null; }
}

function saveData(dataString) {
  try {
    var email = getUserEmail();
    var props = PropertiesService.getUserProperties();
    
    // Inject server-side today's date into the saved payload for reset tracking
    var dataObj = JSON.parse(dataString);
    var tz = Session.getScriptTimeZone();
    dataObj.lastSavedDate = Utilities.formatDate(new Date(), tz, "yyyy-MM-dd");
    var finalDataString = JSON.stringify(dataObj);
    
    props.setProperty('TaskTrackerData_' + email, finalDataString);
    logDailyHistory(finalDataString);
    return true;
  } catch (error) { return false; }
}

function logDailyHistory(dataString) {
  var email = getUserEmail();
  var props = PropertiesService.getUserProperties();
  
  // Historical Items Total
  var historyStr = props.getProperty('TaskTrackerHistory_' + email);
  var history = historyStr ? JSON.parse(historyStr) : {};
  var tz = Session.getScriptTimeZone();
  var today = Utilities.formatDate(new Date(), tz, "yyyy-MM-dd");
  var data = JSON.parse(dataString);
  var totalItems = 0;
  if (data.queues && Array.isArray(data.queues)) {
    data.queues.forEach(function(q) { totalItems += parseInt(q.count || 0, 10); });
  }
  history[today] = totalItems;
  props.setProperty('TaskTrackerHistory_' + email, JSON.stringify(history));

  // Historical TV Tracking
  var tvHistoryStr = props.getProperty('TaskTrackerTvHistory_' + email);
  var tvHistory = tvHistoryStr ? JSON.parse(tvHistoryStr) : {};
  tvHistory[today] = parseInt(data.tvTimerSecs || 0, 10);
  props.setProperty('TaskTrackerTvHistory_' + email, JSON.stringify(tvHistory));
}

function getHistory() {
  try {
    var email = getUserEmail();
    var props = PropertiesService.getUserProperties();
    var historyStr = props.getProperty('TaskTrackerHistory_' + email);
    var history = historyStr ? JSON.parse(historyStr) : {};
    var tz = Session.getScriptTimeZone();
    var labels = [], data = [];
    for (var i = 6; i >= 0; i--) {
      var d = new Date();
      d.setDate(d.getDate() - i);
      var dateStr = Utilities.formatDate(d, tz, "yyyy-MM-dd");
      labels.push(dateStr);
      data.push(history[dateStr] || 0);
    }
    return JSON.stringify({ labels: labels, data: data });
  } catch (error) { return JSON.stringify({ labels: [], data: [] }); }
}

function exportToGoogleSheet(dataString) {
  try {
    var email = getUserEmail();
    var nameParts = email.split('@');
    var accountName = nameParts.length > 0 ? nameParts[0] : email;
    
    var fileName = "Daily Task Tracker [" + accountName + "]";
    var todayStr = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyy-MM-dd");
    
    var folderName = "Agentes Daily task Tracker";
    var folders = DriveApp.getFoldersByName(folderName);
    var targetFolder;
    if (folders.hasNext()) {
      targetFolder = folders.next();
    } else {
      targetFolder = DriveApp.createFolder(folderName);
    }
    
    var folderFiles = targetFolder.getFilesByName(fileName);
    var spreadsheet, file;
    var isNewSpreadsheet = false;
    
    if (folderFiles.hasNext()) {
      file = folderFiles.next();
      spreadsheet = SpreadsheetApp.openById(file.getId());
    } else {
      var globalFiles = DriveApp.getFilesByName(fileName);
      if (globalFiles.hasNext()) {
        file = globalFiles.next();
        file.moveTo(targetFolder);
        spreadsheet = SpreadsheetApp.openById(file.getId());
      } else {
        isNewSpreadsheet = true;
        spreadsheet = SpreadsheetApp.create(fileName);
        file = DriveApp.getFileById(spreadsheet.getId());
        file.moveTo(targetFolder);
        file.setSharing(DriveApp.Access.PRIVATE, DriveApp.Permission.NONE);
      }
    }
    
    // --- 1) TAB: TASK LOGS ---
    var sheetNameTasks = "Task Logs";
    var sheetTasks = spreadsheet.getSheetByName(sheetNameTasks) || spreadsheet.getSheetByName("Log de Tarefas"); // fallback to edit existing if it was named in PT
    
    if (!sheetTasks) {
      if (isNewSpreadsheet) {
        sheetTasks = spreadsheet.getSheets()[0];
        sheetTasks.setName(sheetNameTasks);
      } else {
        sheetTasks = spreadsheet.insertSheet(sheetNameTasks);
      }
      var headersTasks = [["Date", "Queue Name", "Goal", "Count", "Progress (%)", "AHT Goal (s)"]];
      sheetTasks.getRange(1, 1, 1, headersTasks[0].length).setValues(headersTasks).setFontWeight("bold").setBackground("#e2e8f0");
    } else {
      if (sheetTasks.getName() === "Log de Tarefas") sheetTasks.setName(sheetNameTasks);
    }
    
    var lastRowTasks = sheetTasks.getLastRow();
    if (lastRowTasks > 1) {
      var dates = sheetTasks.getRange(2, 1, lastRowTasks - 1, 1).getDisplayValues();
      for (var i = dates.length - 1; i >= 0; i--) {
        if (dates[i][0] === todayStr) {
          sheetTasks.deleteRow(i + 2);
        }
      }
    }
    
    var data = JSON.parse(dataString);
    var queues = data.queues || [];
    var rowsTasks = [];
    
    queues.forEach(function(q) {
      var progress = q.goal > 0 ? ((q.count / q.goal) * 100).toFixed(2) + "%" : "0%";
      rowsTasks.push([todayStr, q.name, q.goal, q.count, progress, q.ahtGoal]);
    });
    
    if (rowsTasks.length > 0) {
      var startRow = sheetTasks.getLastRow() + 1;
      sheetTasks.getRange(startRow, 1, rowsTasks.length, rowsTasks[0].length).setValues(rowsTasks);
      
      for (var col = 1; col <= rowsTasks[0].length; col++) {
         sheetTasks.autoResizeColumn(col);
      }
    }

    // --- 2) TAB: VERTICAL TRAINING ---
    var sheetNameTv = "Vertical Training";
    var sheetTv = spreadsheet.getSheetByName(sheetNameTv) || spreadsheet.getSheetByName("Treino Vertical");
    
    if (!sheetTv) {
      sheetTv = spreadsheet.insertSheet(sheetNameTv);
      var headersTv = [["Date", "Week Starting (Sun)", "VT Time Logged", "Weekly Goal"]];
      sheetTv.getRange(1, 1, 1, headersTv[0].length).setValues(headersTv).setFontWeight("bold").setBackground("#d1fae5");
    } else {
      if (sheetTv.getName() === "Treino Vertical") sheetTv.setName(sheetNameTv);
    }

    // Calcular data do inicio da semana (Domingo)
    var d = new Date();
    var dayOfWeek = d.getDay(); // 0 is Sunday
    var currDate = d.getDate();
    var sundayDate = new Date(d.setDate(currDate - dayOfWeek));
    var weekStartStr = Utilities.formatDate(sundayDate, Session.getScriptTimeZone(), "yyyy-MM-dd");

    // Limpar existências soltas de "Hoje" da folha TV
    var lastRowTv = sheetTv.getLastRow();
    if (lastRowTv > 1) {
      var tvDates = sheetTv.getRange(2, 1, lastRowTv - 1, 1).getDisplayValues();
      for (var i = tvDates.length - 1; i >= 0; i--) {
        if (tvDates[i][0] === todayStr) {
          sheetTv.deleteRow(i + 2);
        }
      }
    }

    // Adicionar Linha TV
    var tvSecs = data.tvTimerSecs || 0;
    var tvH = Math.floor(tvSecs / 3600);
    var tvM = Math.floor((tvSecs % 3600) / 60);
    var tvS = tvSecs % 60;
    var tvTimeStr = ("0" + tvH).slice(-2) + ":" + ("0" + tvM).slice(-2) + ":" + ("0" + tvS).slice(-2);

    var goalH = "0";
    var goalM = "0";
    if (data.settings) {
      goalH = data.settings.tvGoalHours || 0;
      goalM = data.settings.tvGoalMinutes || 0;
    }
    var tvGoalStr = ("0" + goalH).slice(-2) + ":" + ("0" + goalM).slice(-2) + ":00";

    var tvRow = [[todayStr, weekStartStr, tvTimeStr, tvGoalStr]];
    var startRowTv = sheetTv.getLastRow() + 1;
    sheetTv.getRange(startRowTv, 1, 1, tvRow[0].length).setValues(tvRow);
    
    for (var col = 1; col <= tvRow[0].length; col++) {
       sheetTv.autoResizeColumn(col);
    }
    
    // --- 3) TAB: DETAILED LOGS ---
    var logs = data.detailedLogs || [];
    if (logs.length > 0) {
      var sheetNameLogs = "Detailed Logs";
      var sheetLogs = spreadsheet.getSheetByName(sheetNameLogs) || spreadsheet.getSheetByName("Registos Individuais");
      
      if (!sheetLogs) {
        sheetLogs = spreadsheet.insertSheet(sheetNameLogs);
        var headersLogs = [["Date & Time", "ID", "Queue Name", "Comment"]];
        sheetLogs.getRange(1, 1, 1, headersLogs[0].length).setValues(headersLogs).setFontWeight("bold").setBackground("#fef08a");
      } else {
        if (sheetLogs.getName() === "Registos Individuais") sheetLogs.setName(sheetNameLogs);
      }
      
      var logRows = [];
      logs.forEach(function(l) {
         // Formatar datahora para Portugal/tz para manter no Excel
         var fDate = "";
         try {
           fDate = Utilities.formatDate(new Date(l.timestamp), Session.getScriptTimeZone(), "yyyy-MM-dd HH:mm:ss");
         } catch(e) { 
           fDate = l.timeStr || todayStr; // Fallback
         }
         logRows.push([fDate, l.id, l.queue, l.comment]);
      });
      
      if (logRows.length > 0) {
        var startRowL = sheetLogs.getLastRow() + 1;
        sheetLogs.getRange(startRowL, 1, logRows.length, logRows[0].length).setValues(logRows);
        
        for (var lcol = 1; lcol <= logRows[0].length; lcol++) {
           sheetLogs.autoResizeColumn(lcol);
        }
      }
    }

    // --- 4) TAB: OVERALL PROGRESS ---
    var tabNameProgress = "Overall Progress";
    var sheetProgress = spreadsheet.getSheetByName(tabNameProgress);
    
    if (!sheetProgress) {
      sheetProgress = spreadsheet.insertSheet(tabNameProgress);
      var headersProgress = [["Date", "Last Sync Time", "Total Goal", "Total Count", "Overall Progress (%)", "Case Work Time", "Vertical Training Time", "Break Time", "Daily AHT"]];
      sheetProgress.getRange(1, 1, 1, headersProgress[0].length).setValues(headersProgress).setFontWeight("bold").setBackground("#e0e7ff");
    }

    // Remover entrada prévia do próprio dia para manter atualização limpa 1 linha por dia
    var lastRowProg = sheetProgress.getLastRow();
    if (lastRowProg > 1) {
      var progDates = sheetProgress.getRange(2, 1, lastRowProg - 1, 1).getDisplayValues();
      for (var i = progDates.length - 1; i >= 0; i--) {
        if (progDates[i][0] === todayStr) {
          sheetProgress.deleteRow(i + 2);
        }
      }
    }
    
    var timeStr = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "HH:mm:ss");
    
    var progTotalGoal = 0;
    var progTotalCount = 0;
    var progSumProgress = 0;
    
    queues.forEach(function(q) {
      progTotalGoal += q.goal;
      progTotalCount += q.count;
      var rawP = q.goal > 0 ? (q.count / q.goal) * 100 : 0;
      progSumProgress += rawP;
    });
    
    var finalProgressStr = progSumProgress.toFixed(2) + "%";
    
    var cwSecs = parseInt(data.caseTimerSecs || 0, 10);
    var cwH = Math.floor(cwSecs / 3600);
    var cwM = Math.floor((cwSecs % 3600) / 60);
    var cwS = cwSecs % 60;
    var cwTimeStr = ("0" + cwH).slice(-2) + ":" + ("0" + cwM).slice(-2) + ":" + ("0" + cwS).slice(-2);
    
    var brSecs = parseInt(data.breakTimerSecs || 0, 10);
    var brH = Math.floor(brSecs / 3600);
    var brM = Math.floor((brSecs % 3600) / 60);
    var brS = brSecs % 60;
    var brTimeStr = ("0" + brH).slice(-2) + ":" + ("0" + brM).slice(-2) + ":" + ("0" + brS).slice(-2);

    var progTvSecs = parseInt(data.tvTimerSecs || 0, 10);
    var progTvH = Math.floor(progTvSecs / 3600);
    var progTvM = Math.floor((progTvSecs % 3600) / 60);
    var progTvS = progTvSecs % 60;
    var progTvTimeStr = ("0" + progTvH).slice(-2) + ":" + ("0" + progTvM).slice(-2) + ":" + ("0" + progTvS).slice(-2);

    // Calcular (Case Work / Soma de todos os Counts) 
    var dailyAhtSecs = progTotalCount > 0 ? Math.round(cwSecs / progTotalCount) : 0;
    var ahtH = Math.floor(dailyAhtSecs / 3600);
    var ahtM = Math.floor((dailyAhtSecs % 3600) / 60);
    var ahtS = dailyAhtSecs % 60;
    var ahtTimeStr = ("0" + ahtH).slice(-2) + ":" + ("0" + ahtM).slice(-2) + ":" + ("0" + ahtS).slice(-2);

    var progressRow = [[todayStr, timeStr, progTotalGoal, progTotalCount, finalProgressStr, cwTimeStr, progTvTimeStr, brTimeStr, ahtTimeStr]];
    var startRowProgress = sheetProgress.getLastRow() + 1;
    var targetRange = sheetProgress.getRange(startRowProgress, 1, 1, progressRow[0].length);
    // Forçar formatação 'Plain Text' nas colunas que levam Time Strings para evitar que o Sheet os engula ou os converta para inteiros 0
    sheetProgress.getRange(startRowProgress, 6, 1, 4).setNumberFormat("@");
    targetRange.setValues(progressRow);    
    
    for (var col = 1; col <= progressRow[0].length; col++) {
       sheetProgress.autoResizeColumn(col);
    }

    // Clean up empty default Google Sheets
    var defaultSheet1 = spreadsheet.getSheetByName("Sheet1");
    var defaultSheet2 = spreadsheet.getSheetByName("Página1");
    var defaultSheet3 = spreadsheet.getSheetByName("Page1");
    if (defaultSheet1 && defaultSheet1.getName() !== sheetNameTasks && spreadsheet.getSheets().length > 1) spreadsheet.deleteSheet(defaultSheet1);
    if (defaultSheet2 && defaultSheet2.getName() !== sheetNameTasks && spreadsheet.getSheets().length > 1) spreadsheet.deleteSheet(defaultSheet2);
    if (defaultSheet3 && defaultSheet3.getName() !== sheetNameTasks && spreadsheet.getSheets().length > 1) spreadsheet.deleteSheet(defaultSheet3);
    
    return JSON.stringify({ success: true, url: spreadsheet.getUrl() });
  } catch(error) {
    Logger.log("Error exporting to sheet: " + error.toString());
    return JSON.stringify({ success: false, error: error.toString() });
  }
}