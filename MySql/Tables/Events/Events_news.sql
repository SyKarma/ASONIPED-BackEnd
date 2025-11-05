CREATE TABLE events_news (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  date VARCHAR(50) NOT NULL,
  imageUrl VARCHAR(500),
  hour VARCHAR(10),
  type ENUM('evento', 'noticia') DEFAULT 'evento'
);


--if you need to change it
ALTER TABLE events_news 
ADD COLUMN type ENUM('evento', 'noticia') DEFAULT 'evento';

-- add hour column if missing
ALTER TABLE events_news 
ADD COLUMN hour VARCHAR(10);
