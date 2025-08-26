CREATE TABLE workshops (
    id VARCHAR(50) PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    imageUrl VARCHAR(255) NOT NULL,
    objectives TEXT NOT NULL,  -- Store as JSON string
    materials TEXT NOT NULL,   -- Store as JSON string
    learnText TEXT NOT NULL
);