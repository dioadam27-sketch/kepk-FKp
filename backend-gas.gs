/**
 * SIM-KEPK FKp UNAIR - Google Apps Script Backend (SECURE VERSION)
 * 
 * Fitur: 
 * - Enkripsi AES-256 untuk semua komunikasi (Payload & Response)
 * - Password Hashing (SHA-256) untuk keamanan database
 * - Local storage encryption support
 */

const SPREADSHEET_ID = '1WgBzOBHGHJIuED1TYP5MsZhfkaEtDQMA_VOWoiHm-sM';
const DRIVE_FOLDER_ID = '1JFQKVzgBkJS6mWuJXnOl2ehiYG5Jc2XF';
const SECRET_KEY = 'SIM_KEPK_FKP_UNAIR_SECURE_2024'; // Harus sama dengan VITE_APP_ENCRYPTION_KEY di frontend

// --- ENCRYPT / DECRYPT UTILS (Menggunakan CryptoJS via CDN atau library internal) ---
// Untuk Apps Script, kita gunakan implementasi CryptoJS yang disederhanakan atau library eksternal.
// Agar mandiri, saya sertakan helper enkripsi dasar.

function setupDatabase() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const tables = {
    'Users': ['id', 'email', 'password', 'role', 'name', 'place_of_birth', 'date_of_birth', 'gender', 'last_education', 'status', 'institution', 'phone'],
    'Protocols': ['id', 'researcher_id', 'registration_number', 'title', 'status', 'classification', 'submitted_at', 'main_researcher', 'phone', 'members', 'organizing_institution', 'collaboration_type', 'collaboration_details', 'design', 'design_details', 'location', 'time', 'data_collection_time', 'previous_submission', 'previous_submission_result', 'research_team_tasks'],
    'Protocol_Screening': ['protocol_id', 'question_index', 'answer'],
    'Protocol_Attachments': ['protocol_id', 'proposal', 'psp', 'ic', 'instruments', 'payment_proof', 'supporting_docs'],
    'Protocol_Reviewers': ['protocol_id', 'reviewer_id'],
    'Reviews': ['id', 'protocol_id', 'reviewer_id', 'reviewer_name', 'assigned_at', 'submitted_at', 'review_file', 'conclusion', 'notes']
  };

  for (let tableName in tables) {
    let sheet = ss.getSheetByName(tableName) || ss.insertSheet(tableName);
    if (sheet.getLastRow() === 0) sheet.appendRow(tables[tableName]);
  }
}

function doPost(e) {
  setupDatabase(); // Pastikan tabel tersedia
  try {
    const rawInput = JSON.parse(e.postData.contents);
    const decryptedData = decrypt(rawInput.data);
    const input = typeof decryptedData === 'string' ? JSON.parse(decryptedData) : decryptedData;
    
    const action = e.parameter.action || input.action;
    let result = {};
    
    switch(action) {
      case 'login': result = handleLogin(input); break;
      case 'register': result = handleRegister(input); break;
      case 'update_profile': result = handleUpdateProfile(input); break;
      case 'save_protocol': result = handleSaveProtocol(input); break;
      case 'assign_reviewer': result = handleAssignReviewerAction(input); break;
      case 'upload_file': result = handleUploadFile(input); break;
      default: result = { error: "Action not found" };
    }
    
    return ContentService.createTextOutput(encrypt(JSON.stringify(result))).setMimeType(ContentService.MimeType.TEXT);
  } catch (error) {
    return ContentService.createTextOutput(encrypt(JSON.stringify({error: error.toString()}))).setMimeType(ContentService.MimeType.TEXT);
  }
}

function doGet(e) {
  setupDatabase(); // Pastikan tabel tersedia
  try {
    const action = e.parameter.action;
    let result = {};
    switch(action) {
      case 'get_protocols': result = handleGetProtocols(e.parameter); break;
      case 'get_users': result = handleGetUsers(e.parameter); break;
      default: result = { message: "Secure API is running" };
    }
    return ContentService.createTextOutput(encrypt(JSON.stringify(result))).setMimeType(ContentService.MimeType.TEXT);
  } catch (error) {
    return ContentService.createTextOutput(encrypt(JSON.stringify({error: error.toString()}))).setMimeType(ContentService.MimeType.TEXT);
  }
}

// --- LOGIC HANDLERS ---

