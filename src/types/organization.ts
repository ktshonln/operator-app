export interface Organization {
  id: string;
  name: string;
  slug: string;
  org_type: string;
  status: 'pending' | 'active' | 'approved' | 'rejected' | 'suspended';
  logo_path: string | null;
  contact_email: string;
  contact_phone: string;
  address: string;
  tin: string;
  license_number: string;
  parent_org_id: string | null;
  parent_org: Organization | null;
  approved_at: string | null;
  created_at: string;
  updated_at: string;
}