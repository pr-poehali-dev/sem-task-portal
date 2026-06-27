CREATE TABLE chat_messages (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    username VARCHAR(100) NOT NULL,
    message TEXT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

ALTER TABLE tasks ADD COLUMN IF NOT EXISTS status_cancelled BOOLEAN NOT NULL DEFAULT FALSE;

CREATE INDEX idx_chat_messages_created ON chat_messages(created_at DESC);