export type FamilyRole = 'admin' | 'editor' | 'viewer';

export interface FamilyGroup {
  id: string;
  name: string;
  created_by: string;
  created_at: string;
  updated_at: string | null;
}

export interface FamilyMember {
  id: string;
  family_id: string;
  user_id: string;
  email: string;
  role: FamilyRole;
  created_at: string;
  updated_at: string | null;
  updated_by: string | null;
  profile?: {
    name: string;
    avatar_url: string | null;
  };
}

export interface FamilyInvitation {
  id: string;
  family_id: string;
  email: string;
  role: FamilyRole;
  status: 'pending' | 'accepted' | 'rejected';
  invited_by: string;
  created_at: string;
  expires_at: string;
  responded_at: string | null;
}

export interface SharedGroceryList {
  id: string;
  family_id: string;
  name: string;
  created_by: string;
  created_at: string;
  updated_at: string | null;
  items?: SharedListItem[];
}

export interface SharedListItem {
  id: string;
  list_id: string;
  product_id: string;
  quantity: number;
  notes: string | null;
  added_by: string;
  created_at: string;
  updated_at: string | null;
  updated_by: string | null;
  product?: {
    id: string;
    name: string;
    brand: string | null;
    description: string | null;
    image_url: string | null;
    price: number | null;
    currency: string | null;
  };
  added_by_user?: {
    name: string;
    avatar_url: string | null;
  };
}

export interface ListActivityLog {
  id: string;
  list_id: string | null;
  user_id: string;
  action: string;
  details: string;
  created_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  family_id: string;
  type: string;
  message: string;
  sender_id: string;
  read: boolean;
  created_at: string;
  read_at: string | null;
  family?: {
    name: string;
  };
  sender?: {
    name: string;
    avatar_url: string | null;
  };
}

export type NotificationType =
  | 'invitation'
  | 'list_created'
  | 'list_updated'
  | 'list_deleted'
  | 'item_added'
  | 'item_updated'
  | 'item_removed'
  | 'member_joined'
  | 'member_left'
  | 'role_updated'; 