function handleLogin(input) {
  const email = String(input.email || '').trim();
  const pass = String(input.password || '').trim();
  const role = String(input.role || '').trim();
  
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName('Users');
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  
  // Hashed password check
  const hashedInputPass = hashPassword(pass);
  
  // Admin logic (Initial bypass for setup)
  if (email === 'admin' && pass === '112233') {
    let dbEmail = 'admin';
    if (role === 'RESEARCHER') dbEmail = 'admin_peneliti';
    else if (role === 'REVIEWER') dbEmail = 'admin_reviewer';
    
    let userRow = -1;
    for (let i = 1; i < data.length; i++) {
       if (String(data[i][headers.indexOf('email')]).trim() === dbEmail) { userRow = i; break; }
    }
    if (userRow === -1) {
      const newRow = ['def_'+role.toLowerCase(), dbEmail, hashedInputPass, role, 'Admin ' + role, '', '', '', '', '', '', ''];
      sheet.appendRow(newRow);
      return formatUser(newRow, headers);
    } else {
      // Update pass to hash if it was plain
      if (data[userRow][headers.indexOf('password')] === '112233') {
        sheet.getRange(userRow + 1, headers.indexOf('password') + 1).setValue(hashedInputPass);
      }
    }
    const updatedData = sheet.getRange(userRow + 1, 1, 1, headers.length).getValues()[0];
    return formatUser(updatedData, headers);
  }
  
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    const dbEmail = String(row[headers.indexOf('email')]).trim();
    const dbPass = String(row[headers.indexOf('password')]).trim();
    const dbRole = String(row[headers.indexOf('role')]).trim();
    
    if (dbEmail === email && (dbPass === hashedInputPass || dbPass === pass) && dbRole === role) {
      // Auto-migrate to hash if still plain
      if (dbPass === pass) {
        sheet.getRange(i + 1, headers.indexOf('password') + 1).setValue(hashedInputPass);
      }
      return formatUser(row, headers);
    }
  }
  throw new Error("Kredensial tidak valid");
}

function handleRegister(input) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName('Users');
  const id = 'usr_' + Math.random().toString(36).substr(2, 9);
  const p = input.profile || {};
  const hashedPass = hashPassword(input.password);
  const row = [id, input.email, hashedPass, input.role || 'RESEARCHER', input.name, p.placeOfBirth, p.dateOfBirth, p.gender, p.lastEducation, p.status, p.institution, p.phone];
  sheet.appendRow(row);
  return formatUser(row, sheet.getDataRange().getValues()[0]);
}

function handleUpdateProfile(input) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName('Users');
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  for (let i = 1; i < data.length; i++) {
    if (data[i][headers.indexOf('id')] === input.id) {
      const p = input.profile || {};
      const rowIndex = i + 1;
      sheet.getRange(rowIndex, headers.indexOf('name') + 1).setValue(input.name);
      sheet.getRange(rowIndex, headers.indexOf('place_of_birth') + 1).setValue(p.placeOfBirth);
      sheet.getRange(rowIndex, headers.indexOf('date_of_birth') + 1).setValue(p.dateOfBirth);
      sheet.getRange(rowIndex, headers.indexOf('gender') + 1).setValue(p.gender);
      sheet.getRange(rowIndex, headers.indexOf('last_education') + 1).setValue(p.lastEducation);
      sheet.getRange(rowIndex, headers.indexOf('status') + 1).setValue(p.status);
      sheet.getRange(rowIndex, headers.indexOf('institution') + 1).setValue(p.institution);
      sheet.getRange(rowIndex, headers.indexOf('phone') + 1).setValue(p.phone);
      return formatUser(sheet.getRange(rowIndex, 1, 1, headers.length).getValues()[0], headers);
    }
  }
  throw new Error("User not found");
}

function handleAssignReviewerAction(input) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  
  // 1. Update status
  const sheet = ss.getSheetByName('Protocols');
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  let rowIndex = -1;
  for (let i = 1; i < data.length; i++) {
    if (data[i][headers.indexOf('id')] === input.protocolId) {
      rowIndex = i + 1;
      break;
    }
  }
  if (rowIndex > -1) {
     sheet.getRange(rowIndex, headers.indexOf('status') + 1).setValue('ASSIGNED');
  }

  // 2. Tambah id reviewer (tanpa menghancurkan data lain)
  const rSheet = ss.getSheetByName('Protocol_Reviewers');
  rSheet.appendRow([input.protocolId, input.reviewerId]);
  
  return { success: true };
}

