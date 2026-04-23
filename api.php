<?php
/**
 * SIM-KEPK FKp UNAIR - API Backend
 * Connects React Frontend to MySQL Database
 */

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS, DELETE, PUT");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With, X-API-KEY");
header("Content-Type: application/json; charset=UTF-8");

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Security Configuration (Priority: Environment Variables)
define('SECRET_KEY', getenv('SECRET_KEY') ?: 'SIM_KEPK_FKP_UNAIR_SECURE_2024');
define('API_KEY_SECRET', getenv('API_KEY_SECRET') ?: 'UNAIR_FKP_2024_PREMIUM');

// Validate API Key
if (($_SERVER['HTTP_X_API_KEY'] ?? '') !== API_KEY_SECRET) {
    http_response_code(403);
    echo json_encode(["error" => "Forbidden: Invalid API Key"]);
    exit();
}

function encrypt($data) {
    $str = is_string($data) ? $data : json_encode($data);
    $key = SECRET_KEY;
    $result = "";
    for($i = 0; $i < strlen($str); $i++) {
        $byte = ord($str[$i]);
        $xored = $byte ^ ord($key[$i % strlen($key)]);
        $result .= str_pad(dechex($xored), 2, '0', STR_PAD_LEFT);
    }
    return $result;
}

function decrypt($hexData) {
    if (!$hexData || strlen($hexData) % 2 !== 0) return null;
    $key = SECRET_KEY;
    $str = "";
    for($i = 0; $i < strlen($hexData); $i += 2) {
        $byte = hexdec(substr($hexData, $i, 2));
        $str .= chr($byte ^ ord($key[($i/2) % strlen($key)]));
    }
    try {
        $json = json_decode($str, true);
        return $json === null ? $str : $json;
    } catch (Exception $e) {
        return $str;
    }
}

// Database Configuration (Priority: Environment Variables)
$host = getenv('DB_HOST') ?: "localhost";
$db_name = getenv('DB_NAME') ?: "pkkiipendidikanu_kepk";
$username = getenv('DB_USER') ?: "pkkiipendidikanu_dioarsip";
$password = getenv('DB_PASS') ?: "@Dioadam27";

try {
    $conn = new PDO("mysql:host=$host;dbname=$db_name", $username, $password);
    $conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $conn->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
} catch(PDOException $e) {
    http_response_code(500);
    $error = ["error" => "Database connection failed: " . $e->getMessage()];
    echo encrypt($error);
    exit();
}

// Get Request Data
$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? '';
$rawBody = file_get_contents('php://input');
$bodyJson = json_decode($rawBody, true);
$input = isset($bodyJson['data']) ? decrypt($bodyJson['data']) : null;

// --- JWT & Auth Helpers ---
function generateToken($user) {
    $header = json_encode(['typ' => 'JWT', 'alg' => 'HS256']);
    $payload = json_encode(['id' => $user['id'], 'role' => $user['role'], 'exp' => time() + (86400 * 7)]);
    $b64Header = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($header));
    $b64Payload = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($payload));
    $signature = hash_hmac('sha256', $b64Header . "." . $b64Payload, SECRET_KEY, true);
    $b64Signature = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($signature));
    return $b64Header . "." . $b64Payload . "." . $b64Signature;
}

function verifyToken($token) {
    if (!$token) return null;
    $parts = explode('.', $token);
    if (count($parts) !== 3) return null;
    list($header, $payload, $signature) = $parts;
    $validSignature = hash_hmac('sha256', $header . "." . $payload, SECRET_KEY, true);
    $b64Signature = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($validSignature));
    if (hash_equals($b64Signature, $signature)) {
        $data = json_decode(base64_decode(str_replace(['-', '_'], ['+', '/'], $payload)), true);
        if (isset($data['exp']) && $data['exp'] >= time()) return $data;
    }
    return null;
}

