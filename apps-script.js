function doPost(e) {
  var data = JSON.parse(e.postData.contents);
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var scriptUrl = ScriptApp.getService().getUrl();

  if (data.type === 'order') {
    var sheet = ss.getSheetByName('Orders');
    var itemSheet = ss.getSheetByName('Order Items');
    var orderId = 'NOV-' + Date.now().toString(36).toUpperCase();
    var row = sheet.getLastRow() + 1;
    var viewUrl = scriptUrl + '?view=' + row + '&tab=orders';

    sheet.appendRow([
      data._timestamp,
      data.name,
      data.phone,
      data.prop,
      data.code,
      data.dates,
      data.checkinTime,
      data.allergies || (data.allergyNone ? 'None' : ''),
      data.sub,
      data.extra,
      orderId,
      viewUrl
    ]);

    var items = data.items || [];
    for (var i = 0; i < items.length; i++) {
      var it = items[i];
      itemSheet.appendRow([
        orderId,
        data.name,
        it.item,
        it.brand === 'any' ? 'Any / no preference' : it.brand,
        it.qty,
        it.size,
        it.sub === 'default' ? data.sub + ' (default)' : it.sub,
        it.note
      ]);
    }

    return ContentService.createTextOutput(JSON.stringify({result:'success', viewUrl:viewUrl})).setMimeType(ContentService.MimeType.JSON);
  }

  if (data.type === 'contact') {
    var sheet2 = ss.getSheetByName('Contacts');
    var row2 = sheet2.getLastRow() + 1;
    var viewUrl2 = scriptUrl + '?view=' + row2 + '&tab=contacts';
    sheet2.appendRow([
      data._timestamp,
      data.name,
      data.email,
      data.phone,
      data.contactType,
      data.message,
      viewUrl2
    ]);
    return ContentService.createTextOutput(JSON.stringify({result:'success', viewUrl:viewUrl2})).setMimeType(ContentService.MimeType.JSON);
  }

  return ContentService.createTextOutput('ok');
}

function doGet(e) {
  // Lookup order by ID
  if (e.parameter.orderId) {
    var oid = e.parameter.orderId;
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var oSheet = ss.getSheetByName('Orders');
    var oData = oSheet.getDataRange().getValues();
    var orderRow = null;

    for (var i = 1; i < oData.length; i++) {
      if (oData[i][10] === oid) {
        orderRow = oData[i];
        break;
      }
    }

    if (!orderRow) {
      return ContentService.createTextOutput(JSON.stringify({error:'Order not found'})).setMimeType(ContentService.MimeType.JSON);
    }

    var iSheet = ss.getSheetByName('Order Items');
    var iData = iSheet.getDataRange().getValues();
    var items = [];
    for (var j = 1; j < iData.length; j++) {
      if (iData[j][0] === oid) {
        items.push({
          item: iData[j][2],
          brand: iData[j][3],
          qty: iData[j][4],
          size: iData[j][5],
          sub: iData[j][6],
          note: iData[j][7] || ''
        });
      }
    }

    var result = {
      orderId: oid,
      name: orderRow[1],
      phone: orderRow[2],
      property: orderRow[3],
      code: orderRow[4],
      checkin: orderRow[5],
      checkinTime: orderRow[6],
      allergies: orderRow[7],
      subRule: orderRow[8],
      notes: orderRow[9],
      items: items
    };

    return ContentService.createTextOutput(JSON.stringify(result)).setMimeType(ContentService.MimeType.JSON);
  }

  // View receipt page
  if (e.parameter.view) {
    var row = parseInt(e.parameter.view);
    var tab = e.parameter.tab || 'orders';
    var ss = SpreadsheetApp.getActiveSpreadsheet();

    if (tab === 'contacts') {
      var cSheet = ss.getSheetByName('Contacts');
      var cHeaders = cSheet.getRange(1, 1, 1, cSheet.getLastColumn()).getValues()[0];
      var cValues = cSheet.getRange(row, 1, 1, cSheet.getLastColumn()).getValues()[0];

      var cHtml = buildHead('Contact submission');
      cHtml += '<div class="ts">' + (cValues[0] || '') + '</div>';
      for (var ci = 0; ci < cHeaders.length; ci++) {
        if (cHeaders[ci] === 'View URL') continue;
        cHtml += '<div class="field"><div class="label">' + cHeaders[ci] + '</div><div class="val">' + (cValues[ci] || '-') + '</div></div>';
      }
      cHtml += buildFoot();
      return HtmlService.createHtmlOutput(cHtml).setTitle('Contact: ' + (cValues[1] || ''));
    }

    var oSheet = ss.getSheetByName('Orders');
    var oValues = oSheet.getRange(row, 1, 1, oSheet.getLastColumn()).getValues()[0];
    var orderId = oValues[10];

    var iSheet = ss.getSheetByName('Order Items');
    var allItems = iSheet.getDataRange().getValues();
    var orderItems = [];
    for (var j = 1; j < allItems.length; j++) {
      if (allItems[j][0] === orderId) {
        orderItems.push(allItems[j]);
      }
    }

    var oHtml = buildHead('Order receipt');
    oHtml += '<div class="ts">' + (oValues[0] || '') + '  |  ' + orderId + '</div>';
    oHtml += '<div class="info">';
    oHtml += infoBox('Name', oValues[1]);
    oHtml += infoBox('Phone', oValues[2]);
    oHtml += infoBox('Address', oValues[3] || 'N/A');
    oHtml += infoBox('Partner Code', oValues[4] || 'None');
    oHtml += infoBox('Check-in', oValues[5] + ' at ' + oValues[6]);
    oHtml += infoBox('Allergies', oValues[7] || 'N/A');
    oHtml += infoBox('Default Sub Rule', oValues[8]);
    oHtml += infoBox('Notes', oValues[9] || 'None');
    oHtml += '</div>';

    oHtml += '<h2 style="font-size:16px;font-weight:600;letter-spacing:.15em;text-transform:uppercase;color:#857f96;margin:32px 0 16px">Items (' + orderItems.length + ')</h2>';

    for (var k = 0; k < orderItems.length; k++) {
      var item = orderItems[k];
      oHtml += '<div class="item">';
      oHtml += '<div class="item-top">';
      oHtml += '<span class="item-qty">' + item[4] + 'x</span>';
      oHtml += '<span class="item-name">' + item[2] + '</span>';
      oHtml += '</div>';
      oHtml += '<div class="item-details">';
      oHtml += '<span>Brand: ' + (item[3] || '-') + '</span>';
      oHtml += '<span>Size: ' + (item[5] || '-') + '</span>';
      oHtml += '<span>If unavailable: ' + (item[6] || '-') + '</span>';
      if (item[7]) {
        oHtml += '<span>Notes: ' + item[7] + '</span>';
      }
      oHtml += '</div>';
      oHtml += '</div>';
    }

    oHtml += buildFoot();
    return HtmlService.createHtmlOutput(oHtml).setTitle('Order: ' + (oValues[1] || '') + ' - ' + orderId);
  }

  return HtmlService.createHtmlOutput('<p>No parameters provided.</p>');
}

