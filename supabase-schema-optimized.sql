-- Optimized Supabase Schema for Free Tier
-- Hybrid Approach: Compressed data in existing structure

-- Portfolio table with compressed data
CREATE TABLE IF NOT EXISTS portfolio (
    id SERIAL PRIMARY KEY,
    user_id TEXT NOT NULL,
    asset_type TEXT NOT NULL,
    compressed_data TEXT NOT NULL, -- LZ-compressed JSON
    last_updated TIMESTAMP DEFAULT NOW(),
    UNIQUE(user_id, asset_type)
);

-- Transactions table with compressed data
CREATE TABLE IF NOT EXISTS transactions (
    id SERIAL PRIMARY KEY,
    user_id TEXT NOT NULL,
    compressed_data TEXT NOT NULL, -- All transactions in one compressed record
    last_updated TIMESTAMP DEFAULT NOW(),
    UNIQUE(user_id)
);

-- User settings table with compressed data
CREATE TABLE IF NOT EXISTS user_settings (
    id SERIAL PRIMARY KEY,
    user_id TEXT NOT NULL,
    compressed_data TEXT NOT NULL, -- All settings in one compressed record
    last_updated TIMESTAMP DEFAULT NOW(),
    UNIQUE(user_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_portfolio_user_id ON portfolio(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_settings_user_id ON user_settings(user_id);

-- Enable Row Level Security
ALTER TABLE portfolio ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies (users can only access their own data)
CREATE POLICY "Users can view own portfolio" ON portfolio
    FOR SELECT USING (auth.uid()::text = user_id);

CREATE POLICY "Users can insert own portfolio" ON portfolio
    FOR INSERT WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can update own portfolio" ON portfolio
    FOR UPDATE USING (auth.uid()::text = user_id);

CREATE POLICY "Users can view own transactions" ON transactions
    FOR SELECT USING (auth.uid()::text = user_id);

CREATE POLICY "Users can insert own transactions" ON transactions
    FOR INSERT WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can update own transactions" ON transactions
    FOR UPDATE USING (auth.uid()::text = user_id);

CREATE POLICY "Users can view own settings" ON user_settings
    FOR SELECT USING (auth.uid()::text = user_id);

CREATE POLICY "Users can insert own settings" ON user_settings
    FOR INSERT WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can update own settings" ON user_settings
    FOR UPDATE USING (auth.uid()::text = user_id);
