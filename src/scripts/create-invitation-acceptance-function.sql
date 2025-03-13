-- Function to handle invitation acceptance in a transaction
CREATE OR REPLACE FUNCTION handle_invitation_acceptance(
  p_invitation_id UUID,
  p_user_id UUID
) RETURNS VOID AS $$
DECLARE
  v_family_id UUID;
  v_role TEXT;
  v_email TEXT;
  v_exists BOOLEAN;
BEGIN
  -- Get the invitation details
  SELECT 
    family_id, 
    role,
    email
  INTO 
    v_family_id, 
    v_role,
    v_email
  FROM family_invitations
  WHERE id = p_invitation_id AND status = 'pending';
  
  -- Check if invitation exists and is pending
  IF v_family_id IS NULL THEN
    RAISE EXCEPTION 'Invitation not found or not pending';
  END IF;
  
  -- Check if user is already a member of the family
  SELECT EXISTS (
    SELECT 1 
    FROM family_members 
    WHERE family_id = v_family_id AND user_id = p_user_id
  ) INTO v_exists;
  
  IF v_exists THEN
    -- Update the invitation status
    UPDATE family_invitations
    SET status = 'accepted'
    WHERE id = p_invitation_id;
    
    -- User is already a member, no need to add them again
    RETURN;
  END IF;
  
  -- Begin transaction
  BEGIN
    -- Add the user to the family
    INSERT INTO family_members (
      family_id,
      user_id,
      role,
      email
    ) VALUES (
      v_family_id,
      p_user_id,
      v_role,
      v_email
    );
    
    -- Update the invitation status
    UPDATE family_invitations
    SET 
      status = 'accepted',
      accepted_at = NOW(),
      accepted_by = p_user_id
    WHERE id = p_invitation_id;
    
    -- Commit transaction
    COMMIT;
  EXCEPTION WHEN OTHERS THEN
    -- Rollback transaction on error
    ROLLBACK;
    RAISE;
  END;
END;
$$ LANGUAGE plpgsql; 