function buildHead(title) {
  var h = '<!DOCTYPE html><html><head><meta charset="utf-8">';
  h += '<meta name="viewport" content="width=device-width,initial-scale=1">';
  h += '<style>';
  h += 'body{margin:0;padding:40px;background:#060611;color:#efeaf2;font-family:-apple-system,sans-serif;line-height:1.6}';
  h += '.wrap{max-width:640px;margin:0 auto}';
  h += '.logo{font-size:18px;font-weight:600;letter-spacing:.4em;text-transform:uppercase;color:#efeaf2;margin-bottom:32px}.logo span{color:#e9c98a}';
  h += 'h1{font-size:24px;font-weight:300;margin-bottom:4px}h1 em{font-style:italic;color:#fff3d6}';
  h += '.ts{font-size:12px;color:#857f96;margin-bottom:32px;letter-spacing:.08em}';
  h += '.info{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:24px}';
  h += '.info div{padding:14px;background:rgba(255,255,255,.03);border:1px solid rgba(243,236,221,.08);border-radius:10px}';
  h += '.info .label{font-size:10px;letter-spacing:.2em;text-transform:uppercase;color:#857f96;margin-bottom:4px}';
  h += '.info .val{color:#efeaf2;font-size:15px}';
  h += '.field{border-bottom:1px solid #1a1d3a;padding:16px 0}';
  h += '.field .label{font-size:10px;letter-spacing:.2em;text-transform:uppercase;color:#857f96;margin-bottom:4px}';
  h += '.field .val{color:#efeaf2;font-size:15px}';
  h += '.item{border:1px solid rgba(233,201,138,.3);border-radius:12px;padding:16px;margin-bottom:10px;background:rgba(233,201,138,.04)}';
  h += '.item-top{display:flex;align-items:baseline;gap:12px;margin-bottom:8px}';
  h += '.item-qty{font-size:18px;font-weight:700;color:#e9c98a}';
  h += '.item-name{font-size:17px;font-weight:500;color:#fff3d6}';
  h += '.item-details{display:flex;flex-direction:column;gap:4px}';
  h += '.item-details span{font-size:13px;color:#c2bcd4}';
  h += '.foot{font-size:12px;color:#857f96;border-top:1px solid #1a1d3a;padding-top:20px;margin-top:32px}';
  h += '</style></head><body><div class="wrap">';
  h += '<div class="logo">NOVA<span>.</span></div>';
  var displayTitle = title.replace('receipt', '<em>receipt</em>').replace('submission', '<em>submission</em>');
  h += '<h1>' + displayTitle + '</h1>';
  return h;
}

function infoBox(label, value) {
  return '<div><div class="label">' + label + '</div><div class="val">' + (value || '-') + '</div></div>';
}

function buildFoot() {
  return '<div class="foot">Nova Concierge | novaconcierge.co | This is a record of your submission, not a confirmed order.</div></div></body></html>';
}