$authHeader = $_SERVER['HTTP_AUTHORIZATION'] ?? '';
if (!$authHeader && function_exists('apache_request_headers')) {
    $reqHeaders = apache_request_headers();
    $authHeader = $reqHeaders['Authorization'] ?? '';
}
$token = '';
if (preg_match('/Bearer\s(\S+)/', $authHeader, $matches)) {
    $token = $matches[1];
}
$authUser = verifyToken($token);

function requireAuth($userId = null, $allowedRoles = []) {
    global $authUser;
    if (!$authUser) {
        http_response_code(401);
        echo encrypt(["error" => "Sesi Anda telah berakhir atau tidak valid. Silakan login kembali."]);
        exit();
    }
    if ($userId && $authUser['id'] !== $userId && $authUser['role'] !== 'ADMIN') {
        http_response_code(403);
        echo encrypt(["error" => "Akses Ditolak: Anda mencoba mengakses atau mengubah data milik orang lain."]);
        exit();
    }
    if (!empty($allowedRoles) && !in_array($authUser['role'], $allowedRoles)) {
        http_response_code(403);
        echo encrypt(["error" => "Akses Ditolak: Role Anda tidak diizinkan."]);
        exit();
    }
}

// Helper function to format user output
function formatUser($row) {
    return [
        "id" => $row['id'],
        "email" => $row['email'],
        "role" => $row['role'],
        "name" => $row['name'],
        "profile" => [
            "placeOfBirth" => $row['place_of_birth'] ?? '',
            "dateOfBirth" => $row['date_of_birth'] ?? '',
            "gender" => $row['gender'] ?? '',
            "lastEducation" => $row['last_education'] ?? '',
            "status" => $row['status'] ?? '',
            "institution" => $row['institution'] ?? '',
            "phone" => $row['phone'] ?? '',
            "ethicsTraining" => $row['ethics_training'] ?? '',
            "ethicsTrainingFile" => $row['ethics_training_file'] ?? '',
            "confidentialityAgreementFile" => $row['confidentiality_agreement_file'] ?? '',
            "isProfileComplete" => (bool)($row['is_profile_complete'] ?? false)
        ]
    ];
}

