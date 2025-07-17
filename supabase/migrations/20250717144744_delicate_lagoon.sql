/*
  # Budget Buddy Database Schema

  1. New Tables
    - `profiles`
      - `id` (uuid, references auth.users)
      - `name` (text)
      - `email` (text)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `categories`
      - `id` (uuid, primary key)
      - `name` (text, unique)
      - `type` (text, 'income' or 'expense')
      - `color` (text)
      - `icon` (text)
      - `is_default` (boolean)
    
    - `transactions`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references profiles)
      - `title` (text)
      - `amount` (decimal)
      - `type` (text, 'income' or 'expense')
      - `category_id` (uuid, references categories)
      - `date` (date)
      - `notes` (text, optional)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `budgets`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references profiles)
      - `category_id` (uuid, references categories)
      - `amount` (decimal)
      - `period` (text, 'monthly' or 'yearly')
      - `month` (integer)
      - `year` (integer)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `ai_suggestions`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references profiles)
      - `suggestion_text` (text)
      - `suggestion_type` (text)
      - `created_at` (timestamp)
      - `is_read` (boolean)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to manage their own data
    - Add policies for reading default categories
*/

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  email text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create categories table
CREATE TABLE IF NOT EXISTS categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  type text NOT NULL CHECK (type IN ('income', 'expense')),
  color text NOT NULL DEFAULT '#6B7280',
  icon text NOT NULL DEFAULT 'circle',
  is_default boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Create transactions table
CREATE TABLE IF NOT EXISTS transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title text NOT NULL,
  amount decimal(12,2) NOT NULL CHECK (amount > 0),
  type text NOT NULL CHECK (type IN ('income', 'expense')),
  category_id uuid NOT NULL REFERENCES categories(id),
  date date NOT NULL DEFAULT CURRENT_DATE,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create budgets table
CREATE TABLE IF NOT EXISTS budgets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  category_id uuid NOT NULL REFERENCES categories(id),
  amount decimal(12,2) NOT NULL CHECK (amount > 0),
  period text NOT NULL CHECK (period IN ('monthly', 'yearly')) DEFAULT 'monthly',
  month integer CHECK (month >= 1 AND month <= 12),
  year integer NOT NULL DEFAULT EXTRACT(year FROM CURRENT_DATE),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, category_id, period, month, year)
);

-- Create ai_suggestions table
CREATE TABLE IF NOT EXISTS ai_suggestions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  suggestion_text text NOT NULL,
  suggestion_type text NOT NULL DEFAULT 'general',
  created_at timestamptz DEFAULT now(),
  is_read boolean DEFAULT false
);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_suggestions ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can read own profile"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Categories policies
CREATE POLICY "Anyone can read default categories"
  ON categories
  FOR SELECT
  TO authenticated
  USING (is_default = true);

CREATE POLICY "Users can read all categories"
  ON categories
  FOR SELECT
  TO authenticated
  USING (true);

-- Transactions policies
CREATE POLICY "Users can manage own transactions"
  ON transactions
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Budgets policies
CREATE POLICY "Users can manage own budgets"
  ON budgets
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- AI suggestions policies
CREATE POLICY "Users can read own suggestions"
  ON ai_suggestions
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "System can insert suggestions"
  ON ai_suggestions
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own suggestions"
  ON ai_suggestions
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- Insert default categories
INSERT INTO categories (name, type, color, icon, is_default) VALUES
  ('Salary', 'income', '#10B981', 'briefcase', true),
  ('Freelance', 'income', '#3B82F6', 'laptop', true),
  ('Investment', 'income', '#8B5CF6', 'trending-up', true),
  ('Business', 'income', '#F59E0B', 'building', true),
  ('Other Income', 'income', '#6B7280', 'more-horizontal', true),
  ('Food & Dining', 'expense', '#EF4444', 'utensils', true),
  ('Transportation', 'expense', '#F97316', 'car', true),
  ('Shopping', 'expense', '#EAB308', 'shopping-bag', true),
  ('Entertainment', 'expense', '#8B5CF6', 'film', true),
  ('Bills & Utilities', 'expense', '#3B82F6', 'zap', true),
  ('Healthcare', 'expense', '#10B981', 'heart', true),
  ('Education', 'expense', '#06B6D4', 'book', true),
  ('Travel', 'expense', '#F59E0B', 'plane', true),
  ('Other Expense', 'expense', '#6B7280', 'more-horizontal', true);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date);
CREATE INDEX IF NOT EXISTS idx_transactions_category_id ON transactions(category_id);
CREATE INDEX IF NOT EXISTS idx_budgets_user_id ON budgets(user_id);
CREATE INDEX IF NOT EXISTS idx_budgets_period ON budgets(user_id, period, month, year);
CREATE INDEX IF NOT EXISTS idx_ai_suggestions_user_id ON ai_suggestions(user_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_transactions_updated_at BEFORE UPDATE ON transactions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_budgets_updated_at BEFORE UPDATE ON budgets FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();