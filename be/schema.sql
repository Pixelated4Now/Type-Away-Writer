-- ============================================================
-- Type-Away-Writer — full database schema
-- All tables use CREATE TABLE IF NOT EXISTS so this file can
-- be run safely on every container startup.
-- ============================================================

CREATE TABLE IF NOT EXISTS users (
    id                 SERIAL PRIMARY KEY,
    username           VARCHAR(50)  UNIQUE NOT NULL,
    email              VARCHAR(255) UNIQUE NOT NULL,
    password           VARCHAR(255) NOT NULL,
    account_type       VARCHAR(10)  NOT NULL CHECK (account_type IN ('student', 'expert', 'admin')),
    date_of_birth      DATE,
    district           VARCHAR(100),
    is_verified        BOOLEAN DEFAULT FALSE,
    is_expert_verified BOOLEAN DEFAULT FALSE,
    is_active          BOOLEAN DEFAULT TRUE,
    avatar_url         VARCHAR(500),
    reset_token        VARCHAR(255),
    reset_token_expiry TIMESTAMP,
    created_at         TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS email_verification_codes (
    id         SERIAL PRIMARY KEY,
    user_id    INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    code       VARCHAR(6) NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS categories (
    id         SERIAL PRIMARY KEY,
    name       VARCHAR(100) UNIQUE NOT NULL,
    image_path VARCHAR(500)
);

CREATE TABLE IF NOT EXISTS tags (
    id   SERIAL PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL
);

CREATE TABLE IF NOT EXISTS stories (
    id                 SERIAL PRIMARY KEY,
    title              VARCHAR(300) NOT NULL,
    summary            TEXT,
    cover_image_url    VARCHAR(500),
    author_id          INT NOT NULL REFERENCES users(id),
    category_id        INT REFERENCES categories(id),
    status             VARCHAR(10) DEFAULT 'draft'     CHECK (status IN ('draft', 'published')),
    comment_permission VARCHAR(10) DEFAULT 'everyone'  CHECK (comment_permission IN ('everyone', 'experts', 'none')),
    likes_count        INT DEFAULT 0,
    created_at         TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at         TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS story_collaborators (
    story_id INT NOT NULL REFERENCES stories(id) ON DELETE CASCADE,
    user_id  INT NOT NULL REFERENCES users(id)  ON DELETE CASCADE,
    PRIMARY KEY (story_id, user_id)
);

CREATE TABLE IF NOT EXISTS chapters (
    id             SERIAL PRIMARY KEY,
    story_id       INT NOT NULL REFERENCES stories(id) ON DELETE CASCADE,
    chapter_number INT NOT NULL,
    title          VARCHAR(300),
    content        TEXT,
    created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS story_tags (
    story_id INT NOT NULL REFERENCES stories(id) ON DELETE CASCADE,
    tag_id   INT NOT NULL REFERENCES tags(id)    ON DELETE CASCADE,
    PRIMARY KEY (story_id, tag_id)
);

CREATE TABLE IF NOT EXISTS comments (
    id         SERIAL PRIMARY KEY,
    story_id   INT NOT NULL  REFERENCES stories(id)  ON DELETE CASCADE,
    chapter_id INT           REFERENCES chapters(id) ON DELETE SET NULL,
    user_id    INT NOT NULL  REFERENCES users(id)    ON DELETE CASCADE,
    parent_id  INT           REFERENCES comments(id) ON DELETE CASCADE,
    content    TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS likes (
    user_id  INT NOT NULL REFERENCES users(id)   ON DELETE CASCADE,
    story_id INT NOT NULL REFERENCES stories(id) ON DELETE CASCADE,
    PRIMARY KEY (user_id, story_id)
);

CREATE TABLE IF NOT EXISTS reading_lists (
    id         SERIAL PRIMARY KEY,
    user_id    INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title      VARCHAR(100) NOT NULL,
    is_public  BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS reading_list_stories (
    reading_list_id INT NOT NULL REFERENCES reading_lists(id) ON DELETE CASCADE,
    story_id        INT NOT NULL REFERENCES stories(id)       ON DELETE CASCADE,
    added_at        TIMESTAMP DEFAULT NOW(),
    PRIMARY KEY (reading_list_id, story_id)
);

-- ============================================================
-- Seed data  (safe to re-run — ignored if rows already exist)
-- ============================================================

INSERT INTO categories (name) VALUES
    ('Adventure'), ('Animal Stories'), ('Comedy'), ('Fantasy'),
    ('Friendship'), ('Horror'), ('Mystery'), ('Nature'),
    ('Romance'), ('Science Fiction'), ('School Life'), ('Sports'),
    ('Superheroes'), ('Historical')
ON CONFLICT DO NOTHING;

INSERT INTO tags (name) VALUES
    ('happy'), ('sad'), ('danger'), ('school'), ('family'),
    ('friendship'), ('funny'), ('dark'), ('magic'), ('adventure'),
    ('animals'), ('mystery'), ('love'), ('action'), ('nature'),
    ('fear'), ('hope'), ('courage'), ('teamwork'), ('dreams')
ON CONFLICT DO NOTHING;
