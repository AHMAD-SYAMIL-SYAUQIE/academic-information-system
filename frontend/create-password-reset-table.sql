-- Create password_reset_otp table
CREATE TABLE IF NOT EXISTS password_reset_otp (
  uuid VARCHAR(36) PRIMARY KEY,
  userUuid VARCHAR(36) NOT NULL,
  otp VARCHAR(6) NOT NULL,
  expiredAt DATETIME NOT NULL,
  isUsed BOOLEAN DEFAULT FALSE,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (userUuid) REFERENCES user(uuid) ON DELETE CASCADE,
  INDEX idx_userUuid (userUuid),
  INDEX idx_otp (otp),
  INDEX idx_expiredAt (expiredAt)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
