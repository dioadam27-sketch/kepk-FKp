<?php
/**
 * SIM-KEPK FKp UNAIR - API Backend
 * Connects React Frontend to MySQL Database
 */

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS, DELETE, PUT");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
header("Content-Type: application/json; charset=UTF-8");

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Database Configuration
$host = "localhost";
$db_name = "pkkiipendidikanu_fkp";
$username = "pkkiipendidikanu_dioarsip";
$password = "@Dioadam27";

try {
    $conn = new PDO("mysql:host=$host;dbname=$db_name", $username, $password);
    $conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $conn->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
} catch(PDOException $e) {
    http_response_code(500);
    echo json_encode(["error" => "Database connection failed: " . $e->getMessage()]);
    exit();
}

// Get Request Data
$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? '';
$input = json_decode(file_get_contents('php://input'), true);

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
            "phone" => $row['phone'] ?? ''
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
        
        // Handle universal 'admin' login for all roles
        if ($email === 'admin' && $pass === '112233') {
            $dbEmail = 'admin'; // Default for ADMIN
            $name = 'Administrator';
            
            if ($role === 'RESEARCHER') {
                $dbEmail = 'admin_peneliti';
                $name = 'Akun Peneliti (Testing)';
            } else if ($role === 'REVIEWER') {
                $dbEmail = 'admin_reviewer';
                $name = 'Akun Reviewer (Testing)';
            }

            // Auto-create if it doesn't exist
            $checkUser = $conn->prepare("SELECT id FROM users WHERE email = ?");
            $checkUser->execute([$dbEmail]);
            if (!$checkUser->fetch()) {
                $userId = substr(md5('default_' . $role), 0, 9);
                $insUser = $conn->prepare("INSERT INTO users (id, email, password, role, name) VALUES (?, ?, ?, ?, ?)");
                $insUser->execute([$userId, $dbEmail, '112233', $role, $name]);
            }
            
            // Override the email variable to use the mapped database email for the actual login check
            $email = $dbEmail;
        }

        $stmt = $conn->prepare("SELECT * FROM users WHERE email = ? AND password = ? AND role = ?");
        $stmt->execute([$email, $pass, $role]);
        $user = $stmt->fetch();
        
        if ($user) {
            echo json_encode(formatUser($user));
        } else {
            http_response_code(401);
            echo json_encode(["error" => "Email, Password, atau Role tidak sesuai."]);
        }
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
            $stmt = $conn->prepare("INSERT INTO users (id, email, password, role, name, place_of_birth, date_of_birth, gender, last_education, status, institution, phone) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
            $stmt->execute([
                $id, 
                $email, 
                $pass, 
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
            
            echo json_encode(formatUser($newUser));
        } catch(PDOException $e) {
            http_response_code(400);
            echo json_encode(["error" => "Registrasi gagal: " . $e->getMessage()]);
        }
        break;

    case 'update_profile':
        if ($method !== 'POST') break;
        $id = $input['id'] ?? '';
        $name = $input['name'] ?? '';
        $profile = $input['profile'] ?? [];

        try {
            $stmt = $conn->prepare("UPDATE users SET name = ?, place_of_birth = ?, date_of_birth = ?, gender = ?, last_education = ?, status = ?, institution = ?, phone = ? WHERE id = ?");
            $stmt->execute([
                $name,
                $profile['placeOfBirth'] ?? null,
                $profile['dateOfBirth'] ?? null,
                $profile['gender'] ?? null,
                $profile['lastEducation'] ?? null,
                $profile['status'] ?? null,
                $profile['institution'] ?? null,
                $profile['phone'] ?? null,
                $id
            ]);
            
            $stmt = $conn->prepare("SELECT * FROM users WHERE id = ?");
            $stmt->execute([$id]);
            $updatedUser = $stmt->fetch();
            
            echo json_encode(formatUser($updatedUser));
        } catch(PDOException $e) {
            http_response_code(500);
            echo json_encode(["error" => "Gagal update profil: " . $e->getMessage()]);
        }
        break;

    case 'get_protocols':
        if ($method !== 'GET') break;
        $researcher_id = $_GET['researcher_id'] ?? null;
        $id = $_GET['id'] ?? null;
        
        if ($id) {
            $stmt = $conn->prepare("SELECT * FROM protocols WHERE id = ?");
            $stmt->execute([$id]);
            $protocol = $stmt->fetch();
            
            if ($protocol) {
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
                
                echo json_encode($protocol);
            } else {
                http_response_code(404);
                echo json_encode(["error" => "Protokol tidak ditemukan"]);
            }
        } else {
            if ($researcher_id) {
                $stmt = $conn->prepare("SELECT * FROM protocols WHERE researcher_id = ? ORDER BY created_at DESC");
                $stmt->execute([$researcher_id]);
            } else {
                $stmt = $conn->query("SELECT * FROM protocols ORDER BY created_at DESC");
            }
            
            $protocols = $stmt->fetchAll();
            // Map generalInfo for list view if needed, but usually list view is simplified
            foreach ($protocols as &$p) {
                $p['generalInfo'] = ["mainResearcher" => $p['main_researcher']];
            }
            echo json_encode($protocols);
        }
        break;

    case 'save_protocol':
        if ($method !== 'POST') break;
        $p = $input;
        $id = $p['id'] ?? substr(md5(uniqid(mt_rand(), true)), 0, 9);
        $gi = $p['generalInfo'] ?? [];
        
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

            // Save reviewers
            if (isset($p['assignedReviewers'])) {
                $stmt = $conn->prepare("DELETE FROM protocol_reviewers WHERE protocol_id = ?");
                $stmt->execute([$id]);
                $stmt = $conn->prepare("INSERT INTO protocol_reviewers (protocol_id, reviewer_id) VALUES (?, ?)");
                foreach ($p['assignedReviewers'] as $rid) {
                    $stmt->execute([$id, $rid]);
                }
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
            echo json_encode(["success" => true, "id" => $id]);
        } catch(PDOException $e) {
            $conn->rollBack();
            http_response_code(500);
            echo json_encode(["error" => "Gagal menyimpan protokol: " . $e->getMessage()]);
        }
        break;

    case 'get_users':
        if ($method !== 'GET') break;
        $role = $_GET['role'] ?? null;
        
        if ($role) {
            $stmt = $conn->prepare("SELECT id, email, role, name, institution, phone FROM users WHERE role = ?");
            $stmt->execute([$role]);
        } else {
            $stmt = $conn->query("SELECT id, email, role, name, institution, phone FROM users");
        }
        
        $users = $stmt->fetchAll();
        echo json_encode($users);
        break;

    default:
        http_response_code(404);
        echo json_encode(["error" => "Action not found"]);
        break;
}
?>
