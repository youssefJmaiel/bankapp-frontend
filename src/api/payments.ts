import { apiRequest } from './client';

export interface TransferRequest {
  sourceAccountId: number;
  destinationAccountId: number;
  amount: number;
  currency: string;
  reference?: string;
}

export interface PaymentResult {
  id: number;
  sourceAccountId: number;
  destinationAccountId: number;
  amount: number;
  currency: string;
  reference: string;
  status: string;
}

export interface Account {
  id: number;
  accountNumber: string;
  currency: string;
  balance: number;
  status: string;
}

export async function createPayment(data: TransferRequest): Promise<PaymentResult> {
  return apiRequest<PaymentResult>('/api/payments', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function getMyAccounts(): Promise<Account[]> {
  return apiRequest<Account[]>('/api/accounts/my');
}

export async function getAccountByNumber(accountNumber: string): Promise<Account> {
  return apiRequest<Account>(
    `/api/accounts/number/${encodeURIComponent(accountNumber)}`
  );
}

export interface PaymentHistoryItem {
  id: number;
  sourceAccountId: number;
  destinationAccountId: number;
  amount: number | string;
  currency: string;
  reference: string;
  status: string;
  createdAt: string;
  updatedAt?: string;
}

export async function getMyPayments(): Promise<PaymentHistoryItem[]> {
  return apiRequest<PaymentHistoryItem[]>('/api/payments/my');
}

