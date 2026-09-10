-- Tables for JPL Auction
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    full_name VARCHAR(100) NOT NULL,
    enrollment_number VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    mobile VARCHAR(20) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('user', 'admin', 'player') DEFAULT 'user',
    purse DECIMAL(15,2) DEFAULT 30000000.00,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE players (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    photo_url VARCHAR(255) DEFAULT NULL,
    playing_role ENUM('Batsman', 'Bowler', 'All-Rounder', 'Wicket Keeper') NOT NULL,
    course VARCHAR(50) NOT NULL,
    year VARCHAR(20) NOT NULL,
    enrollment_number VARCHAR(50) UNIQUE NOT NULL,
    base_price DECIMAL(10,2) NOT NULL,
    status ENUM('Available', 'In Auction', 'Sold', 'Unsold') DEFAULT 'Available',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE auctions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    player_id INT NOT NULL,
    status ENUM('Pending', 'Live', 'Paused', 'Completed') DEFAULT 'Pending',
    current_bid DECIMAL(10,2) DEFAULT 0.00,
    highest_bidder_id INT DEFAULT NULL,
    start_time TIMESTAMP NULL,
    end_time TIMESTAMP NULL,
    FOREIGN KEY (player_id) REFERENCES players(id),
    FOREIGN KEY (highest_bidder_id) REFERENCES users(id)
);

CREATE TABLE bids (
    id INT AUTO_INCREMENT PRIMARY KEY,
    auction_id INT NOT NULL,
    user_id INT NOT NULL,
    bid_amount DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (auction_id) REFERENCES auctions(id),
    FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE teams (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    player_id INT NOT NULL,
    purchase_price DECIMAL(10,2) NOT NULL,
    purchased_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (player_id) REFERENCES players(id)
);

CREATE TABLE auction_results (
    id INT AUTO_INCREMENT PRIMARY KEY,
    auction_id INT NOT NULL,
    player_id INT NOT NULL,
    status ENUM('Sold', 'Unsold') NOT NULL,
    winning_bid DECIMAL(10,2) DEFAULT NULL,
    winning_user_id INT DEFAULT NULL,
    completed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (auction_id) REFERENCES auctions(id),
    FOREIGN KEY (player_id) REFERENCES players(id),
    FOREIGN KEY (winning_user_id) REFERENCES users(id)
);
