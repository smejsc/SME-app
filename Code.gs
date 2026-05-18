/**
 * Seahorse Manager — Apps Script backend
 * v1.38.2: Support 2 keys ('data' and 'auth') stored in separate rows
 *
 * DEPLOY: Web App → Execute as: Me, Who has access: Anyone
 *
 * Sheet structure: tab "data" with 2 rows for the 2 keys
 *   A1: 'auth'   B1: <encrypted cfg auth JSON>   C1: <iso timestamp>
 *   A2: 'data'   B2: <encrypted state JSON>      C2: <iso timestamp>
 *
 * Legacy fallback: if request has no 'key' param → defaults to 'data'
 */

const SHEET_NAME = 'data';

function doGet(e){
  try{
    const action = (e.parameter.action || '').trim();
    const key    = (e.parameter.key || 'data').trim();  // backward-compat default
    if(action !== 'load') return jsonErr('Unknown action');
    const sheet  = getOrCreateSheet();
    const row    = findRowByKey(sheet, key);
    if(!row){
      return jsonOk({payload: null, key: key});
    }
    const payloadStr = sheet.getRange(row, 2).getValue() || '';
    if(!payloadStr) return jsonOk({payload: null, key: key});
    let payload;
    try{ payload = JSON.parse(payloadStr); }
    catch(parseErr){ return jsonErr('Sheet data corrupted: '+parseErr.message); }
    return jsonOk({payload: payload, key: key, updatedAt: sheet.getRange(row,3).getValue()});
  }catch(err){
    return jsonErr(err.message || String(err));
  }
}

function doPost(e){
  try{
    let body;
    try{ body = JSON.parse(e.postData.contents); }
    catch(parseErr){ return jsonErr('Invalid JSON body'); }
    const action  = (body.action || '').trim();
    const key     = (body.key || 'data').trim();  // backward-compat default
    const payload = body.payload;
    if(action !== 'save') return jsonErr('Unknown action');
    if(!payload || typeof payload !== 'object') return jsonErr('Missing payload');
    // Validate key whitelist
    if(['auth','data'].indexOf(key) === -1) return jsonErr('Invalid key (must be auth or data)');
    // Validate payload shape (must look like {iv, ct})
    if(!payload.iv || !payload.ct) return jsonErr('Payload missing iv/ct');
    const sheet = getOrCreateSheet();
    const row   = findRowByKey(sheet, key) || appendKeyRow(sheet, key);
    sheet.getRange(row, 2).setValue(JSON.stringify(payload));
    sheet.getRange(row, 3).setValue(new Date().toISOString());
    return jsonOk({saved: true, key: key});
  }catch(err){
    return jsonErr(err.message || String(err));
  }
}

/* ============ Helpers ============ */
function getOrCreateSheet(){
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_NAME);
  if(!sheet){
    sheet = ss.insertSheet(SHEET_NAME);
    sheet.getRange(1,1,1,3).setValues([['key','payload','updatedAt']]);
    sheet.setFrozenRows(1);
  }
  return sheet;
}

function findRowByKey(sheet, key){
  const lastRow = sheet.getLastRow();
  if(lastRow < 2) return null;
  const keys = sheet.getRange(2, 1, lastRow-1, 1).getValues();
  for(let i=0; i<keys.length; i++){
    if((keys[i][0]||'').toString().trim() === key){
      return i + 2;  // row number (1-indexed, header at row 1)
    }
  }
  return null;
}

function appendKeyRow(sheet, key){
  const newRow = sheet.getLastRow() + 1;
  sheet.getRange(newRow, 1).setValue(key);
  return newRow;
}

function jsonOk(obj){
  return ContentService.createTextOutput(JSON.stringify(Object.assign({ok:true}, obj)))
    .setMimeType(ContentService.MimeType.JSON);
}
function jsonErr(msg){
  return ContentService.createTextOutput(JSON.stringify({ok:false, error: String(msg||'Unknown error')}))
    .setMimeType(ContentService.MimeType.JSON);
}
