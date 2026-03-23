-- Migration: Lock down SECURITY DEFINER RPCs
-- Revoke PUBLIC execute, only allow authenticated users

-- process_withdrawal: chỉ authenticated user mới gọi được
REVOKE EXECUTE ON FUNCTION process_withdrawal FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION process_withdrawal FROM anon;
GRANT EXECUTE ON FUNCTION process_withdrawal TO authenticated;

-- admin_approve_withdrawal: chỉ service_role (admin route dùng service key)
REVOKE EXECUTE ON FUNCTION admin_approve_withdrawal FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION admin_approve_withdrawal FROM anon;
REVOKE EXECUTE ON FUNCTION admin_approve_withdrawal FROM authenticated;
GRANT EXECUTE ON FUNCTION admin_approve_withdrawal TO service_role;

-- admin_reject_withdrawal: chỉ service_role
REVOKE EXECUTE ON FUNCTION admin_reject_withdrawal FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION admin_reject_withdrawal FROM anon;
REVOKE EXECUTE ON FUNCTION admin_reject_withdrawal FROM authenticated;
GRANT EXECUTE ON FUNCTION admin_reject_withdrawal TO service_role;
