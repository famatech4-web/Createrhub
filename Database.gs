function initializeCreatorHub() {
  const props = PropertiesService.getScriptProperties();
  let id = props.getProperty('SPREADSHEET_ID');
  let ss;
  if (id) {
    try { ss = SpreadsheetApp.openById(id); } catch (e) { ss = null; }
  }
  if (!ss) {
    ss = SpreadsheetApp.create('CreatorHub Database');
    props.setProperty('SPREADSHEET_ID', ss.getId());
  }
  Object.keys(CFG.SHEETS).forEach(name => {
    let sh = ss.getSheetByName(name);
    if (!sh) sh = ss.insertSheet(name);
    const headers = CFG.SHEETS[name];
    if (sh.getLastRow() === 0) sh.appendRow(headers);
    else {
      const current = sh.getRange(1,1,1,Math.max(sh.getLastColumn(), headers.length)).getValues()[0];
      if (headers.some((h,i) => current[i] !== h)) sh.getRange(1,1,1,headers.length).setValues([headers]);
    }
    sh.setFrozenRows(1);
  });
  const defaultSheet = ss.getSheetByName('Sheet1');
  if (defaultSheet && ss.getSheets().length > Object.keys(CFG.SHEETS).length) ss.deleteSheet(defaultSheet);
  return {ok:true, spreadsheetUrl:ss.getUrl(), spreadsheetId:ss.getId()};
}

function getDb_() {
  const id = PropertiesService.getScriptProperties().getProperty('SPREADSHEET_ID');
  if (!id) throw new Error('Database not initialized. Run initializeCreatorHub() first.');
  return SpreadsheetApp.openById(id);
}

function sheet_(name) {
  const sh = getDb_().getSheetByName(name);
  if (!sh) throw new Error('Missing database sheet: ' + name);
  return sh;
}

function rows_(name) {
  const sh = sheet_(name), values = sh.getDataRange().getValues();
  if (values.length < 2) return [];
  const headers = values[0];
  return values.slice(1).filter(r => r.some(v => v !== '')).map(r => {
    const o = {}; headers.forEach((h,i) => o[h] = r[i]); return o;
  });
}

function append_(name, obj) {
  const headers = CFG.SHEETS[name];
  sheet_(name).appendRow(headers.map(h => obj[h] === undefined ? '' : obj[h]));
}

function updateById_(name, idField, id, patch) {
  const sh = sheet_(name), vals = sh.getDataRange().getValues(), headers = vals[0];
  const idCol = headers.indexOf(idField);
  for (let r=1; r<vals.length; r++) {
    if (String(vals[r][idCol]) === String(id)) {
      Object.keys(patch).forEach(k => {
        const c = headers.indexOf(k); if (c >= 0) sh.getRange(r+1,c+1).setValue(patch[k]);
      });
      return true;
    }
  }
  return false;
}

function deleteById_(name, idField, id) {
  const sh = sheet_(name), vals = sh.getDataRange().getValues(), c = vals[0].indexOf(idField);
  for (let r=1; r<vals.length; r++) if (String(vals[r][c]) === String(id)) { sh.deleteRow(r+1); return true; }
  return false;
}
