export interface Employee {
  id: number;
  fullName: string;
  email: string;
  phone?: string;
  position?: string;
  departmentId?: number;
  departmentName?: string;
  hireDate?: string;
  salary?: number;
  status?: string;
}

export interface Department {
  id: number;
  name: string;
  description?: string;
  code?: string;
  employeeCount?: number;
}

export interface Mission {
  id: number;
  title: string;
  description?: string;
  status?: string;
  priority?: string;
  employeeId?: number;
  employeeName?: string;
  startDate?: string;
  endDate?: string;
  location?: string;
  budget?: number;
}

export interface Message {
  id: number;
  content: string;
  sender?: string;
  receiver?: string;
  status?: string;
  processed?: boolean;
  processedAt?: string;
  createdAt?: string;
  sentAt?: string;
}

export interface Partner {
  id: number;
  alias: string;
  type: 'MESSAGE' | 'ALERTING' | 'NOTIFICATION';
  direction: 'INBOUND' | 'OUTBOUND';
  application?: string;
  processedFlowType: 'MESSAGE' | 'ALERTING' | 'NOTIFICATION';
  description: string;
}

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}

export interface DashboardStats {
  employees: number;
  departments: number;
  missions: number;
  partners: number;
  messages: number;
  processedMessages: number;
}
