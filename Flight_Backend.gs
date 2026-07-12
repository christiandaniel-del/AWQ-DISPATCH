/**
 * Retrieve flight data, Aircraft (A/C) Registration list, and Route List.
 */
function getFlightDashboardData() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  
  // 1. Fetch Aircraft List (A/C)
  let acList = [];
  const acSheet = ss.getSheetByName('A/C');
  if (acSheet) {
    const lastRow = acSheet.getLastRow();
    if (lastRow > 1) {
      const acData = acSheet.getRange(2, 2, lastRow - 1, 1).getValues();
      acList = acData.map(r => r[0]).filter(String); 
    }
  }
  
  // 2. Fetch and Group Route Data
  const routeSheet = ss.getSheetByName('Route');
  const routeMap = {}; // Key: DEP+ARR, Value: Array of routes
  if (routeSheet) {
    const lastRow = routeSheet.getLastRow();
    if (lastRow > 1) {
      const routeData = routeSheet.getRange(2, 1, lastRow - 1, 9).getValues();
      routeData.forEach(r => {
        if (r[0] && r[1] && r[2]) {
          const key = r[1] + r[2];
          if (!routeMap[key]) routeMap[key] = [];
          routeMap[key].push({
            ID: r[0],
            DEP_AIRPORT: r[1],
            ARR_AIRPORT: r[2],
            DEP_RWY: String(r[3]),
            SID: r[4],
            WAYPOINT_SEQ: r[5],
            STAR: r[6],
            ARR_RWY: String(r[7]),
            ROUTE_STRING: r[8]
          });
        }
      });
      
      // Pre-sort all route arrays in the map
      Object.keys(routeMap).forEach(key => {
        routeMap[key].sort((a, b) => {
           const suffixA = parseInt(String(a.ID).slice(-2)) || 99;
           const suffixB = parseInt(String(b.ID).slice(-2)) || 99;
           return suffixA - suffixB;
        });
      });
    }
  }
  
  // 3. Fetch Flight Info and Merge
  const fltSheet = ss.getSheetByName('FLT INFO');
  const lastRow = fltSheet.getLastRow();
  if (lastRow < 2) return { flights: [], acList: acList };

  // Use getDisplayValues for formatting consistency (times, dates)
  const data = fltSheet.getRange(1, 1, lastRow, 18).getDisplayValues();
  const flights = [];
  
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    if (!row[0]) continue; 
    
    const dep = row[1];
    const arr = row[2];
    const routeKey = dep + arr;
    const matchingRoutes = routeMap[routeKey] || [];
    
    flights.push({
      rowIdx: i + 1,        
      FLIGHT: row[0], 
      DEP: dep, 
      ARR: arr, 
      STD: row[3], 
      STA: row[4], 
      REG: row[5], 
      ALT: row[6], 
      TAF_DEP: row[7], 
      TAF_ARR: row[8], 
      CGO: row[12],         
      ENR1: row[9],         
      ENR2: row[10],        
      ENR3: row[11],        
      ATC: row[13],         
      REMARK: row[14],      
      DOF: row[15],         
      ACTIVE_ROUTE_ID: row[16],
      ROUTES: matchingRoutes 
    });
  }
  
  return { flights: flights, acList: acList };
}

/**
 * Save inline-cell editing from ACTIVE FLIGHTS dashboard
 */
function saveFlightEdit(rowIdx, colIndex, value) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('FLT INFO');
  if (!sheet) {
    throw new Error("Sheet 'FLT INFO' not found.");
  }
  if (!Number.isInteger(rowIdx) || rowIdx < 2 || !Number.isInteger(colIndex) || colIndex < 1) {
    throw new Error("Invalid row or column index provided.");
  }
  sheet.getRange(rowIdx, colIndex).setValue(value);
  return "OK";
}

/**
 * Accept [ADD NEW FLIGHT] form and inject to Spreadsheet Database
 */
function addNewFlightToDb(formData) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('FLT INFO');
  if (!sheet) {
    throw new Error("Sheet 'FLT INFO' not found.");
  }
  const newRow = new Array(17).fill(""); // Updated to 17 columns
  
  let dofFormatted = formData.DOF ? formData.DOF.replace(/-/g, '') : '';
  let atcValue = (formData.ATC === '1') ? '🔴' : '0';

  newRow[0] = formData.FLT_NO || "";      
  newRow[1] = formData.DEP || "";         
  newRow[2] = formData.ARR || "";
  newRow[3] = formData.STD || "";         
  newRow[4] = formData.STA || "";
  newRow[5] = formData.REG || "";         
  newRow[6] = formData.ALT || "";
  newRow[7] = formData.TAF_DEP || "3"; 
  newRow[8] = formData.TAF_ARR || "5";
  newRow[9] = formData.ENR1 || "";  
  newRow[10] = formData.ENR2 || ""; 
  newRow[11] = formData.ENR3 || ""; 
  newRow[12] = formData.CGO || "";   // Column 13: CGO
  newRow[13] = atcValue;            
  newRow[14] = formData.REMARK || "";
  newRow[15] = dofFormatted;        
  newRow[16] = ""; // Active Route defaults to empty

  sheet.appendRow(newRow);
  return getFlightDashboardData();
}

