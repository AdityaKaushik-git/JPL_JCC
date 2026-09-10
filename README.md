# JPL - JCC Player League Auction

A complete, production-quality real-time college player auction website inspired by IPL-style auctions.

## Features

- **Real-Time Auction Engine**: Powered by Socket.IO for seamless updates without page refreshes.
- **Race Condition Protection**: Database row-locking and transactions ensure robust bidding even under heavy load.
- **Role-Based Access**: Separate user and admin dashboards.
- **Secure Authentication**: Bcrypt password hashing and JWT-based session management.
- **Live Notifications**: Instant broadcast of bids, sold players, and auction state changes.
- **Dynamic Timer**: Server-synchronized countdown timer for every player.

## Technology Stack

- **Frontend**: HTML5, CSS3, JavaScript, Bootstrap 5
- **Backend**: Node.js, Express.js, Socket.IO
- **Database**: MySQL2 (with connection pooling)
- **Security**: bcrypt, jsonwebtoken

## Project Structure

\`\`\`text
JPL/
├── client/          # Frontend HTML, CSS, JS files
├── server/          # Backend Node.js logic
│   ├── config/      # DB configuration
│   ├── controllers/ # Route handlers
│   ├── middleware/  # JWT Auth & Role middlewares
│   ├── routes/      # Express API routes
│   └── sockets/     # Socket.IO event handlers
├── database/        # SQL schema and seed scripts
├── .env             # Environment variables
└── server.js        # Main entry point
\`\`\`

## Installation

1. **Clone the repository** (or extract the folder).
2. **Install dependencies**:
   \`\`\`bash
   npm install
   \`\`\`
3. **Configure MySQL**:
   - Create a database in your local MySQL server (default is \`jpl_auction\`).
   - Copy \`.env.example\` to \`.env\` and update your database credentials if necessary.

4. **Seed the Database**:
   - Run the provided node seed script to create tables and insert sample data.
   \`\`\`bash
   node database/seed.js
   \`\`\`

## Running the Application

1. **Start the server**:
   \`\`\`bash
   node server/server.js
   \`\`\`
   *(Or use \`nodemon server/server.js\` for development)*

2. **Access the application**:
   - Open your browser and go to \`http://localhost:3000\`

## Test Credentials

**Admin Account:**
- **Email/ID**: admin@jpl.com (or ADMIN001)
- **Password**: admin123

**Sample User Accounts:**
- **Email**: john@jpl.com (ENR001) | **Password**: user123
- **Email**: jane@jpl.com (ENR002) | **Password**: user123
- **Email**: alice@jpl.com (ENR003) | **Password**: user123

## Socket.IO Architecture

- **Auth**: Sockets authenticate via JWT sent in the handshake.
- **State Management**: The server is the absolute source of truth. It holds an \`activeAuction\` object in memory.
- **Broadcasting**: When an admin triggers an event (start, pause, sell), or a user places a valid bid, the state is updated and immediately broadcasted to all connected clients via \`auction:stateUpdate\`.
- **Timer**: Managed by a \`setInterval\` on the server. Clients passively display the time broadcasted by \`auction:timer\`.
- **Transactions**: Bids use \`FOR UPDATE\` locks to prevent duplicate simultaneous bids from circumventing purse checks.
