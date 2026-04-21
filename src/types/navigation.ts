import { User } from './user';

export type RootStackParamList = {
  Login: undefined;
  ForgotPassword: undefined;
  Main: undefined;
  Notifications: undefined;
  OTP: { identifier?: string };
  ResetPasswordConfirm: { identifier?: string; otp?: string };
  Profile: undefined;
  Settings: undefined;
  ChangePassword: undefined;
  UsersList: undefined;
  UserDetails: { user: User };
  UserForm: { userId?: string };
  Organization: undefined;
  TwoFactor: { userId: string; identifier: string; channel: string };
  PostLogin2FA: undefined;
  RoleManagement: undefined;
  UserPermissions: undefined;
  LoginChannel: undefined;
  AllOrganizations: undefined;
  AllUsers: undefined;
  CreateOrganization: undefined;
  Invitations: undefined;
  EditInvitation: { invitation: any };
};

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}