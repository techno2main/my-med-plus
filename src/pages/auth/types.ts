export interface BiometricCredentials {
  username: string;
  password: string;
}

export interface BiometricCheckResult {
  isAvailable: boolean;
  savedEmail: string | null;
}