// API Routes
switch($action) {
    
    case 'login':
        if ($method !== 'POST') break;
        $email = $input['email'] ?? '';
        $pass = $input['password'] ?? '';
        $role = $input['role'] ?? '';
        
        $stmt = $conn->prepare("SELECT * FROM users WHERE email = ? AND role = ?");
        $stmt->execute([$email, $role]);
        $user = $stmt->fetch();
        
        $validLogin = false;
        if ($user) {
            // Verify new hash OR allow legacy plaintext login while upgrading it to hash seamlessly
            if (password_verify($pass, $user['password'])) {
                $validLogin = true;
            } else if ($pass === $user['password']) {
                $validLogin = true;
                // Upgrade plaintext password to standard hash
                $newHash = password_hash($pass, PASSWORD_DEFAULT);
                $upd = $conn->prepare("UPDATE users SET password = ? WHERE id = ?");
                $upd->execute([$newHash, $user['id']]);
            }
        }
        
        if ($validLogin) {
            $output = formatUser($user);
            $output['token'] = generateToken($user);
            echo encrypt($output);
        } else {
            http_response_code(401);
            echo encrypt(["error" => "Email, Password, atau Role tidak sesuai."]);
        }
        break;

    case 'google_login':
        if ($method !== 'POST') break;
        $email = $input['email'] ?? '';
        $name = $input['name'] ?? '';
        $role = $input['role'] ?? 'RESEARCHER';

        // Check if email already exists
        $stmt = $conn->prepare("SELECT * FROM users WHERE email = ?");
        $stmt->execute([$email]);
        $user = $stmt->fetch();

        if ($user) {
            // If user exists, they MUST be a RESEARCHER to use Google Login
            if ($user['role'] !== 'RESEARCHER') {
                http_response_code(403);
                echo encrypt(["error" => "Login Google hanya tersedia untuk akun Peneliti."]);
                exit();
            }
        } else {
            // Auto-register if not found (default is RESEARCHER)
            $id = 'usr_' . substr(md5($email . time()), 0, 9);
            // Generate a shorter dummy password since they use Google Login (bypasses 60 char limit if DB column is varchar(50))
            $dummyPassword = "GOOG_" . bin2hex(random_bytes(8));
            $ins = $conn->prepare("INSERT INTO users (id, email, password, role, name, institution) VALUES (?, ?, ?, ?, ?, ?)");
            $ins->execute([$id, $email, $dummyPassword, 'RESEARCHER', $name, 'FKp UNAIR']);
            
            $stmt = $conn->prepare("SELECT * FROM users WHERE id = ?");
            $stmt->execute([$id]);
            $user = $stmt->fetch();
        }
        
        $output = formatUser($user);
        $output['token'] = generateToken($user);
        echo encrypt($output);
        break;

    case 'register':
        if ($method !== 'POST') break;
        $id = substr(md5(uniqid(mt_rand(), true)), 0, 9);
        $name = $input['name'] ?? '';
        $email = $input['email'] ?? '';
        $pass = $input['password'] ?? '';
        $role = $input['role'] ?? 'RESEARCHER';
        $profile = $input['profile'] ?? [];

        try {
            $passHash = password_hash($pass, PASSWORD_DEFAULT);
            $stmt = $conn->prepare("INSERT INTO users (id, email, password, role, name, place_of_birth, date_of_birth, gender, last_education, status, institution, phone) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
            $stmt->execute([
                $id, 
                $email, 
                $passHash, 
                $role, 
                $name,
                $profile['placeOfBirth'] ?? null,
                $profile['dateOfBirth'] ?? null,
                $profile['gender'] ?? null,
                $profile['lastEducation'] ?? null,
                $profile['status'] ?? null,
                $profile['institution'] ?? null,
                $profile['phone'] ?? null
            ]);
            
            $stmt = $conn->prepare("SELECT * FROM users WHERE id = ?");
            $stmt->execute([$id]);
            $newUser = $stmt->fetch();
            
            $output = formatUser($newUser);
            $output['token'] = generateToken($newUser);
            echo encrypt($output);
        } catch(PDOException $e) {
            http_response_code(400);
            echo encrypt(["error" => "Registrasi gagal: " . $e->getMessage()]);
        }
        break;

    case 'update_profile':
        if ($method !== 'POST') break;
        $id = $input['id'] ?? '';
        requireAuth($id); // Security: Prevent IDOR
        $name = $input['name'] ?? '';
        $profile = $input['profile'] ?? [];

        try {
            $stmt = $conn->prepare("UPDATE users SET 
                name = ?, 
                place_of_birth = ?, 
                date_of_birth = ?, 
                gender = ?, 
                last_education = ?, 
                status = ?, 
                institution = ?, 
                phone = ?,
                ethics_training = ?,
                ethics_training_file = ?,
                confidentiality_agreement_file = ?,
                is_profile_complete = ?
                WHERE id = ?");
            $stmt->execute([
                $name,
                $profile['placeOfBirth'] ?? null,
                $profile['dateOfBirth'] ?? null,
                $profile['gender'] ?? null,
                $profile['lastEducation'] ?? null,
                $profile['status'] ?? null,
                $profile['institution'] ?? null,
                $profile['phone'] ?? null,
                $profile['ethicsTraining'] ?? null,
                $profile['ethicsTrainingFile'] ?? null,
                $profile['confidentialityAgreementFile'] ?? null,
                ($profile['isProfileComplete'] ?? false) ? 1 : 0,
                $id
            ]);
            
            $stmt = $conn->prepare("SELECT * FROM users WHERE id = ?");
            $stmt->execute([$id]);
            $updatedUser = $stmt->fetch();
            
            echo encrypt(formatUser($updatedUser));
        } catch(PDOException $e) {
            http_response_code(500);
            echo encrypt(["error" => "Gagal update profil: " . $e->getMessage()]);
        }
        break;

    case 'change_password':
        if ($method !== 'POST') break;
        $userId = $input['userId'] ?? '';
        requireAuth($userId); // Security: Prevent IDOR
        $newPassword = $input['newPassword'] ?? '';
        
        try {
            $newHash = password_hash($newPassword, PASSWORD_DEFAULT);
            $stmt = $conn->prepare("UPDATE users SET password = ? WHERE id = ?");
            $result = $stmt->execute([$newHash, $userId]);
            echo encrypt(["success" => $result]);
        } catch(PDOException $e) {
            http_response_code(500);
            echo encrypt(["error" => "Gagal ganti password: " . $e->getMessage()]);
        }
        break;

    case 'assign_reviewer':
        if ($method !== 'POST') break;
        requireAuth(null, ['ADMIN']); // Admin only
        $protocolId = $input['protocolId'] ?? '';
        $reviewerId = $input['reviewerId'] ?? '';
        
        try {
            $conn->beginTransaction();
            // Update status
            $stmt = $conn->prepare("UPDATE protocols SET status = 'ASSIGNED' WHERE id = ?");
            $stmt->execute([$protocolId]);
            // Add reviewer
            $stmt = $conn->prepare("INSERT INTO protocol_reviewers (protocol_id, reviewer_id) VALUES (?, ?)");
            $result = $stmt->execute([$protocolId, $reviewerId]);
            $conn->commit();
            echo encrypt(["success" => true]);
        } catch(PDOException $e) {
            $conn->rollBack();
            http_response_code(500);
            echo encrypt(["error" => "Gagal tugaskan reviewer: " . $e->getMessage()]);
        }
        break;

    case 'unassign_reviewer':
        if ($method !== 'POST') break;
        requireAuth(null, ['ADMIN']); // Admin only
        $protocolId = $input['protocolId'] ?? '';
        $reviewerId = $input['reviewerId'] ?? '';
        
        try {
            $stmt = $conn->prepare("DELETE FROM protocol_reviewers WHERE protocol_id = ? AND reviewer_id = ?");
            $result = $stmt->execute([$protocolId, $reviewerId]);
            echo encrypt(["success" => true]);
        } catch(PDOException $e) {
            http_response_code(500);
            echo encrypt(["error" => "Gagal hapus reviewer: " . $e->getMessage()]);
        }
        break;

    case 'get_protocols':
        if ($method !== 'GET') break;
        requireAuth(); // Must be logged in
        $researcher_id = $_GET['researcher_id'] ?? null;
        $id = $_GET['id'] ?? null;
        
        if ($id) {
            $stmt = $conn->prepare("SELECT * FROM protocols WHERE id = ?");
            $stmt->execute([$id]);
            $protocol = $stmt->fetch();
            
            if ($protocol) {
                // Ensure Researcher can only fetch their own protocol
                if ($authUser['role'] === 'RESEARCHER' && $authUser['id'] !== $protocol['researcher_id']) {
                    http_response_code(403);
                    echo encrypt(["error" => "Akses Ditolak: Anda mendownload/membuka protokol yang bukan milik Anda."]);
                    exit();
                }

                // Ensure Reviewer can only fetch assigned protocols
                if ($authUser['role'] === 'REVIEWER') {
                    $checkRev = $conn->prepare("SELECT 1 FROM protocol_reviewers WHERE protocol_id = ? AND reviewer_id = ?");
                    $checkRev->execute([$id, $authUser['id']]);
                    if (!$checkRev->fetch()) {
                        http_response_code(403);
                        echo encrypt(["error" => "Akses Ditolak: Anda tidak ditugaskan untuk mereview protokol ini."]);
                        exit();
                    }
                }

                // Fetch screening
                $stmt = $conn->prepare("SELECT question_index, answer FROM protocol_screening WHERE protocol_id = ?");
                $stmt->execute([$id]);
                $screening = [];
                foreach ($stmt->fetchAll() as $row) {
                    $screening[$row['question_index']] = $row['answer'];
                }
                $protocol['screening'] = $screening;
                
                // Fetch attachments
                $stmt = $conn->prepare("SELECT * FROM protocol_attachments WHERE protocol_id = ?");
                $stmt->execute([$id]);
                $att = $stmt->fetch();
                $protocol['attachments'] = $att ? [
                    "proposal" => $att['proposal'],
                    "psp" => $att['psp'],
                    "ic" => $att['ic'],
                    "instruments" => $att['instruments'],
                    "paymentProof" => $att['payment_proof'],
                    "supportingDocs" => json_decode($att['supporting_docs'] ?? '[]', true)
                ] : null;

                // Fetch reviewers
                $stmt = $conn->prepare("SELECT reviewer_id FROM protocol_reviewers WHERE protocol_id = ?");
                $stmt->execute([$id]);
                $protocol['assignedReviewers'] = $stmt->fetchAll(PDO::FETCH_COLUMN);

                // Fetch reviews
                $stmt = $conn->prepare("SELECT * FROM reviews WHERE protocol_id = ?");
                $stmt->execute([$id]);
                $protocol['reviews'] = $stmt->fetchAll();

                // Map database columns back to generalInfo object
                $protocol['generalInfo'] = [
                    "mainResearcher" => $protocol['main_researcher'],
                    "phone" => $protocol['phone'],
                    "members" => $protocol['members'],
                    "organizingInstitution" => $protocol['organizing_institution'],
                    "collaborationType" => $protocol['collaboration_type'],
                    "design" => $protocol['design'],
                    "location" => $protocol['location'],
                    "time" => $protocol['time'],
                    "dataCollectionTime" => $protocol['data_collection_time'],
                    "previousSubmission" => $protocol['previous_submission'],
                    "collaborationDetails" => $protocol['collaboration_details'] ?? '',
                    "designDetails" => $protocol['design_details'] ?? '',
                    "previousSubmissionResult" => $protocol['previous_submission_result'] ?? '',
                    "researchTeamTasks" => json_decode($protocol['research_team_tasks'] ?? '[]', true)
                ];
                
                echo encrypt($protocol);
            } else {
                http_response_code(404);
                echo encrypt(["error" => "Protokol tidak ditemukan"]);
            }
        } else {
            // Force strict researcher filter based on Auth Token to prevent IDOR via query param spoofing
            if ($authUser['role'] === 'RESEARCHER') {
                $researcher_id = $authUser['id'];
            }
            
            if ($authUser['role'] === 'REVIEWER') {
                $stmt = $conn->prepare("SELECT p.* FROM protocols p INNER JOIN protocol_reviewers pr ON p.id = pr.protocol_id WHERE pr.reviewer_id = ? ORDER BY p.created_at DESC");
                $stmt->execute([$authUser['id']]);
            } else if ($researcher_id) {
                $stmt = $conn->prepare("SELECT * FROM protocols WHERE researcher_id = ? ORDER BY created_at DESC");
                $stmt->execute([$researcher_id]);
            } else {
                $stmt = $conn->query("SELECT * FROM protocols ORDER BY created_at DESC");
            }
            
            $protocols = $stmt->fetchAll();
            foreach ($protocols as &$p) {
                $p['generalInfo'] = ["mainResearcher" => $p['main_researcher']];
            }
            echo encrypt($protocols);
        }
        break;

    case 'save_protocol':
        if ($method !== 'POST') break;
        $p = $input;
        $id = $p['id'] ?? substr(md5(uniqid(mt_rand(), true)), 0, 9);
        $gi = $p['generalInfo'] ?? [];
        
        // Security check
        requireAuth(); // Must be logged in
        if ($authUser['role'] !== 'ADMIN' && $authUser['id'] !== $p['researcherId']) {
            if ($authUser['role'] === 'REVIEWER') {
                $checkRev = $conn->prepare("SELECT 1 FROM protocol_reviewers WHERE protocol_id = ? AND reviewer_id = ?");
                $checkRev->execute([$id, $authUser['id']]);
                if (!$checkRev->fetch()) {
                    http_response_code(403);
                    echo encrypt(["error" => "Akses Ditolak: Anda bukan reviewer untuk protokol ini."]);
                    exit();
                }
            } else {
                http_response_code(403);
                echo encrypt(["error" => "Akses Ditolak: Anda tidak dapat menyimpan data milik orang lain."]);
                exit();
            }
        }

        // Check if exists
        $stmt = $conn->prepare("SELECT id FROM protocols WHERE id = ?");
        $stmt->execute([$id]);
        $exists = $stmt->fetch();

        try {
            $conn->beginTransaction();

            if ($exists) {
                // Update
                $stmt = $conn->prepare("UPDATE protocols SET 
                    title = ?, status = ?, classification = ?, registration_number = ?, 
                    submitted_at = ?, main_researcher = ?, phone = ?, members = ?, 
                    organizing_institution = ?, collaboration_type = ?, collaboration_details = ?, 
                    design = ?, design_details = ?, location = ?, time = ?, 
                    data_collection_time = ?, previous_submission = ?, 
                    previous_submission_result = ?, research_team_tasks = ? 
                    WHERE id = ?");
                $stmt->execute([
                    $p['title'], $p['status'], $p['classification'] ?? null, $p['registrationNumber'] ?? null,
                    $p['submittedAt'] ?? null, $gi['mainResearcher'] ?? null, $gi['phone'] ?? null, $gi['members'] ?? null,
                    $gi['organizingInstitution'] ?? null, $gi['collaborationType'] ?? null, $gi['collaborationDetails'] ?? null,
                    $gi['design'] ?? null, $gi['designDetails'] ?? null,
                    $gi['location'] ?? null, $gi['time'] ?? null, $gi['dataCollectionTime'] ?? null, $gi['previousSubmission'] ?? null,
                    $gi['previousSubmissionResult'] ?? null, json_encode($gi['researchTeamTasks'] ?? []),
                    $id
                ]);
            } else {
                // Insert
                $stmt = $conn->prepare("INSERT INTO protocols (
                    id, researcher_id, title, status, registration_number, 
                    submitted_at, main_researcher, phone, members, 
                    organizing_institution, collaboration_type, collaboration_details, 
                    design, design_details, location, time, data_collection_time, 
                    previous_submission, previous_submission_result, research_team_tasks
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
                $stmt->execute([
                    $id, $p['researcherId'], $p['title'], $p['status'], $p['registrationNumber'] ?? null,
                    $p['submittedAt'] ?? null, $gi['mainResearcher'] ?? null, $gi['phone'] ?? null, $gi['members'] ?? null,
                    $gi['organizingInstitution'] ?? null, $gi['collaborationType'] ?? null, $gi['collaborationDetails'] ?? null,
                    $gi['design'] ?? null, $gi['designDetails'] ?? null,
                    $gi['location'] ?? null, $gi['time'] ?? null, $gi['dataCollectionTime'] ?? null, 
                    $gi['previousSubmission'] ?? null, $gi['previousSubmissionResult'] ?? null,
                    json_encode($gi['researchTeamTasks'] ?? [])
                ]);
            }

            // Save screening
            if (isset($p['screening'])) {
                $stmt = $conn->prepare("DELETE FROM protocol_screening WHERE protocol_id = ?");
                $stmt->execute([$id]);
                $stmt = $conn->prepare("INSERT INTO protocol_screening (protocol_id, question_index, answer) VALUES (?, ?, ?)");
                foreach ($p['screening'] as $idx => $ans) {
                    $stmt->execute([$id, $idx, $ans]);
                }
            }

            // Save attachments
            if (isset($p['attachments'])) {
                $att = $p['attachments'];
                $stmt = $conn->prepare("DELETE FROM protocol_attachments WHERE protocol_id = ?");
                $stmt->execute([$id]);
                $stmt = $conn->prepare("INSERT INTO protocol_attachments (protocol_id, proposal, psp, ic, instruments, payment_proof, supporting_docs) VALUES (?, ?, ?, ?, ?, ?, ?)");
                $stmt->execute([
                    $id, 
                    $att['proposal'] ?? '', 
                    $att['psp'] ?? '', 
                    $att['ic'] ?? '', 
                    $att['instruments'] ?? '', 
                    $att['paymentProof'] ?? '',
                    json_encode($att['supportingDocs'] ?? [])
                ]);
            }

            // Save reviews
            if (isset($p['reviews'])) {
                $stmt = $conn->prepare("DELETE FROM reviews WHERE protocol_id = ?");
                $stmt->execute([$id]);
                $stmt = $conn->prepare("INSERT INTO reviews (id, protocol_id, reviewer_id, reviewer_name, assigned_at, submitted_at, review_file, conclusion, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)");
                foreach ($p['reviews'] as $r) {
                    $rid = $r['id'] ?? substr(md5(uniqid(mt_rand(), true)), 0, 9);
                    $stmt->execute([
                        $rid, $id, $r['reviewerId'], $r['reviewerName'], 
                        $r['assignedAt'], $r['submittedAt'] ?? null, 
                        $r['reviewFile'] ?? null, $r['conclusion'] ?? null, $r['notes'] ?? null
                    ]);
                }
            }

            $conn->commit();
            echo encrypt(["success" => true, "id" => $id]);
        } catch(PDOException $e) {
            $conn->rollBack();
            http_response_code(500);
            echo encrypt(["error" => "Gagal menyimpan protokol: " . $e->getMessage()]);
        }
        break;

    case 'upload_file':
        if ($method !== 'POST') break;
        requireAuth(); // Must be logged in to upload
        
        $fileName = $input['fileName'] ?? '';
        $mimeType = $input['mimeType'] ?? '';
        $base64 = $input['base64'] ?? '';
        
        if (!$fileName || !$base64) {
            echo encrypt(["error" => "Invalid file data"]);
            exit();
        }

        // Validate extension (Allow only documents and images)
        $allowedExts = ['pdf', 'doc', 'docx', 'jpg', 'jpeg', 'png'];
        $ext = strtolower(pathinfo($fileName, PATHINFO_EXTENSION));
        if (!in_array($ext, $allowedExts)) {
            echo encrypt(["error" => "Tipe file tidak diizinkan. Gunakan PDF/Doc/Gambar."]);
            exit();
        }

        $uploadDir = 'uploads/';
        if (!is_dir($uploadDir)) mkdir($uploadDir, 0755, true);
        
        $newFileName = uniqid() . '_' . preg_replace("/[^a-zA-Z0-9.\-_]/", "", $fileName);
        $filePath = $uploadDir . $newFileName;
        
        if (file_put_contents($filePath, base64_decode($base64))) {
            // Return full URL
            $protocol = isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on' ? "https" : "http";
            $host_url = $_SERVER['HTTP_HOST'];
            $fileUrl = $protocol . "://" . $host_url . "/" . $filePath;
            echo encrypt(["success" => true, "fileUrl" => $fileUrl]);
        } else {
            echo encrypt(["error" => "Gagal menyimpan file ke server"]);
        }
        break;

    case 'get_users':
        if ($method !== 'GET') break;
        requireAuth(null, ['ADMIN']); // Security: Only admin can view users
        $role = $_GET['role'] ?? null;
        
        if ($role) {
            $stmt = $conn->prepare("SELECT * FROM users WHERE role = ?");
            $stmt->execute([$role]);
        } else {
            $stmt = $conn->query("SELECT * FROM users");
        }
        
        $users = $stmt->fetchAll();
        $formattedUsers = [];
        foreach ($users as $u) {
            $formattedUsers[] = formatUser($u);
        }
        echo encrypt($formattedUsers);
        break;

    default:
        http_response_code(404);
        echo encrypt(["error" => "Action not found"]);
        break;
}
?>
