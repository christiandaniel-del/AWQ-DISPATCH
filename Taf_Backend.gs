/**
 * TAF MANAGEMENT BACKEND
 * Handles reading, writing, and fetching TAF data from external APIs.
 */

/**
 * Fetches all TAF data from the 'TAF' sheet.
 */
function getTafData() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName('TAF');
  
  if (!sheet) {
    sheet = ss.insertSheet('TAF');
    sheet.appendRow(['STATION', 'RAW_TAF', 'TIMESTAMP']);
    return [];
  }
  
  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) return [];
  
  // Skip header row
  return data.slice(1).map(row => ({
    STATION: String(row[0] || "").trim().toUpperCase(),
    RAW_TAF: String(row[1] || "").trim(),
    TIMESTAMP: row[2] ? Utilities.formatDate(new Date(row[2]), Session.getScriptTimeZone(), "yyyy-MM-dd HH:mm:ss") : ""
  }));
}

/**
 * Saves/Overwrites the 'TAF' sheet with provided data.
 */
function saveTafData(tafArray) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName('TAF');
  
  if (!sheet) {
    sheet = ss.insertSheet('TAF');
  }
  
  sheet.clearContents();
  sheet.appendRow(['STATION', 'RAW_TAF', 'TIMESTAMP']);
  
  if (tafArray && tafArray.length > 0) {
    const matrix = tafArray.map(item => [
      item.STATION.toUpperCase(),
      item.RAW_TAF,
      item.TIMESTAMP || new Date()
    ]);
    sheet.getRange(2, 1, matrix.length, 3).setValues(matrix);
  }
  
  return { status: "SUCCESS", message: "TAF Database Updated" };
}

/**
 * Fetches the latest TAF from AviationWeather.gov for a list of stations.
 */
function fetchLatestTafFromApi(icaoList) {
  if (!icaoList || icaoList.length === 0) return {};
  
  const stations = icaoList.map(s => s.trim().toUpperCase()).filter(s => s.length >= 3);
  const tafMap = {};
  
  try {
    const url = `https://aviationweather.gov/api/data/taf?ids=${stations.join(",")}&format=raw`;
    const res = UrlFetchApp.fetch(url, { muteHttpExceptions: true });
    
    if (res.getResponseCode() === 200) {
      const text = res.getContentText();
      const blocks = text.split(/(?=\bTAF\s)/);
      
      blocks.forEach(block => {
        const bTrim = block.trim();
        if (!bTrim) return;
        const m = bTrim.match(/^TAF\s+(?:AMD\s+|COR\s+)?([A-Z]{4})/i);
        if (m) {
          tafMap[m[1].toUpperCase()] = bTrim;
        }
      });
    }
  } catch (e) {
    console.error("Fetch Error: " + e.message);
  }
  
  return tafMap;
}