/**
 * Sync CGO data from external Cargo Manifest spreadsheet
 */
function syncCgoData() {
  const sourceSsId = '1jHGaWQB5PtzkmVKwb7k_a1nPTZoUhcJjn7NnKWaw-Qg';
  const sourceSs = SpreadsheetApp.openById(sourceSsId);
  const sourceSheet = sourceSs.getSheets()[0]; // Assume first sheet
  const sourceData = sourceSheet.getDataRange().getValues(); // Use raw values for math/logic
  
  // Build lookup map from Source: Col A (Flt No), Col G (Confirmed), Col H (Revise)
  const cargoMap = {};
  for (let i = 1; i < sourceData.length; i++) {
    const row = sourceData[i];
    const rawFltNo = String(row[0]).trim();
    if (!rawFltNo) continue;
    
    // Extract numeric part (e.g., QZ534 -> 534)
    const fltNum = rawFltNo.replace(/^[A-Za-z]+/, ''); 
    if (!fltNum) continue;

    const confirmed = row[6];
    const revise = row[7];
    const finalWeight = (revise !== "" && revise !== null) ? revise : confirmed;
    
    if (finalWeight !== "" && finalWeight !== null) {
      cargoMap[fltNum] = finalWeight;
    }
  }
  
  // Update local MISSION_DB (Sheet: FLT INFO, Column 13)
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const fltSheet = ss.getSheetByName('FLT INFO');
  const lastRow = fltSheet.getLastRow();
  if (lastRow < 2) return getFlightDashboardData();
  
  const fltData = fltSheet.getRange(2, 1, lastRow - 1, 1).getValues(); // Get Flight Numbers
  const updates = [];
  
  for (let i = 0; i < fltData.length; i++) {
    const localFltRaw = String(fltData[i][0]).trim();
    const localFltNum = localFltRaw.replace(/^[A-Za-z]+/, '');
    
    if (localFltNum && cargoMap[localFltNum] !== undefined) {
      // row is i+2, column is 13
      fltSheet.getRange(i + 2, 13).setValue(cargoMap[localFltNum]);
      updates.push(localFltRaw);
    }
  }
  
  console.log(`[CGO SYNC] Updated ${updates.length} flights: ${updates.join(', ')}`);
  return getFlightDashboardData();
}

/**
 * Bulk update Date of Flight (DOF)
 */
function bulkUpdateFlightDof(rowIndices, newDof) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('FLT INFO');
  if (!sheet) {
    throw new Error("Sheet 'FLT INFO' not found.");
  }
  if (!Array.isArray(rowIndices) || rowIndices.length === 0) {
    throw new Error("Invalid flight row indices provided.");
  }

  let dofFormatted = String(newDof || '').replace(/-/g, '');
  rowIndices.forEach(rowIdx => {
    if (!Number.isInteger(rowIdx) || rowIdx < 2) return;
    sheet.getRange(rowIdx, 16).setValue(dofFormatted);
  });
  
  return getFlightDashboardData();
}

/**
 * Save ENR 1, ENR 2, and ENR 3
 */
function saveFlightEnr(rowIdx, enr1, enr2, enr3) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('FLT INFO');
  if (!sheet) {
    throw new Error("Sheet 'FLT INFO' not found.");
  }
  if (!Number.isInteger(rowIdx) || rowIdx < 2) {
    throw new Error("Invalid row index provided for ENR update.");
  }
  sheet.getRange(rowIdx, 10, 1, 3).setValues([[enr1 || "", enr2 || "", enr3 || ""]]);
  return "OK";
}

/**
 * Update or Add Route Data from UI Modal
 */
/**
 * Fetch all routes from the 'Route' sheet.
 */
function getAllRoutes() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const routeSheet = ss.getSheetByName('Route');
  if (!routeSheet) return [];
  
  const lastRow = routeSheet.getLastRow();
  if (lastRow < 2) return [];
  
  const data = routeSheet.getRange(2, 1, lastRow - 1, 9).getValues();
  return data.map(r => ({
    ID: r[0],
    DEP_AIRPORT: r[1],
    ARR_AIRPORT: r[2],
    DEP_RWY: String(r[3]),
    SID: r[4],
    WAYPOINT_SEQ: r[5],
    STAR: r[6],
    ARR_RWY: String(r[7]),
    ROUTE_STRING: r[8]
  }));
}

