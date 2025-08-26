-- Insert admin role
INSERT INTO user_roles (name, description) 
VALUES ('admin', 'Administrador del sistema con acceso completo');

-- Insert admin user with password hash (password: admin123)
INSERT INTO users (username, email, password_hash, full_name, phone, status) 
VALUES (
    'admin', -- username, change if you want
    'admin@asoniped.org', 
    '$2y$10$gggRgZMRUyx6Xl/oYZqehus7cvAKRUhggNuwQhnpY4Y2zb/nsuv5S', -- password: admin123, if u want a different password: https://bcrypt.online/
    'Administrador del Sistema', 
    '8888-8888', 
    'active'
);

-- Assign admin role to the user
INSERT INTO user_role_assignments (user_id, role_id) 
VALUES (
    (SELECT id FROM users WHERE username = 'admin'),
    (SELECT id FROM user_roles WHERE name = 'admin')
);

