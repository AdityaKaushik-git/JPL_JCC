USE jpl_auction;

-- Insert Admin
-- password is 'admin123'
INSERT INTO users (full_name, enrollment_number, email, mobile, password_hash, role, purse) VALUES
('Admin User', 'ADMIN001', 'admin@jpl.com', '1234567890', '$2b$10$Q7ZpYvjQ5F1f9g5V9g5V9O5V9g5V9g5V9g5V9g5V9g5V9g5V9g5V9', 'admin', 0);

-- Insert Users
-- passwords are 'user123'
INSERT INTO users (full_name, enrollment_number, email, mobile, password_hash, role, purse) VALUES
('John Doe', 'ENR001', 'john@jpl.com', '9876543210', '$2b$10$T8ZpYvjQ5F1f9g5V9g5V9O5V9g5V9g5V9g5V9g5V9g5V9g5V9g5V9', 'user', 100000.00),
('Jane Smith', 'ENR002', 'jane@jpl.com', '9876543211', '$2b$10$T8ZpYvjQ5F1f9g5V9g5V9O5V9g5V9g5V9g5V9g5V9g5V9g5V9g5V9', 'user', 100000.00),
('Alice Johnson', 'ENR003', 'alice@jpl.com', '9876543212', '$2b$10$T8ZpYvjQ5F1f9g5V9g5V9O5V9g5V9g5V9g5V9g5V9g5V9g5V9g5V9', 'user', 100000.00);

-- Insert Players
INSERT INTO players (name, playing_role, course, year, enrollment_number, base_price, status) VALUES
('Rohit Sharma', 'Batsman', 'BTech', '4', 'P001', 10000.00, 'Available'),
('Virat Kohli', 'Batsman', 'BCA', '3', 'P002', 15000.00, 'Available'),
('Jasprit Bumrah', 'Bowler', 'BBA', '2', 'P003', 12000.00, 'Available'),
('Hardik Pandya', 'All-Rounder', 'BTech', '3', 'P004', 14000.00, 'Available'),
('MS Dhoni', 'Wicket Keeper', 'MBA', '2', 'P005', 20000.00, 'Available'),
('Ravindra Jadeja', 'All-Rounder', 'BSc', '3', 'P006', 11000.00, 'Available'),
('Rishabh Pant', 'Wicket Keeper', 'BTech', '2', 'P007', 10000.00, 'Available'),
('Mohammed Shami', 'Bowler', 'MCA', '2', 'P008', 9000.00, 'Available'),
('KL Rahul', 'Batsman', 'BTech', '4', 'P009', 11000.00, 'Available'),
('Suryakumar Yadav', 'Batsman', 'BBA', '3', 'P010', 13000.00, 'Available');
