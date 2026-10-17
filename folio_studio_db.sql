-- Folio Studio: multi-user portfolio generator (MySQL / MariaDB, phpMyAdmin Import)
-- Unique database name so it never clashes with your other projects.
CREATE DATABASE IF NOT EXISTS `folio_studio_db` CHARACTER SET utf8mb4;
USE `folio_studio_db`;

CREATE TABLE IF NOT EXISTS `portfolios` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `slug` VARCHAR(80) NOT NULL UNIQUE,
  `name` VARCHAR(100) NOT NULL,
  `title` VARCHAR(200) NOT NULL,
  `tagline` VARCHAR(255),
  `about` TEXT NOT NULL,
  `email` VARCHAR(150) NOT NULL,
  `phone` VARCHAR(40),
  `location` VARCHAR(120),
  `github` VARCHAR(255),
  `linkedin` VARCHAR(255),
  `image` VARCHAR(255),
  `template` VARCHAR(20) NOT NULL DEFAULT 'sketch',
  `pin_hash` VARCHAR(200) NOT NULL,
  `views` INT NOT NULL DEFAULT 0,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS `skills` (
  `id` INT AUTO_INCREMENT PRIMARY KEY, `portfolio_id` INT NOT NULL,
  `name` VARCHAR(80) NOT NULL, `level` TINYINT UNSIGNED NOT NULL DEFAULT 80, `category` VARCHAR(60),
  FOREIGN KEY (`portfolio_id`) REFERENCES `portfolios`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS `education` (
  `id` INT AUTO_INCREMENT PRIMARY KEY, `portfolio_id` INT NOT NULL,
  `degree` VARCHAR(150) NOT NULL, `institute` VARCHAR(150) NOT NULL, `period` VARCHAR(60), `details` TEXT,
  FOREIGN KEY (`portfolio_id`) REFERENCES `portfolios`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS `experience` (
  `id` INT AUTO_INCREMENT PRIMARY KEY, `portfolio_id` INT NOT NULL,
  `role` VARCHAR(150) NOT NULL, `company` VARCHAR(150) NOT NULL, `period` VARCHAR(60), `details` TEXT,
  FOREIGN KEY (`portfolio_id`) REFERENCES `portfolios`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS `projects` (
  `id` INT AUTO_INCREMENT PRIMARY KEY, `portfolio_id` INT NOT NULL,
  `title` VARCHAR(150) NOT NULL, `description` TEXT NOT NULL, `tech` VARCHAR(255), `link` VARCHAR(255),
  FOREIGN KEY (`portfolio_id`) REFERENCES `portfolios`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS `posts` (
  `id` INT AUTO_INCREMENT PRIMARY KEY, `portfolio_id` INT NOT NULL,
  `title` VARCHAR(200) NOT NULL, `content` TEXT, `link` VARCHAR(255),
  FOREIGN KEY (`portfolio_id`) REFERENCES `portfolios`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS `messages` (
  `id` INT AUTO_INCREMENT PRIMARY KEY, `portfolio_id` INT NOT NULL,
  `name` VARCHAR(100) NOT NULL, `email` VARCHAR(150) NOT NULL, `message` TEXT NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`portfolio_id`) REFERENCES `portfolios`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB;
