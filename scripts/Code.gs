// HandLoans — Google Apps Script Web App
// Sheet: Loans  (A:ID, B:Person Name, C:Direction, D:Amount, E:Date, F:Status, G:Reason, H:Phone Number)
// Sheet: Repayments  (A:ID, B:Loan ID, C:Amount, D:Date, E:Note, F:Comment)
//
// Deploy → New Deployment → Web App → Execute as: Me → Access: Anyone

var SPREADSHEET_ID = "17TJV0lfqcZn_n1omLFrh_LsJx1dLusXoVWJHpb8GiAo";
var LOANS_SHEET    = "Loans";
var REP_SHEET      = "Repayments";

// ─── Router ──────────────────────────────────────────────────────────────────

function doGet(e) {
  var action = e.parameter.action;
  try {
    if (action === "getLoans")       return json(getLoans());
    if (action === "getRepayments")  return json(getRepayments());
    return json({ error: "Unknown action: " + action });
  } catch (err) {
    return json({ error: err.message });
  }
}

function doPost(e) {
  var action  = e.parameter.action;
  var payload = JSON.parse(e.postData.contents);
  try {
    if (action === "addLoan")       return json(addLoan(payload));
    if (action === "addRepayment")  return json(addRepayment(payload));
    if (action === "updateStatus")  return json(updateStatus(payload));
    return json({ error: "Unknown action: " + action });
  } catch (err) {
    return json({ error: err.message });
  }
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function json(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

function getSheet(name) {
  return SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(name);
}

function sheetToObjects(sheet) {
  var rows = sheet.getDataRange().getValues();
  if (rows.length < 2) return [];
  var headers = rows[0];
  return rows.slice(1).map(function(row) {
    var obj = {};
    headers.forEach(function(h, i) { obj[h] = row[i]; });
    return obj;
  });
}

function generateId(sheet, prefix) {
  var rows = sheet.getDataRange().getValues().slice(1);
  var nums = rows
    .map(function(r) { return r[0]; })
    .filter(function(id) { return String(id).startsWith(prefix); })
    .map(function(id) { return parseInt(String(id).slice(prefix.length), 10); })
    .filter(function(n) { return !isNaN(n); });
  var next = nums.length > 0 ? Math.max.apply(null, nums) + 1 : 1;
  return prefix + String(next).padStart(3, "0");
}

function today() {
  var d = new Date();
  var dd = String(d.getDate()).padStart(2, "0");
  var mm = String(d.getMonth() + 1).padStart(2, "0");
  var yyyy = d.getFullYear();
  return dd + "/" + mm + "/" + yyyy;
}

// ─── Loans ───────────────────────────────────────────────────────────────────

function getLoans() {
  var rows = sheetToObjects(getSheet(LOANS_SHEET));
  return rows.map(function(r) {
    return {
      id:          r["ID"],
      personName:  r["Person Name"],
      direction:   r["Direction"],
      amount:      Number(r["Amount"]),
      date:        r["Date"],
      status:      r["Status"],
      reason:      r["Reason"],
      phoneNumber: r["Phone Number"]
    };
  });
}

function addLoan(p) {
  var sheet = getSheet(LOANS_SHEET);
  var id = generateId(sheet, "L");
  sheet.appendRow([
    id,
    p.personName,
    p.direction,
    p.amount,
    p.date || today(),
    "active",
    p.reason || "",
    p.phoneNumber || ""
  ]);
  return { id: id };
}

function updateStatus(p) {
  var sheet = getSheet(LOANS_SHEET);
  var data  = sheet.getDataRange().getValues();
  for (var i = 1; i < data.length; i++) {
    if (String(data[i][0]) === String(p.loanId)) {
      sheet.getRange(i + 1, 6).setValue(p.status); // column F = Status
      return { success: true };
    }
  }
  return { error: "Loan not found: " + p.loanId };
}

// ─── Repayments ──────────────────────────────────────────────────────────────

function getRepayments() {
  var rows = sheetToObjects(getSheet(REP_SHEET));
  return rows.map(function(r) {
    return {
      id:      r["ID"],
      loanId:  r["Loan ID"],
      amount:  Number(r["Amount"]),
      date:    r["Date"],
      note:    r["Note"],
      comment: r["Comment"]
    };
  });
}

function addRepayment(p) {
  var sheet = getSheet(REP_SHEET);
  var id    = generateId(sheet, "R");
  sheet.appendRow([
    id,
    p.loanId,
    p.amount,
    p.date || today(),
    p.note    || "",
    p.comment || ""
  ]);

  // Auto-settle loan if remaining balance reaches zero
  autoSettleIfPaid(p.loanId);

  return { id: id };
}

function autoSettleIfPaid(loanId) {
  var loans = getLoans();
  var loan  = loans.filter(function(l) { return l.id === loanId; })[0];
  if (!loan || loan.status === "settled") return;

  var reps = getRepayments().filter(function(r) { return r.loanId === loanId; });
  var paid = reps.reduce(function(s, r) { return s + r.amount; }, 0);

  if (paid >= loan.amount) {
    updateStatus({ loanId: loanId, status: "settled" });
  }
}