/**
 * Delete a specific route by its ID.
 */
function deleteRoute(routeId) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const routeSheet = ss.getSheetByName('Route');
  const data = routeSheet.getRange(1, 1, routeSheet.getLastRow(), 1).getValues();
  
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][0]) === String(routeId)) {
      routeSheet.deleteRow(i + 1);
      break;
    }
  }
  return getAllRoutes();
}

/**
 * Update or Add Route Data from UI Modal.
 * Returns both flight data (for board) and all routes (for manager).
 */
function saveFlightRoute(routeObj) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const routeSheet = ss.getSheetByName('Route');
  const data = routeSheet.getRange(1, 1, routeSheet.getLastRow(), 1).getValues();
  
  let targetRow = -1;
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][0]) === String(routeObj.ID)) {
      targetRow = i + 1;
      break;
    }
  }
  
  const newRouteString = `${routeObj.DEP_AIRPORT} RWY-${routeObj.DEP_RWY} ${routeObj.SID} ${routeObj.WAYPOINT_SEQ} ${routeObj.STAR} RWY-${routeObj.ARR_RWY} ${routeObj.ARR_AIRPORT}`;
  
  if (targetRow !== -1) {
    routeSheet.getRange(targetRow, 1, 1, 9).setValues([[
      routeObj.ID, routeObj.DEP_AIRPORT, routeObj.ARR_AIRPORT,
      routeObj.DEP_RWY, routeObj.SID, routeObj.WAYPOINT_SEQ, routeObj.STAR, routeObj.ARR_RWY, newRouteString
    ]]);
  } else {
    routeSheet.appendRow([
      routeObj.ID, routeObj.DEP_AIRPORT, routeObj.ARR_AIRPORT, routeObj.DEP_RWY,
      routeObj.SID, routeObj.WAYPOINT_SEQ, routeObj.STAR, routeObj.ARR_RWY, newRouteString
    ]);
  }
  
  return {
    dashboardData: getFlightDashboardData(),
    allRoutes: getAllRoutes()
  };
}

/**
 * NEW: Set a specific route ID as ACTIVE for a flight row
 */
function setActiveFlightRoute(rowIdx, routeId) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('FLT INFO');
  if (!sheet) {
    throw new Error("Sheet 'FLT INFO' not found.");
  }
  if (!Number.isInteger(rowIdx) || rowIdx < 2) {
    throw new Error("Invalid row index provided for active route selection.");
  }
  sheet.getRange(rowIdx, 17).setValue(routeId || ""); 
  return getFlightDashboardData();
}

// =========================================================
// AIRPORT NOTES BACKEND LOGIC
// =========================================================

/**
 * Fetch all airport notes from 'AIRPORT_NOTES' sheet
 */
function getAirportNotes() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName("AIRPORT_NOTES");
  
  // Auto-create sheet if it doesn't exist
  if (!sheet) {
    sheet = ss.insertSheet("AIRPORT_NOTES");
    sheet.appendRow(["ICAO_CODE", "DAY_RANGE", "START_TIME", "END_TIME", "NOTE_TEXT", "TYPE"]);
    return [];
  }
  
  const data = sheet.getDataRange().getDisplayValues();
  if (data.length <= 1) return [];
  
  const headers = data.shift();
  return data.map(row => ({
    ICAO_CODE: row[0].toUpperCase(),
    DAY_RANGE: row[1].toUpperCase(),
    START_TIME: row[2], 
    END_TIME: row[3],
    NOTE_TEXT: row[4],
    TYPE: row[5]
  }));
}

/**
 * Save updated notes for a specific ICAO code.
 */
function saveAirportNotes(icao, newNotes) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName("AIRPORT_NOTES");
  if (!sheet) return getAirportNotes();
  const data = sheet.getDataRange().getValues();
  const keepData = [data[0]]; // Retain headers

  // Filter out existing notes for this ICAO
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][0]).toUpperCase() !== icao.toUpperCase()) {
      keepData.push(data[i]);
    }
  }

  // Append new notes
  newNotes.forEach(note => {
    if (note.NOTE_TEXT.trim() !== "") {
      keepData.push([
        icao.toUpperCase(), 
        note.DAY_RANGE.toUpperCase(), 
        note.START_TIME, 
        note.END_TIME, 
        note.NOTE_TEXT, 
        note.TYPE
      ]);
    }
  });

  // Write back to sheet
  sheet.clearContents();
  if (keepData.length > 0) {
    sheet.getRange(1, 1, keepData.length, keepData[0].length).setValues(keepData);
  }

  return getAirportNotes();
}