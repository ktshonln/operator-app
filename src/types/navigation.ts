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
  UserDetails: { userId?: string };
  UserForm: { userId?: string };
  Organization: undefined;
};

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}