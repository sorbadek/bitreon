-- Create database schema for Bitreon with real Stacks integration

-- Users table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  stacks_address TEXT UNIQUE,
  bns_name TEXT UNIQUE,
  display_name TEXT,
  bio TEXT,
  avatar_url TEXT,
  banner_url TEXT,
  category TEXT,
  verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Creators table
CREATE TABLE IF NOT EXISTS public.creators (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  stacks_address TEXT NOT NULL,
  bns_name TEXT UNIQUE NOT NULL,
  display_name TEXT NOT NULL,
  bio TEXT,
  category TEXT,
  subscription_price_sats BIGINT NOT NULL, -- Price in satoshis
  subscriber_count INTEGER DEFAULT 0,
  total_earnings_sats BIGINT DEFAULT 0,
  verified BOOLEAN DEFAULT FALSE,
  avatar_url TEXT,
  banner_url TEXT,
  benefits TEXT[], -- Array of subscriber benefits
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Subscriptions table
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID REFERENCES public.creators(id) ON DELETE CASCADE,
  subscriber_address TEXT NOT NULL,
  subscriber_user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  tier TEXT DEFAULT 'basic',
  price_paid_sats BIGINT NOT NULL,
  auto_renew BOOLEAN DEFAULT FALSE,
  status TEXT DEFAULT 'active', -- active, expired, cancelled
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Posts/Content table
CREATE TABLE IF NOT EXISTS public.posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID REFERENCES public.creators(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  excerpt TEXT,
  is_premium BOOLEAN DEFAULT TRUE,
  likes_count INTEGER DEFAULT 0,
  comments_count INTEGER DEFAULT 0,
  published_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Transactions table (for tracking payments)
CREATE TABLE IF NOT EXISTS public.transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tx_id TEXT UNIQUE NOT NULL, -- Stacks transaction ID
  from_address TEXT NOT NULL,
  to_address TEXT NOT NULL,
  amount_sats BIGINT NOT NULL,
  tx_type TEXT NOT NULL, -- subscription, tip, etc.
  status TEXT DEFAULT 'pending', -- pending, confirmed, failed
  block_height INTEGER,
  creator_id UUID REFERENCES public.creators(id),
  subscription_id UUID REFERENCES public.subscriptions(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  confirmed_at TIMESTAMP WITH TIME ZONE
);

-- Payment links table
CREATE TABLE IF NOT EXISTS public.payment_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID REFERENCES public.creators(id) ON DELETE CASCADE,
  amount_sats BIGINT NOT NULL,
  description TEXT,
  expires_at TIMESTAMP WITH TIME ZONE,
  used BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.creators ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_links ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Users can view all profiles" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- RLS Policies for creators
CREATE POLICY "Anyone can view creators" ON public.creators FOR SELECT USING (true);
CREATE POLICY "Users can update own creator profile" ON public.creators FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.id = creators.user_id)
);
CREATE POLICY "Users can create creator profile" ON public.creators FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.id = creators.user_id)
);

-- RLS Policies for subscriptions
CREATE POLICY "Users can view own subscriptions" ON public.subscriptions FOR SELECT USING (
  auth.uid() = subscriber_user_id OR 
  EXISTS (SELECT 1 FROM public.creators WHERE creators.id = subscriptions.creator_id AND creators.user_id = auth.uid())
);
CREATE POLICY "Users can create subscriptions" ON public.subscriptions FOR INSERT WITH CHECK (auth.uid() = subscriber_user_id);
CREATE POLICY "Users can update own subscriptions" ON public.subscriptions FOR UPDATE USING (auth.uid() = subscriber_user_id);

-- RLS Policies for posts
CREATE POLICY "Anyone can view posts" ON public.posts FOR SELECT USING (true);
CREATE POLICY "Creators can manage own posts" ON public.posts FOR ALL USING (
  EXISTS (SELECT 1 FROM public.creators WHERE creators.id = posts.creator_id AND creators.user_id = auth.uid())
);

-- RLS Policies for transactions
CREATE POLICY "Users can view related transactions" ON public.transactions FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE profiles.stacks_address = transactions.from_address AND profiles.id = auth.uid()) OR
  EXISTS (SELECT 1 FROM public.profiles WHERE profiles.stacks_address = transactions.to_address AND profiles.id = auth.uid())
);

-- RLS Policies for payment links
CREATE POLICY "Creators can manage own payment links" ON public.payment_links FOR ALL USING (
  EXISTS (SELECT 1 FROM public.creators WHERE creators.id = payment_links.creator_id AND creators.user_id = auth.uid())
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_creators_bns_name ON public.creators(bns_name);
CREATE INDEX IF NOT EXISTS idx_creators_stacks_address ON public.creators(stacks_address);
CREATE INDEX IF NOT EXISTS idx_subscriptions_creator_id ON public.subscriptions(creator_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_subscriber_address ON public.subscriptions(subscriber_address);
CREATE INDEX IF NOT EXISTS idx_transactions_tx_id ON public.transactions(tx_id);
CREATE INDEX IF NOT EXISTS idx_posts_creator_id ON public.posts(creator_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add updated_at triggers
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_creators_updated_at BEFORE UPDATE ON public.creators FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_subscriptions_updated_at BEFORE UPDATE ON public.subscriptions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_posts_updated_at BEFORE UPDATE ON public.posts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
