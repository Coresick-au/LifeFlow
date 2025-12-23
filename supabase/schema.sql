-- LifeFlow Supabase Schema
-- Run this in your Supabase SQL Editor (Dashboard > SQL Editor)

-- ==============================================
-- TABLES
-- ==============================================

-- Users profile extension (Supabase auth handles core user)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  birth_date DATE NOT NULL,
  birth_location TEXT,
  location TEXT,
  hometown TEXT,
  bio TEXT,
  avatar_url TEXT,
  family JSONB DEFAULT '[]',
  blood_type TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Stories
CREATE TABLE IF NOT EXISTS stories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  type TEXT CHECK (type IN ('short', 'long')) DEFAULT 'short',
  date DATE NOT NULL,
  end_date DATE,
  fuzzy_date BOOLEAN DEFAULT FALSE,
  tags TEXT[] DEFAULT '{}',
  people TEXT[] DEFAULT '{}',
  importance TEXT CHECK (importance IN ('low', 'medium', 'high')) DEFAULT 'medium',
  location TEXT,
  images TEXT[] DEFAULT '{}',
  metadata JSONB DEFAULT '{}',
  locked_until TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Thoughts
CREATE TABLE IF NOT EXISTS thoughts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  type TEXT CHECK (type IN ('idea', 'observation', 'pondering', 'note')) DEFAULT 'note',
  tags TEXT[] DEFAULT '{}',

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Todos
CREATE TABLE IF NOT EXISTS todos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT CHECK (status IN ('active', 'completed', 'archived')) DEFAULT 'active',
  priority TEXT CHECK (priority IN ('low', 'medium', 'high')) DEFAULT 'medium',
  due_date TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  archived_at TIMESTAMPTZ,
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Relationships (people in your life)
CREATE TABLE IF NOT EXISTS relationships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT,
  full_name TEXT GENERATED ALWAYS AS (first_name || COALESCE(' ' || last_name, '')) STORED,
  relationship_type TEXT NOT NULL,
  interaction_count INTEGER DEFAULT 0,
  notes TEXT,
  start_date DATE DEFAULT CURRENT_DATE,
  end_date DATE,
  is_current BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Wealth Items
CREATE TABLE IF NOT EXISTS wealth_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  category TEXT CHECK (category IN ('savings', 'investment', 'business', 'superannuation', 'debt', 'other')) NOT NULL,
  name TEXT NOT NULL,
  value NUMERIC NOT NULL,
  is_liquid BOOLEAN DEFAULT TRUE,
  last_updated TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Wealth History (tracks value changes)
CREATE TABLE IF NOT EXISTS wealth_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  wealth_item_id UUID REFERENCES wealth_items(id) ON DELETE CASCADE NOT NULL,
  wealth_item_name TEXT NOT NULL,
  previous_value NUMERIC NOT NULL,
  new_value NUMERIC NOT NULL,
  change_amount NUMERIC NOT NULL,
  note TEXT,
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- Preferences (likes/dislikes)
CREATE TABLE IF NOT EXISTS preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  item TEXT NOT NULL,
  category TEXT NOT NULL,
  type TEXT CHECK (type IN ('like', 'dislike')) NOT NULL,
  date_added TIMESTAMPTZ DEFAULT NOW()
);

-- Managed Tags
CREATE TABLE IF NOT EXISTS managed_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  color TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Advice
CREATE TABLE IF NOT EXISTS advice (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  category TEXT CHECK (category IN ('life', 'career', 'financial', 'relationships', 'health')) NOT NULL,
  source TEXT,
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);


-- ==============================================
-- ROW LEVEL SECURITY (RLS)
-- ==============================================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE stories ENABLE ROW LEVEL SECURITY;
ALTER TABLE thoughts ENABLE ROW LEVEL SECURITY;
ALTER TABLE todos ENABLE ROW LEVEL SECURITY;
ALTER TABLE relationships ENABLE ROW LEVEL SECURITY;
ALTER TABLE wealth_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE wealth_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE managed_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE advice ENABLE ROW LEVEL SECURITY;

-- Profiles policies (uses id, not user_id)
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- Stories policies
CREATE POLICY "Users can view own stories" ON stories
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own stories" ON stories
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own stories" ON stories
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own stories" ON stories
  FOR DELETE USING (auth.uid() = user_id);

-- Thoughts policies
CREATE POLICY "Users can view own thoughts" ON thoughts
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own thoughts" ON thoughts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own thoughts" ON thoughts
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own thoughts" ON thoughts
  FOR DELETE USING (auth.uid() = user_id);

-- Todos policies
CREATE POLICY "Users can view own todos" ON todos
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own todos" ON todos
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own todos" ON todos
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own todos" ON todos
  FOR DELETE USING (auth.uid() = user_id);

-- Relationships policies
CREATE POLICY "Users can view own relationships" ON relationships
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own relationships" ON relationships
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own relationships" ON relationships
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own relationships" ON relationships
  FOR DELETE USING (auth.uid() = user_id);

-- Wealth items policies
CREATE POLICY "Users can view own wealth_items" ON wealth_items
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own wealth_items" ON wealth_items
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own wealth_items" ON wealth_items
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own wealth_items" ON wealth_items
  FOR DELETE USING (auth.uid() = user_id);

-- Wealth history policies
CREATE POLICY "Users can view own wealth_history" ON wealth_history
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own wealth_history" ON wealth_history
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Preferences policies
CREATE POLICY "Users can view own preferences" ON preferences
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own preferences" ON preferences
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own preferences" ON preferences
  FOR DELETE USING (auth.uid() = user_id);

-- Managed tags policies
CREATE POLICY "Users can view own managed_tags" ON managed_tags
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own managed_tags" ON managed_tags
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own managed_tags" ON managed_tags
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own managed_tags" ON managed_tags
  FOR DELETE USING (auth.uid() = user_id);

-- Advice policies
CREATE POLICY "Users can view own advice" ON advice
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own advice" ON advice
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own advice" ON advice
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own advice" ON advice
  FOR DELETE USING (auth.uid() = user_id);


-- ==============================================
-- INDEXES (for query performance)
-- ==============================================

CREATE INDEX IF NOT EXISTS idx_stories_user_id ON stories(user_id);
CREATE INDEX IF NOT EXISTS idx_stories_date ON stories(date);
CREATE INDEX IF NOT EXISTS idx_thoughts_user_id ON thoughts(user_id);
CREATE INDEX IF NOT EXISTS idx_todos_user_id ON todos(user_id);
CREATE INDEX IF NOT EXISTS idx_todos_status ON todos(status);
CREATE INDEX IF NOT EXISTS idx_relationships_user_id ON relationships(user_id);
CREATE INDEX IF NOT EXISTS idx_wealth_items_user_id ON wealth_items(user_id);
CREATE INDEX IF NOT EXISTS idx_wealth_history_user_id ON wealth_history(user_id);
CREATE INDEX IF NOT EXISTS idx_wealth_history_item_id ON wealth_history(wealth_item_id);


-- ==============================================
-- FUNCTIONS & TRIGGERS
-- ==============================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply trigger to tables with updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_stories_updated_at BEFORE UPDATE ON stories
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_relationships_updated_at BEFORE UPDATE ON relationships
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
