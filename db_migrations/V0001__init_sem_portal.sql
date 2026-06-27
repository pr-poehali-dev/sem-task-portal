CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    rank VARCHAR(100) NOT NULL DEFAULT 'Программист',
    is_owner BOOLEAN NOT NULL DEFAULT FALSE,
    token VARCHAR(255),
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE tasks (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    target_rank VARCHAR(100) NOT NULL,
    assigned_user_id INTEGER REFERENCES users(id),
    status VARCHAR(50) NOT NULL DEFAULT 'new',
    created_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE notifications (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    task_id INTEGER REFERENCES tasks(id),
    message TEXT NOT NULL,
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

INSERT INTO users (username, password, rank, is_owner)
VALUES ('DezeYT', 'ermolovo4', 'Владелец', TRUE);

CREATE INDEX idx_tasks_target_rank ON tasks(target_rank);
CREATE INDEX idx_tasks_assigned_user ON tasks(assigned_user_id);
CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_users_token ON users(token);