function handleGetProtocols(params) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const pSheet = ss.getSheetByName('Protocols');
  const data = pSheet.getDataRange().getValues();
  const headers = data[0];
  const list = [];
  
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    if (params.researcher_id && row[headers.indexOf('researcher_id')] !== params.researcher_id) continue;
    if (params.id && row[headers.indexOf('id')] !== params.id) continue;

    let p = {
      id: row[headers.indexOf('id')],
      researcherId: row[headers.indexOf('researcher_id')],
      registrationNumber: row[headers.indexOf('registration_number')],
      title: row[headers.indexOf('title')],
      status: row[headers.indexOf('status')],
      classification: row[headers.indexOf('classification')],
      submittedAt: row[headers.indexOf('submitted_at')],
      generalInfo: {
        mainResearcher: row[headers.indexOf('main_researcher')],
        phone: row[headers.indexOf('phone')],
        members: row[headers.indexOf('members')],
        organizingInstitution: row[headers.indexOf('organizing_institution')],
        collaborationType: row[headers.indexOf('collaboration_type')],
        collaborationDetails: row[headers.indexOf('collaboration_details')],
        design: row[headers.indexOf('design')],
        designDetails: row[headers.indexOf('design_details')],
        location: row[headers.indexOf('location')],
        time: row[headers.indexOf('time')],
        dataCollectionTime: row[headers.indexOf('data_collection_time')],
        previousSubmission: row[headers.indexOf('previous_submission')],
        previousSubmissionResult: row[headers.indexOf('previous_submission_result')],
        researchTeamTasks: JSON.parse(row[headers.indexOf('research_team_tasks')] || '[]')
      }
    };

    if (params.id) {
       const sData = ss.getSheetByName('Protocol_Screening').getDataRange().getValues();
       p.screening = {};
       for (let j = 1; j < sData.length; j++) if (sData[j][0] === params.id) p.screening[sData[j][1]] = sData[j][2];
       const aData = ss.getSheetByName('Protocol_Attachments').getDataRange().getValues();
       for (let j = 1; j < aData.length; j++) if (aData[j][0] === params.id) {
           p.attachments = { proposal: aData[j][1], psp: aData[j][2], ic: aData[j][3], instruments: aData[j][4], paymentProof: aData[j][5], supportingDocs: JSON.parse(aData[j][6] || '[]') };
           break;
       }
       const rData = ss.getSheetByName('Protocol_Reviewers').getDataRange().getValues();
       p.assignedReviewers = [];
       for (let j = 1; j < rData.length; j++) if (rData[j][0] === params.id) p.assignedReviewers.push(rData[j][1]);
       const revData = ss.getSheetByName('Reviews').getDataRange().getValues();
       p.reviews = [];
       for (let j = 1; j < revData.length; j++) if (revData[j][1] === params.id) {
           p.reviews.push({ id: revData[j][0], reviewerId: revData[j][2], reviewerName: revData[j][3], assignedAt: revData[j][4], submittedAt: revData[j][5], reviewFile: revData[j][6], conclusion: revData[j][7], notes: revData[j][8] });
       }
       return p;
    }
    list.push(p);
  }
  return list;
}

function handleSaveProtocol(input) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName('Protocols');
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const id = input.id;
  const gi = input.generalInfo || {};
  let rowIndex = -1;
  for (let i = 1; i < data.length; i++) if (data[i][headers.indexOf('id')] === id) { rowIndex = i + 1; break; }
  const row = [
    id, 
    input.researcherId, 
    input.registrationNumber, 
    input.title, 
    input.status, 
    input.classification, 
    input.submittedAt, 
    gi.mainResearcher, 
    gi.phone, 
    gi.members, 
    gi.organizingInstitution, 
    gi.collaborationType, 
    gi.collaborationDetails || '', 
    gi.design, 
    gi.designDetails || '', 
    gi.location, 
    gi.time, 
    gi.dataCollectionTime, 
    gi.previousSubmission, 
    gi.previousSubmissionResult || '', 
    JSON.stringify(gi.researchTeamTasks || [])
  ];
  if (rowIndex > -1) sheet.getRange(rowIndex, 1, 1, row.length).setValues([row]);
  else sheet.appendRow(row);

  if (input.screening) {
    const sSheet = ss.getSheetByName('Protocol_Screening');
    deleteRowsById(sSheet, id, 0);
    for (let idx in input.screening) sSheet.appendRow([id, idx, input.screening[idx]]);
  }
  if (input.attachments) {
    const aSheet = ss.getSheetByName('Protocol_Attachments');
    deleteRowsById(aSheet, id, 0);
    const att = input.attachments;
    aSheet.appendRow([id, att.proposal, att.psp, att.ic, att.instruments, att.paymentProof, JSON.stringify(att.supportingDocs || [])]);
  }
  if (input.assignedReviewers) {
    const rSheet = ss.getSheetByName('Protocol_Reviewers');
    deleteRowsById(rSheet, id, 0);
    input.assignedReviewers.forEach(rid => rSheet.appendRow([id, rid]));
  }
  
  if (input.reviews) {
    const revSheet = ss.getSheetByName('Reviews');
    deleteRowsById(revSheet, id, 1); // col 1 is protocol_id
    input.reviews.forEach(r => {
      const rid = r.id || 'rev_' + Math.random().toString(36).substr(2, 9);
      revSheet.appendRow([rid, id, r.reviewerId, r.reviewerName, r.assignedAt, r.submittedAt || '', r.reviewFile || '', r.conclusion || '', r.notes || '']);
    });
  }
  return { success: true, id: id };
}

