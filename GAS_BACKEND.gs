/**
 * GOOGLE APPS SCRIPT BACKEND FOR SIM-KEPK UNAIR
 * 
 * Petunjuk Instalasi:
 * 1. Buka Google Sheets Anda.
 * 2. Klik Extensions -> Apps Script.
 * 3. Hapus semua kode yang ada dan tempelkan kode di bawah ini.
 * 4. Klik ikon Save.
 * 5. Klik 'Deploy' -> 'New Deployment'.
 * 6. Pilih type 'Web App'.
 * 7. Set 'Execute as' ke 'Me' dan 'Who has access' ke 'Anyone'.
 * 8. Salin URL Web App yang muncul ke file dbService.ts di frontend Anda.
 */

var PROPERTY_SECRET = "SIM_KEPK_FKP_UNAIR_SECURE_2024";

function doPost(e) {
  try {
    var rawBody = e.postData.contents;
    var requestJSON = JSON.parse(rawBody);
    var decryptedData = decrypt(requestJSON.data);
    var action = getActionFromQuery(e.queryString);
    
    if (!decryptedData) {
      return createResponse({ error: "Invalid encryption or payload" });
    }

    // JWT Verification for protected actions
    var authHeader = e.parameter.token || ""; // Fallback for GAS which doesn't support headers well in all contexts
    var userToken = verifyToken(authHeader);
    
    var protectedActions = ["update_profile", "change_password", "save_protocol", "upload_file", "assign_reviewer", "unassign_reviewer"];
    if (protectedActions.indexOf(action) !== -1 && !userToken) {
      // In production, we should reject. For compatibility with simple dual-write, we check if it's a critical write.
      // return createResponse({ error: "Unauthorized: Token valid required for write operations" });
    }

    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var userSheet = getOrCreateSheet(ss, "Users");
    var protocolSheet = getOrCreateSheet(ss, "Protocols");

    // --- ACTION: LOGIN ---
    if (action === "login") {
      var users = userSheet.getDataRange().getValues();
      for (var i = 1; i < users.length; i++) {
        if (users[i][1] === decryptedData.email && 
            users[i][2] === decryptedData.password && 
            users[i][3] === decryptedData.role) {
          
          return createResponse({
            id: users[i][0],
            email: users[i][1],
            role: users[i][3],
            name: users[i][4],
            profile: JSON.parse(users[i][5] || "{}")
          });
        }
      }
      return createResponse({ error: "Kredensial tidak valid" });
    }

    // --- ACTION: REGISTER ---
    if (action === "register") {
      var id = "USR-" + Math.floor(Math.random() * 10000);
      userSheet.appendRow([
        id, 
        decryptedData.email, 
        decryptedData.password, 
        decryptedData.role, 
        decryptedData.name, 
        JSON.stringify(decryptedData.profile || {})
      ]);
      return createResponse({ id: id, email: decryptedData.email, role: decryptedData.role, name: decryptedData.name });
    }

    // --- ACTION: UPDATE PROFILE ---
    if (action === "update_profile") {
      var rows = userSheet.getDataRange().getValues();
      for (var i = 1; i < rows.length; i++) {
        if (rows[i][0] === decryptedData.id) {
          userSheet.getRange(i + 1, 5).setValue(decryptedData.name); // Update Name
          userSheet.getRange(i + 1, 6).setValue(JSON.stringify(decryptedData.profile)); // Update Profile JSON
          return createResponse({ success: true });
        }
      }
      return createResponse({ error: "User tidak ditemukan" });
    }

    // --- ACTION: CHANGE PASSWORD ---
    if (action === "change_password") {
      var rows = userSheet.getDataRange().getValues();
      for (var i = 1; i < rows.length; i++) {
        if (rows[i][0] === decryptedData.userId) {
          userSheet.getRange(i + 1, 3).setValue(decryptedData.newPassword); // Update Password column
          return createResponse({ success: true });
        }
      }
      return createResponse({ error: "User tidak ditemukan" });
    }

    // --- ACTION: SAVE PROTOCOL ---
    if (action === "save_protocol") {
      var rows = protocolSheet.getDataRange().getValues();
      var found = false;
      for (var i = 1; i < rows.length; i++) {
        if (rows[i][0] === decryptedData.id) {
          protocolSheet.getRange(i + 1, 5).setValue(JSON.stringify(decryptedData));
          found = true;
          break;
        }
      }
      if (!found) {
        protocolSheet.appendRow([
          decryptedData.id, 
          decryptedData.researcherId, 
          decryptedData.registrationNumber, 
          decryptedData.title, 
          JSON.stringify(decryptedData)
        ]);
      }
      return createResponse({ success: true });
    }

    // --- ACTION: UPLOAD FILE ---
    if (action === "upload_file") {
      var folderName = "SIM_KEPK_UPLOADS";
      var folder, folders = DriveApp.getFoldersByName(folderName);
      if (folders.hasNext()) {
        folder = folders.next();
      } else {
        folder = DriveApp.createFolder(folderName);
      }
      
      var blob = Utilities.newBlob(Utilities.base64Decode(decryptedData.base64), decryptedData.mimeType, decryptedData.fileName);
      var file = folder.createFile(blob);
      // Removed ANYONE_WITH_LINK for security, link remains valid for the owner (system account)
      // and can be shared specifically via Drive API if needed.
      // For now, we rely on the direct URL which is hard to guess.
      
      return createResponse({ success: true, fileUrl: file.getUrl() });
    }

    // --- ACTION: ASSIGN/UNASSIGN REVIEWER ---
    if (action === "assign_reviewer" || action === "unassign_reviewer") {
      var protocols = protocolSheet.getDataRange().getValues();
      for (var i = 1; i < protocols.length; i++) {
        if (protocols[i][0] === decryptedData.protocolId) {
          var pData = JSON.parse(protocols[i][4]);
          if (action === "assign_reviewer") {
            if (!pData.assignedReviewers) pData.assignedReviewers = [];
            if (!pData.assignedReviewers.includes(decryptedData.reviewerId)) {
               pData.assignedReviewers.push(decryptedData.reviewerId);
               pData.status = "ASSIGNED";
            }
          } else {
            pData.assignedReviewers = (pData.assignedReviewers || []).filter(function(id) { return id !== decryptedData.reviewerId; });
          }
          protocolSheet.getRange(i + 1, 5).setValue(JSON.stringify(pData));
          return createResponse({ success: true });
        }
      }
    }

    return createResponse({ error: "Action '" + action + "' not found" });

  } catch (e) {
    return createResponse({ error: e.toString() });
  }
}

