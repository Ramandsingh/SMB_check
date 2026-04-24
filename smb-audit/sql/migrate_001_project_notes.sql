-- Add project_notes table (safe to run multiple times due to IF NOT EXISTS)
CREATE TABLE IF NOT EXISTS project_notes (
  id        INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  category  ENUM('release','prd','general') NOT NULL DEFAULT 'general',
  title     VARCHAR(255) NOT NULL,
  content   LONGTEXT NOT NULL DEFAULT '',
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
