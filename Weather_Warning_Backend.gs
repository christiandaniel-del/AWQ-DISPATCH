/**
 * Weather_Warning_Backend.gs
 * Logic for fetching flight data and opening the Weather Warning UI.
 */

/**
 * Membuka modal Weather Warning dari menu Spreadsheet.
 */
function openWeatherWarning() {
  const html = HtmlService.createTemplateFromFile('Weather_Warning_Ui')
      .evaluate()
      .setWidth(1000)
      .setHeight(700)
      .setTitle('Weather Warning System')
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
  SpreadsheetApp.getUi().showModalDialog(html, 'Weather Warning');
}

/**
 * Mengambil data penerbangan aktif dari sheet 'FLT INFO'.
 * Digunakan oleh React UI via google.script.run.
 */
function getActiveFlightDataForWarning() {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName('FLT INFO');
    if (!sheet) return JSON.stringify({ error: "Sheet 'FLT INFO' not found." });

    const lastRow = sheet.getLastRow();
    if (lastRow < 2) return JSON.stringify([]);

    // 1. Ambil data penerbangan (hanya kolom 1-7)
    const fltData = sheet.getRange(2, 1, lastRow - 1, 7).getDisplayValues();
    
    // 2. Ambil data TAF dari database terpusat (Sheet: TAF)
    const tafMap = {};
    const tafSheet = ss.getSheetByName('TAF');
    if (tafSheet) {
      const tafData = tafSheet.getDataRange().getValues();
      for (let i = 1; i < tafData.length; i++) {
        const icao = String(tafData[i][0] || "").trim().toUpperCase();
        const rawTaf = String(tafData[i][1] || "").trim();
        const timestamp = tafData[i][2] ? Utilities.formatDate(new Date(tafData[i][2]), Session.getScriptTimeZone(), "HH:mm") : "---";
        if (icao) tafMap[icao] = { raw: rawTaf, time: timestamp };
      }
    }
    
    const flights = fltData
      .map((row, index) => {
        const depApt = String(row[1] || "").trim().toUpperCase();
        const arrApt = String(row[2] || "").trim().toUpperCase();
        const altApt = String(row[6] || "").trim().toUpperCase();
        
        const getTaf = (icao) => tafMap[icao] || { raw: "No TAF data in database", time: "---" };
        const d = getTaf(depApt);
        const a = getTaf(arrApt);
        const alt = getTaf(altApt);

        return {
          rowIdx: index + 2, 
          flightNo: row[0],
          depApt: depApt,
          arrApt: arrApt,
          std: row[3],
          sta: row[4],
          altApt: altApt,
          tafDep: d.raw,
          tafDepTime: d.time,
          tafArr: a.raw,
          tafArrTime: a.time,
          tafAlt: alt.raw,
          tafAltTime: alt.time
        };
      })
      .filter(f => f.flightNo.trim() !== "" && f.depApt.trim() !== "");

    return JSON.stringify(flights);
  } catch (e) {
    return JSON.stringify({ error: e.message });
  }
}
