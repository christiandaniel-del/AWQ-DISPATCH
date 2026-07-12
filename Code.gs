/**
 * Backend Router & Initialization
 * Menyajikan Index.html sebagai UI Shell.
 */
function doGet(e) {
  return HtmlService.createTemplateFromFile('Index')
      .evaluate()
      .setTitle('AWQ OCC | Dispatch Dashboard')
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
      .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

/**
 * Fungsi include untuk memuat file HTML partial (UI Components)
 */
function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}
/**
 * Retrieves all data from the "NOTAM" sheet.
 * @returns {Array<Array<string>>} 2D array representing spreadsheet data.
 */
function getNotamData() {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName("NOTAM");
    
    if (!sheet) {
      throw new Error("Sheet named 'NOTAM' was not found.");
    }
    
    const range = sheet.getDataRange();
    const values = range.getValues();
    
    return values.length > 0 ? values : [];
  } catch (error) {
    Logger.log("Error in getNotamData: " + error.message);
    throw new Error(error.message);
  }
}

/**
 * Clears the existing "NOTAM" sheet and writes the provided 2D array data.
 * @param {Array<Array<string>>} data2DArray - The parsed TSV data from the frontend.
 * @param {string} queryStr - Optional query string from the raw data.
 * @returns {Object} JSON object indicating success or error status.
 */
function saveNotamData(data2DArray, queryStr) {
  const lock = LockService.getScriptLock();
  let lockAcquired = false;
  try {
    lock.waitLock(30000);
    lockAcquired = true;
  } catch (e) {
    throw new Error("System is currently processing another database commit. Please retry shortly.");
  }

  try {
    if (!data2DArray || !Array.isArray(data2DArray) || data2DArray.length === 0) {
      throw new Error("Invalid or empty data array provided.");
    }

    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName("NOTAM");
    
    if (!sheet) {
      throw new Error("Sheet named 'NOTAM' was not found.");
    }
    
    // Hapus data lama
    sheet.clearContents();
    
    const numRows = data2DArray.length;
    
    // PERBAIKAN: Cari jumlah kolom terbanyak dari seluruh baris.
    // Ini memastikan 4 baris header pertama tidak membuat data di bawahnya terpotong.
    const numCols = Math.max(...data2DArray.map(row => row.length));
    
    // Normalisasi matriks (Wajib agar semua baris memiliki panjang array yang persis sama)
    const normalizedData = data2DArray.map(row => {
      const newRow = [...row];
      while (newRow.length < numCols) newRow.push("");
      return newRow.slice(0, numCols);
    });

    const targetRange = sheet.getRange(1, 1, numRows, numCols);
    targetRange.setValues(normalizedData);
    SpreadsheetApp.flush();
    
    // Record update history
    recordNotamUpdateHistory(numRows, "SUCCESS", queryStr || "");
    
    return {
      status: "success",
      message: `Successfully saved ${numRows} records to the NOTAM sheet.`
    };
  } catch (error) {
    Logger.log("Error in saveNotamData: " + error.message);
    return {
      status: "error",
      message: error.message
    };
  } finally {
    if (lockAcquired) {
      lock.releaseLock();
    }
  }
}

/**
 * Records the NOTAM update event to the NOTAM_HISTORY sheet.
 */
function recordNotamUpdateHistory(rowCount, status, queryStr) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let historySheet = ss.getSheetByName("NOTAM_HISTORY");
    if (!historySheet) {
      historySheet = ss.insertSheet("NOTAM_HISTORY");
      historySheet.appendRow(["Timestamp", "User", "Records Updated", "Status", "Query"]);
      // Format header
      historySheet.getRange(1, 1, 1, 5).setFontWeight("bold").setBackground("#f3f3f3");
    }
    const timestamp = new Date();
    // In some deployment contexts, getActiveUser might be blank
    let user = Session.getActiveUser().getEmail();
    if (!user) user = "System/Unknown User";
    
    historySheet.appendRow([timestamp, user, rowCount, status, queryStr]);
  } catch(e) {
    Logger.log("Failed to record history: " + e.message);
  }
}

/**
 * Retrieves the NOTAM update history to display in the UI.
 */
function getNotamUpdateHistory() {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const historySheet = ss.getSheetByName("NOTAM_HISTORY");
    if (!historySheet) return [];
    
    const data = historySheet.getDataRange().getValues();
    if (data.length <= 1) return [];
    
    const history = data.slice(1).map(row => {
      // Format timestamp to readable string
      let ts = row[0];
      if (ts instanceof Date) {
        const yyyy = ts.getFullYear();
        const mm = String(ts.getMonth() + 1).padStart(2, '0');
        const dd = String(ts.getDate()).padStart(2, '0');
        const hh = String(ts.getHours()).padStart(2, '0');
        const min = String(ts.getMinutes()).padStart(2, '0');
        ts = `${yyyy}-${mm}-${dd} ${hh}:${min}`;
      }
      return {
        timestamp: ts,
        user: row[1],
        rowCount: row[2],
        status: row[3],
        queryStr: row[4] || ""
      };
    });
    
    // Sort descending by timestamp
    history.reverse();
    return history.slice(0, 50); // Return up to last 50 entries
  } catch(e) {
    Logger.log("Error getting history: " + e.message);
    return [];
  }
}

/**
 * Automatically creates a menu when the spreadsheet is opened.
 */
function onOpen() {
  const ui = SpreadsheetApp.getUi();
  ui.createMenu('DISPATCH IO')
      .addItem('⚠️ Weather Warning', 'openWeatherWarning')
      .addSeparator()
      .addItem('Notam Board', 'showNotamUi') // Assuming these functions exist or will be used
      .addToUi();
}

/**
 * Temporary function to show Notam UI (placeholder if not already defined)
 */
function showNotamUi() {
  const html = HtmlService.createTemplateFromFile('Notam_Ui')
      .evaluate()
      .setWidth(1000)
      .setHeight(700)
      .setTitle('NOTAM Management');
  SpreadsheetApp.getUi().showModalDialog(html, 'NOTAM Board');
}