-- Migration: create admin withdrawal processing RPCs
-- Chạy trong Supabase SQL Editor

-- RPC: Approve/Paid withdrawal (atomic)
CREATE OR REPLACE FUNCTION admin_approve_withdrawal(
  p_withdrawal_id UUID,
  p_action TEXT,  -- 'approved' or 'paid'
  p_admin_note TEXT DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_withdrawal RECORD;
  v_new_status TEXT;
BEGIN
  -- Lock withdrawal row
  SELECT * INTO v_withdrawal
  FROM cashback_withdrawals
  WHERE id = p_withdrawal_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN json_build_object('ok', false, 'error', 'Không tìm thấy yêu cầu');
  END IF;

  IF v_withdrawal.status != 'pending' THEN
    RETURN json_build_object('ok', false, 'error', 'Yêu cầu đã được xử lý trước đó');
  END IF;

  v_new_status := CASE WHEN p_action = 'paid' THEN 'paid' ELSE 'approved' END;

  -- Update withdrawal status
  UPDATE cashback_withdrawals
  SET status = v_new_status,
      admin_note = p_admin_note,
      processed_at = NOW(),
      processed_by = 'admin'
  WHERE id = p_withdrawal_id;

  -- Increment total_withdrawn (atomic, không double-count)
  UPDATE cashback_wallets
  SET total_withdrawn = COALESCE(total_withdrawn, 0) + v_withdrawal.amount,
      updated_at = NOW()
  WHERE user_id = v_withdrawal.user_id;

  RETURN json_build_object(
    'ok', true,
    'status', v_new_status,
    'amount', v_withdrawal.amount
  );
END;
$$;

-- RPC: Reject withdrawal (atomic refund)
CREATE OR REPLACE FUNCTION admin_reject_withdrawal(
  p_withdrawal_id UUID,
  p_admin_note TEXT DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_withdrawal RECORD;
BEGIN
  -- Lock withdrawal row
  SELECT * INTO v_withdrawal
  FROM cashback_withdrawals
  WHERE id = p_withdrawal_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN json_build_object('ok', false, 'error', 'Không tìm thấy yêu cầu');
  END IF;

  IF v_withdrawal.status != 'pending' THEN
    RETURN json_build_object('ok', false, 'error', 'Yêu cầu đã được xử lý trước đó');
  END IF;

  -- Update withdrawal status
  UPDATE cashback_withdrawals
  SET status = 'rejected',
      admin_note = p_admin_note,
      processed_at = NOW(),
      processed_by = 'admin'
  WHERE id = p_withdrawal_id;

  -- Refund balance (atomic)
  UPDATE cashback_wallets
  SET balance = balance + v_withdrawal.amount,
      updated_at = NOW()
  WHERE user_id = v_withdrawal.user_id;

  RETURN json_build_object(
    'ok', true,
    'status', 'rejected',
    'refunded', v_withdrawal.amount
  );
END;
$$;
