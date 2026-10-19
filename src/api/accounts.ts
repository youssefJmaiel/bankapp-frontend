import { apiRequest } from './client';

export interface KeycloakUser {
  id: string;
  username: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  enabled: boolean;
}

export interface ManagedAccount {
  id: number;
  accountNumber: string;
  ownerId: string;
  currency: string;
  balance: number;
  status: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateManagedAccountRequest {
  ownerId: string;
  currency: string;
}

export async function getKeycloakUsers(): Promise<KeycloakUser[]> {
  return apiRequest<KeycloakUser[]>('/api/employees/keycloak-users');
}

export async function getAccountsByOwner(
  ownerId: string,
): Promise<ManagedAccount[]> {
  return apiRequest<ManagedAccount[]>(
    `/api/accounts/owner/${encodeURIComponent(ownerId)}`,
  );
}

export async function createManagedAccount(
  data: CreateManagedAccountRequest,
): Promise<ManagedAccount> {
  return apiRequest<ManagedAccount>('/api/accounts', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}


export interface CreditAccountRequest {
  amount: number;
  reference: string;
}

export interface AccountCreditResult {
  id: number;
  accountId: number;
  amount: number;
  currency: string;
  reference: string;
  balanceAfter: number;
  createdAt?: string;
}

export async function creditManagedAccount(
  accountId: number,
  data: CreditAccountRequest,
): Promise<AccountCreditResult> {
  return apiRequest<AccountCreditResult>(
    `/api/accounts/${accountId}/credit`,
    {
      method: 'POST',
      body: JSON.stringify(data),
    },
  );
}
