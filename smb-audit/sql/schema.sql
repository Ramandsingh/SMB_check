-- Run this once to create the database schema
-- mysql -u <user> -p <database> < sql/schema.sql

CREATE TABLE IF NOT EXISTS audits (
  id           INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  businessName VARCHAR(255) NOT NULL,
  abn          VARCHAR(50),
  contactName  VARCHAR(255),
  contactPhone VARCHAR(50),
  auditorName  VARCHAR(255),
  auditDate    VARCHAR(20),
  loanAmount   VARCHAR(50),
  loanPurpose  VARCHAR(500),
  answers      JSON,
  domainNotes  JSON,
  generalNotes TEXT,
  aiInsights   JSON,
  createdAt    DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt    DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
