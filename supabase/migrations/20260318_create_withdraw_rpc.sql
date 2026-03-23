-- Migration: create_withdraw_rpc
-- Tạo function atomic cho rút tiền (tránh race condition)
-- Chạy SQL này trong Supabase SQL Editor hoặc Migrations

CREATE OR REPLACE FUNCTION process_withdrawal(
  p_user_id UUID,
  p_amount NUMERIC,
  p_bank_name TEXT,
  p_bank_account TEXT,
  p_account_name TEXT
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_balance NUMERIC;
  v_pending INT;
  v_withdrawal_id UUID;
BEGIN
  -- Lock row để tránh concurrent reads
  SELECT balance INTO v_balance
  FROM cashback_wallets
  WHERE user_id = p_user_id
  FOR UPDATE;

  -- Wallet không tồn tại
  IF NOT FOUND THEN
    RETURN json_build_object('ok', false, 'error', 'Ví không tồn tại');
  END IF;

  -- Không đủ tiền
  IF v_balance < p_amount THEN
    RETURN json_build_object('ok', false, 'error', 'Số dư không đủ để rút');
  END IF;

  -- Kiểm tra có yêu cầu pending không
  SELECT COUNT(*) INTO v_pending
  FROM cashback_withdrawals
  WHERE user_id = p_user_id AND status = 'pending';

  IF v_pending > 0 THEN
    RETURN json_build_object('ok', false, 'error', 'Bạn đang có yêu cầu rút tiền chờ duyệt');
  END IF;

  -- Trừ tiền (atomic, cùng transaction)
  UPDATE cashback_wallets
  SET balance = balance - p_amount,
      updated_at = NOW()
  WHERE user_id = p_user_id;

  -- Tạo yêu cầu rút tiền
  INSERT INTO cashback_withdrawals (user_id, amount, bank_name, bank_account, account_name, status)
  VALUES (p_user_id, p_amount, p_bank_name, p_bank_account, p_account_name, 'pending')
  RETURNING id INTO v_withdrawal_id;

  RETURN json_build_object(
    'ok', true,
    'withdrawal_id', v_withdrawal_id,
    'new_balance', v_balance - p_amount
  );
END;
$$;
