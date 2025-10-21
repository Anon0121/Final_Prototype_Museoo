-- Create the database if it doesn't exist
CREATE DATABASE IF NOT EXISTS museosmart;
USE museosmart;

-- Create system_user table
CREATE TABLE IF NOT EXISTS system_user (
    user_ID INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    firstname VARCHAR(50) NOT NULL,
    lastname VARCHAR(50) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role ENUM('admin', 'user') DEFAULT 'user',
    status ENUM('active', 'deactivated') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create bookings table
DROP TABLE IF EXISTS visitors;
DROP TABLE IF EXISTS bookings;

CREATE TABLE IF NOT EXISTS bookings (
    booking_id INT AUTO_INCREMENT PRIMARY KEY,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    type ENUM('individual', 'group') NOT NULL,
    status ENUM('pending', 'approved', 'checked-in', 'cancelled') DEFAULT 'pending',
    date DATE NOT NULL,
    time_slot VARCHAR(20) NOT NULL,
    total_visitors INT NOT NULL,
    checkin_time TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create visitors table
CREATE TABLE IF NOT EXISTS visitors (
    visitor_id INT AUTO_INCREMENT PRIMARY KEY,
    booking_id INT NOT NULL,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    gender ENUM('male', 'female', 'other') NOT NULL,
    address TEXT NOT NULL,
    email VARCHAR(100) NOT NULL,
    nationality VARCHAR(50) NOT NULL,
    purpose VARCHAR(30) NOT NULL,
    status ENUM('pending', 'visited', 'cancelled') DEFAULT 'pending',
    is_main_visitor BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (booking_id) REFERENCES bookings(booking_id) ON DELETE CASCADE
);

-- Create activities table (for events and exhibits)
CREATE TABLE IF NOT EXISTS activities (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    type ENUM('event', 'exhibit') NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create event_details table
CREATE TABLE IF NOT EXISTS event_details (
    id INT AUTO_INCREMENT PRIMARY KEY,
    activity_id INT NOT NULL,
    start_date DATE NOT NULL,
    time TIME NOT NULL,
    location VARCHAR(255) NOT NULL,
    organizer VARCHAR(255) NOT NULL,
    FOREIGN KEY (activity_id) REFERENCES activities(id) ON DELETE CASCADE
);

-- Create exhibit_details table
CREATE TABLE IF NOT EXISTS exhibit_details (
    id INT AUTO_INCREMENT PRIMARY KEY,
    activity_id INT NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    location VARCHAR(255) NOT NULL,
    curator VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL,
    FOREIGN KEY (activity_id) REFERENCES activities(id) ON DELETE CASCADE
);

-- Create images table
CREATE TABLE IF NOT EXISTS images (
    id INT AUTO_INCREMENT PRIMARY KEY,
    activity_id INT,
    cultural_object_id INT,
    url VARCHAR(500) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (activity_id) REFERENCES activities(id) ON DELETE CASCADE
);

-- Create archives table for digital archive
CREATE TABLE IF NOT EXISTS archives (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    date DATE,
    type VARCHAR(100) NOT NULL,
    tags VARCHAR(500),
    file_url VARCHAR(500) NOT NULL,
    uploaded_by VARCHAR(100) DEFAULT 'admin',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create donations table
CREATE TABLE IF NOT EXISTS donations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    donor_name VARCHAR(255) NOT NULL,
    donor_email VARCHAR(255) NOT NULL,
    donor_contact VARCHAR(100),
    type ENUM('monetary', 'artifact', 'document', 'loan') NOT NULL,
    date_received DATE,
    notes TEXT,
    status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create donation_details table
CREATE TABLE IF NOT EXISTS donation_details (
    id INT AUTO_INCREMENT PRIMARY KEY,
    donation_id INT NOT NULL,
    amount DECIMAL(15,2),
    method VARCHAR(100),
    item_description TEXT,
    estimated_value DECIMAL(15,2),
    `condition` VARCHAR(100),
    loan_start_date DATE,
    loan_end_date DATE,
    FOREIGN KEY (donation_id) REFERENCES donations(id) ON DELETE CASCADE
);

-- Main table: general info
CREATE TABLE IF NOT EXISTS cultural_objects (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Details table: extended info
CREATE TABLE IF NOT EXISTS object_details (
    id INT AUTO_INCREMENT PRIMARY KEY,
    cultural_object_id INT NOT NULL,
    period VARCHAR(100),
    origin VARCHAR(255),
    material VARCHAR(255),
    dimensions VARCHAR(100),
    condition_status ENUM('excellent', 'good', 'fair', 'poor', 'under_restoration') DEFAULT 'good',
    acquisition_date DATE,
    acquisition_method ENUM('purchase', 'donation', 'loan', 'excavation', 'other'),
    current_location VARCHAR(255),
    estimated_value DECIMAL(15,2),
    conservation_notes TEXT,
    exhibition_history TEXT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (cultural_object_id) REFERENCES cultural_objects(id) ON DELETE CASCADE
);

-- Insert a default admin user (password: admin123)
INSERT INTO system_user (username, firstname, lastname, password, role, status) 
VALUES ('admin', 'Admin', 'User', 'admin123', 'admin', 'active')
ON DUPLICATE KEY UPDATE username = username;

-- Show tables
SHOW TABLES; 