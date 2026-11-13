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

// Always returns date as "dd/MM/yyyy" string regardless of cell type
function formatDateValue(val) {
  if (!val) return "";
  try {
    if (val instanceof Date) {
      return Utilities.formatDate(val, Session.getScriptTimeZone(), "dd/MM/yyyy");
    }
    return String(val);
  } catch (e) {
    return String(val);
  }
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
  return Utilities.formatDate(d, Session.getScriptTimeZone(), "dd/MM/yyyy");
}

// ─── Loans ───────────────────────────────────────────────────────────────────

function getLoans() {
  var rows = getSheet(LOANS_SHEET).getDataRange().getValues();
  if (rows.length < 2) return [];
  // Map by column index so header names don't need to match exactly
  return rows.slice(1).map(function(row) {
    return {
      id:          String(row[0] || ""),
      personName:  String(row[1] || ""),
      direction:   String(row[2] || ""),
      amount:      Number(row[3]) || 0,
      date:        formatDateValue(row[4]),
      status:      String(row[5] || "active"),
      reason:      String(row[6] || ""),
      phoneNumber: String(row[7] || "")
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
  var rows = getSheet(REP_SHEET).getDataRange().getValues();
  if (rows.length < 2) return [];
  // Map by column index so header names don't need to match exactly
  return rows.slice(1).map(function(row) {
    return {
      id:      String(row[0] || ""),
      loanId:  String(row[1] || ""),
      amount:  Number(row[2]) || 0,
      date:    formatDateValue(row[3]),
      note:    String(row[4] || ""),
      comment: String(row[5] || "")
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