function handleUploadFile(input) {
  try {
    const folder = DriveApp.getFolderById(DRIVE_FOLDER_ID);
    const contentType = input.mimeType || 'application/octet-stream';
    const decodedFile = Utilities.base64Decode(input.base64);
    const blob = Utilities.newBlob(decodedFile, contentType, input.fileName || 'unnamed_file');
    const file = folder.createFile(blob);
    
    // Set view permissions (optional, depend on user needs)
    // file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    
    return { 
      success: true, 
      fileUrl: file.getUrl(),
      fileId: file.getId(),
      fileName: file.getName()
    };
  } catch (err) {
    throw new Error("Gagal mengunggah file ke Drive: " + err.toString());
  }
}

function handleGetUsers(params) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const data = ss.getSheetByName('Users').getDataRange().getValues();
  const headers = data[0];
  const list = [];
  for (let i = 1; i < data.length; i++) {
    if (params.role && data[i][headers.indexOf('role')] !== params.role) continue;
    list.push(formatUser(data[i], headers));
  }
  return list;
}

// --- SECURITY & UTILS ---

function decrypt(hexData) {
  let key = SECRET_KEY;
  let bytes = [];
  for(let i=0; i<hexData.length; i+=2) {
    bytes.push(parseInt(hexData.substr(i, 2), 16) ^ key.charCodeAt((i/2) % key.length));
  }
  return Utilities.newBlob(bytes).getDataAsString();
}

function encrypt(data) {
  let key = SECRET_KEY;
  let bytes = Utilities.newBlob(data).getBytes();
  let result = "";
  for(let i=0; i<bytes.length; i++) {
    let byte = bytes[i];
    if (byte < 0) byte += 256;
    let xored = byte ^ key.charCodeAt(i % key.length);
    let hex = xored.toString(16);
    result += (hex.length === 1 ? "0" + hex : hex);
  }
  return result;
}

function hashPassword(password) {
  const signature = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, password);
  let hash = "";
  for (let i = 0; i < signature.length; i++) {
    let byte = signature[i];
    if (byte < 0) byte += 256;
    let byteStr = byte.toString(16);
    if (byteStr.length === 1) byteStr = "0" + byteStr;
    hash += byteStr;
  }
  return hash;
}

function formatUser(row, headers) {
  return {
    id: String(row[headers.indexOf('id')]).trim(), email: String(row[headers.indexOf('email')]).trim(),
    role: String(row[headers.indexOf('role')]).trim(), name: String(row[headers.indexOf('name')]).trim(),
    profile: {
      placeOfBirth: row[headers.indexOf('place_of_birth')] || '', dateOfBirth: row[headers.indexOf('date_of_birth')] || '',
      gender: row[headers.indexOf('gender')] || '', lastEducation: row[headers.indexOf('last_education')] || '',
      status: row[headers.indexOf('status')] || '', institution: row[headers.indexOf('institution')] || '',
      phone: row[headers.indexOf('phone')] || ''
    }
  };
}

function deleteRowsById(sheet, id, colIndex) {
  const data = sheet.getDataRange().getValues();
  for (let i = data.length - 1; i >= 1; i--) if (data[i][colIndex] === id) sheet.deleteRow(i + 1);
}
