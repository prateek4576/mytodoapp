# ToDo List Web Application

A full-stack web application for managing tasks with secure user authentication and a responsive design.

## Features
- User registration and login with email/password or Google OAuth.
- Task creation, editing, and deletion (delete available for completed tasks).
- Secure password hashing with bcrypt.
- Responsive UI with Bootstrap 5 and custom CSS.

## Technologies Used
- **Backend**: Node.js, Express.js, PostgreSQL, Passport.js, bcrypt, express-session
- **Frontend**: EJS, Bootstrap 5, custom CSS
- **Tools**: Git, Nodemon, dotenv

## Setup Instructions
1. **Clone the Repository**:
   ```bash
   git clone https://github.com/Jatin-1406/todo-list.git
   cd todo-list

2. **Install Dependencies:**

       npm install

3. **Create a .env file in the root directory with the following:**

         DB_USER=postgres
         DB_PASSWORD=your_postgres_password
         SESSION_SECRET=your_session_secret
         GOOGLE_CLIENT_ID=your_google_client_id
         GOOGLE_CLIENT_SECRET=your_google_client_secret
   
4. **Run the following SQL to create tables:**

         CREATE DATABASE todo_db;
      
         CREATE TABLE users (
          id SERIAL PRIMARY KEY,
          email VARCHAR(255) UNIQUE NOT NULL,
          password VARCHAR(255),
          google_id VARCHAR(255)
            );

         CREATE TABLE tasks (
          id SERIAL PRIMARY KEY,
          user_id INTEGER REFERENCES users(id),
          title VARCHAR(255) NOT NULL,
          description TEXT,
          completed BOOLEAN DEFAULT false,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
  
