-- Database SIM-KEPK FKp UNAIR
-- Generated for phpMyAdmin / MySQL

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `id` varchar(50) NOT NULL,
  `email` varchar(100) NOT NULL,
  `password` varchar(255) NOT NULL,
  `role` enum('RESEARCHER','REVIEWER','ADMIN') NOT NULL DEFAULT 'RESEARCHER',
  `name` varchar(150) NOT NULL,
  `place_of_birth` varchar(100) DEFAULT NULL,
  `date_of_birth` date DEFAULT NULL,
  `gender` varchar(20) DEFAULT NULL,
  `last_education` varchar(50) DEFAULT NULL,
  `status` varchar(50) DEFAULT NULL, -- D3, D4, S1, S2, S3, Dosen/Umum
  `institution` varchar(150) DEFAULT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------

--
-- Table structure for table `protocols`
--

CREATE TABLE `protocols` (
  `id` varchar(50) NOT NULL,
  `researcher_id` varchar(50) NOT NULL,
  `registration_number` varchar(50) DEFAULT NULL,
  `title` text NOT NULL,
  `status` enum('DRAFT','SUBMITTED','ASSIGNED','REVIEWING','REVISION_REQUIRED','APPROVED','REJECTED') NOT NULL DEFAULT 'DRAFT',
  `classification` enum('CONTINUING','EXEMPT','EXPEDITED','FULLBOARD') DEFAULT NULL,
  `submitted_at` datetime DEFAULT NULL,
  `main_researcher` varchar(150) DEFAULT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `members` text DEFAULT NULL,
  `organizing_institution` varchar(150) DEFAULT NULL,
  `collaboration_type` varchar(100) DEFAULT NULL,
  `design` varchar(100) DEFAULT NULL,
  `location` varchar(255) DEFAULT NULL,
  `time` varchar(100) DEFAULT NULL,
  `data_collection_time` varchar(100) DEFAULT NULL,
  `previous_submission` varchar(100) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------

--
-- Table structure for table `protocol_team`
--

CREATE TABLE `protocol_team` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `protocol_id` varchar(50) NOT NULL,
  `name` varchar(150) NOT NULL,
  `task` varchar(150) NOT NULL,
  `contact` varchar(100) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------

--
-- Table structure for table `protocol_screening`
--

CREATE TABLE `protocol_screening` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `protocol_id` varchar(50) NOT NULL,
  `question_index` int(11) NOT NULL,
  `answer` text DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------

--
-- Table structure for table `protocol_attachments`
--

CREATE TABLE `protocol_attachments` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `protocol_id` varchar(50) NOT NULL,
  `type` varchar(50) NOT NULL, -- PROPOSAL, PSP, IC, INSTRUMENTS, PAYMENT_PROOF, SUPPORTING
  `file_path` varchar(255) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------

--
-- Table structure for table `protocol_reviewers`
--

CREATE TABLE `protocol_reviewers` (
  `protocol_id` varchar(50) NOT NULL,
  `reviewer_id` varchar(50) NOT NULL,
  PRIMARY KEY (`protocol_id`,`reviewer_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------

--
-- Table structure for table `reviews`
--

CREATE TABLE `reviews` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `protocol_id` varchar(50) NOT NULL,
  `reviewer_id` varchar(50) NOT NULL,
  `reviewer_name` varchar(150) DEFAULT NULL,
  `assigned_at` datetime NOT NULL,
  `submitted_at` datetime DEFAULT NULL,
  `review_file` varchar(255) DEFAULT NULL,
  `conclusion` enum('APPROVED','CONDITIONAL','ADDITIONAL_INFO','REJECTED') DEFAULT NULL,
  `notes` text DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------

--
-- Table structure for table `revisions`
--

CREATE TABLE `revisions` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `protocol_id` varchar(50) NOT NULL,
  `submitted_at` datetime NOT NULL,
  `protocol_file` varchar(255) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------

--
-- Table structure for table `reports`
--

CREATE TABLE `reports` (
  `id` varchar(50) NOT NULL,
  `protocol_id` varchar(50) NOT NULL,
  `type` enum('PROGRESS','FINAL','AMENDMENT') NOT NULL,
  `submitted_at` datetime NOT NULL,
  `file` varchar(255) NOT NULL,
  `status` enum('SUBMITTED','APPROVED') NOT NULL DEFAULT 'SUBMITTED',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

--
-- Indexes for dumped tables
--

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`email`);

--
-- Indexes for table `protocols`
--
ALTER TABLE `protocols`
  ADD PRIMARY KEY (`id`),
  ADD KEY `researcher_id` (`researcher_id`);

--
-- Constraints for dumped tables
--

--
-- Constraints for table `protocols`
--
ALTER TABLE `protocols`
  ADD CONSTRAINT `protocols_ibfk_1` FOREIGN KEY (`researcher_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `protocol_team`
--
ALTER TABLE `protocol_team`
  ADD CONSTRAINT `protocol_team_ibfk_1` FOREIGN KEY (`protocol_id`) REFERENCES `protocols` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `protocol_screening`
--
ALTER TABLE `protocol_screening`
  ADD CONSTRAINT `protocol_screening_ibfk_1` FOREIGN KEY (`protocol_id`) REFERENCES `protocols` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `protocol_attachments`
--
ALTER TABLE `protocol_attachments`
  ADD CONSTRAINT `protocol_attachments_ibfk_1` FOREIGN KEY (`protocol_id`) REFERENCES `protocols` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `protocol_reviewers`
--
ALTER TABLE `protocol_reviewers`
  ADD CONSTRAINT `protocol_reviewers_ibfk_1` FOREIGN KEY (`protocol_id`) REFERENCES `protocols` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `protocol_reviewers_ibfk_2` FOREIGN KEY (`reviewer_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `reviews`
--
ALTER TABLE `reviews`
  ADD CONSTRAINT `reviews_ibfk_1` FOREIGN KEY (`protocol_id`) REFERENCES `protocols` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `reviews_ibfk_2` FOREIGN KEY (`reviewer_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `revisions`
--
ALTER TABLE `revisions`
  ADD CONSTRAINT `revisions_ibfk_1` FOREIGN KEY (`protocol_id`) REFERENCES `protocols` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `reports`
--
ALTER TABLE `reports`
  ADD CONSTRAINT `reports_ibfk_1` FOREIGN KEY (`protocol_id`) REFERENCES `protocols` (`id`) ON DELETE CASCADE;

COMMIT;
