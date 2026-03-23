-- Atomic wallet credit: prevents read-then-write race condition
-- Uses UPSERT with ON CONFLICT to handle both insert and update atomically
CREATE OR REPLACE FUNCTION public.credit_wallet(
  p_user_id UUID,
  p_amount NUMERIC
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF p_user_id IS NULL OR p_amount <= 0 THEN
    RETURN;
  END IF;

  INSERT INTO cashback_wallets (user_id, balance, total_earned, total_withdrawn, updated_at)
  VALUES (p_user_id, p_amount, p_amount, 0, NOW())
  ON CONFLICT (user_id)
  DO UPDATE SET
    balance = cashback_wallets.balance + EXCLUDED.balance,
    total_earned = cashback_wallets.total_earned + EXCLUDED.total_earned,
    updated_at = NOW();
END;
$$;

-- Only service_role can call this function
REVOKE ALL ON FUNCTION public.credit_wallet(UUID, NUMERIC) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.credit_wallet(UUID, NUMERIC) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.credit_wallet(UUID, NUMERIC) TO service_role;
