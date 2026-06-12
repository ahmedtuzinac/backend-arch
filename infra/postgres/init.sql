-- Create databases for each service
CREATE DATABASE auth_db;
CREATE DATABASE websocket_db;
CREATE DATABASE files_db;

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE auth_db TO postgres;
GRANT ALL PRIVILEGES ON DATABASE websocket_db TO postgres;
GRANT ALL PRIVILEGES ON DATABASE files_db TO postgres;
