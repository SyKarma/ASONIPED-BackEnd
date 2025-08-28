-- Insert admin role
INSERT INTO user_roles (name, description) 
VALUES ('admin', 'Administrador del sistema con acceso completo');

-- Insert admin user with password hash (password: Admin123)
INSERT INTO users (username, email, password_hash, full_name, phone, status) 
VALUES (
    'Admin', -- username, change if you want
    'admin@asoniped.org', 
    '$2b$12$TmRbUwYgObLI1X6SHY52Q.mywhrMvRdqlfEv9M7v/ZIoBNhun03dG', -- password: Admin123, if u want a different password: https://bcrypt.online/
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

--node -e "console.log(require('bcrypt').hashSync('Admin123', 12))" 