-- Create creators table with proper RLS
CREATE TABLE IF NOT EXISTS public.creators (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bns_name TEXT UNIQUE NOT NULL,
  display_name TEXT NOT NULL,
  bio TEXT,
  category TEXT,
  subscription_price_btc DECIMAL(10,8) NOT NULL,
  benefits TEXT[],
  wallet_address TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.creators ENABLE ROW LEVEL SECURITY;

-- Create policies for creators table
CREATE POLICY "creators_select_all" ON public.creators FOR SELECT USING (true);
CREATE POLICY "creators_insert_own" ON public.creators FOR INSERT WITH CHECK (true);
CREATE POLICY "creators_update_own" ON public.creators FOR UPDATE USING (wallet_address = current_setting('request.jwt.claims', true)::json->>'wallet_address');
CREATE POLICY "creators_delete_own" ON public.creators FOR DELETE USING (wallet_address = current_setting('request.jwt.claims', true)::json->>'wallet_address');

-- Create subscriptions table
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID REFERENCES public.creators(id) ON DELETE CASCADE,
  subscriber_wallet TEXT NOT NULL,
  amount_btc DECIMAL(10,8) NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  transaction_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS for subscriptions
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- Create policies for subscriptions
CREATE POLICY "subscriptions_select_all" ON public.subscriptions FOR SELECT USING (true);
CREATE POLICY "subscriptions_insert_all" ON public.subscriptions FOR INSERT WITH CHECK (true);

-- Create posts table for creator content
CREATE TABLE IF NOT EXISTS public.posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID REFERENCES public.creators(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  is_premium BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS for posts
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;

-- Create policies for posts
CREATE POLICY "posts_select_all" ON public.posts FOR SELECT USING (true);
CREATE POLICY "posts_insert_creator" ON public.posts FOR INSERT WITH CHECK (true);
CREATE POLICY "posts_update_creator" ON public.posts FOR UPDATE USING (true);
CREATE POLICY "posts_delete_creator" ON public.posts FOR DELETE USING (true);