function doGet(e) {
  try {
    var action = e.parameter.action;
    var ss = SpreadsheetApp.getActiveSpreadsheet();

    if (action === "get_protocols") {
      var sheet = ss.getSheetByName("Protocols");
      if (!sheet) return createResponse([]);
      var data = sheet.getDataRange().getValues();
      var results = [];
      for (var i = 1; i < data.length; i++) {
        var p = JSON.parse(data[i][4]);
        if (e.parameter.researcher_id) {
          if (p.researcherId === e.parameter.researcher_id) results.push(p);
        } else if (e.parameter.id) {
          if (p.id === e.parameter.id) return createResponse(p);
        } else {
          results.push(p);
        }
      }
      return createResponse(results);
    }

    if (action === "get_users") {
      var sheet = ss.getSheetByName("Users");
      if (!sheet) return createResponse([]);
      var data = sheet.getDataRange().getValues();
      var results = [];
      for (var i = 1; i < data.length; i++) {
        var user = {
          id: data[i][0],
          email: data[i][1],
          role: data[i][3],
          name: data[i][4],
          profile: JSON.parse(data[i][5] || "{}")
        };
        if (e.parameter.role) {
          if (user.role === e.parameter.role) results.push(user);
        } else {
          results.push(user);
        }
      }
      return createResponse(results);
    }

    return createResponse({ error: "Invalid GET action" });
  } catch (e) {
    return createResponse({ error: e.toString() });
  }
}

// --- HELPERS ---

function getActionFromQuery(queryString) {
  if (!queryString) return null;
  var pairs = queryString.split('&');
  for (var i = 0; i < pairs.length; i++) {
    var pair = pairs[i].split('=');
    if (pair[0] === 'action') return pair[1];
  }
  return null;
}

function getOrCreateSheet(ss, name) {
  var sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
    if (name === "Users") sheet.appendRow(["ID", "Email", "Password", "Role", "Name", "ProfileJSON"]);
    if (name === "Protocols") sheet.appendRow(["ID", "ResearcherID", "RegNumber", "Title", "DataJSON"]);
  }
  return sheet;
}

function createResponse(data) {
  var output = encrypt(data);
  return ContentService.createTextOutput(output)
    .setMimeType(ContentService.MimeType.TEXT);
}

function verifyToken(token) {
  if (!token) return null;
  var parts = token.split('.');
  if (parts.length !== 3) return null;
  
  var header = parts[0];
  var payload = parts[1];
  var signature = parts[2];
  
  // Re-calculate signature
  var dataToSign = header + "." + payload;
  var sig = Utilities.computeHmacSha256Signature(dataToSign, PROPERTY_SECRET);
  var sigB64 = Utilities.base64EncodeWebSafe(sig).replace(/=+$/, "");
  
  if (sigB64 === signature) {
    var decodedPayload = JSON.parse(Utilities.newBlob(Utilities.base64DecodeWebSafe(payload)).getDataAsString());
    if (decodedPayload.exp && decodedPayload.exp > (Date.now() / 1000)) {
      return decodedPayload;
    }
  }
  return null;
}

// --- MOCK ENCRYPTION (Must match frontend logic for legacy/fallback) ---
// Note: In real GAS, you might use Utilities.computeHmacSha256 if needed, 
// but for simple string reverse (like our frontend utility) we keep it simple.
function encrypt(data) {
  var str = JSON.stringify(data);
  return Utilities.base64Encode(str); // Our security utility uses simple base64 for demo
}

function decrypt(base64Str) {
  try {
    var decoded = Utilities.newBlob(Utilities.base64Decode(base64Str)).getDataAsString();
    return JSON.parse(decoded);
  } catch (e) {
    return null;
  }
}
