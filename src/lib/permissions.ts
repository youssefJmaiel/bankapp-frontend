export type UserRole = 'ADMIN' | 'USER';

export function hasRole(roles: string[], role: UserRole): boolean {
  return roles.includes(role);
}

export function isAdmin(roles: string[]): boolean {
  return hasRole(roles, 'ADMIN');
}

export function isUser(roles: string[]): boolean {
  return hasRole(roles, 'USER');
}

export const permissions = {
  employees: {
    view: ['USER', 'ADMIN'] as UserRole[],
    create: ['ADMIN'] as UserRole[],
    update: ['ADMIN'] as UserRole[],
    delete: ['ADMIN'] as UserRole[],
  },
  departments: {
    view: ['USER', 'ADMIN'] as UserRole[],
    create: ['ADMIN'] as UserRole[],
    update: ['ADMIN'] as UserRole[],
    delete: ['ADMIN'] as UserRole[],
  },
  missions: {
    view: ['USER', 'ADMIN'] as UserRole[],
    create: ['ADMIN'] as UserRole[],
    update: ['ADMIN'] as UserRole[],
    delete: ['ADMIN'] as UserRole[],
  },
  partners: {
    view: ['USER', 'ADMIN'] as UserRole[],
    create: ['ADMIN'] as UserRole[],
    update: ['ADMIN'] as UserRole[],
    delete: ['ADMIN'] as UserRole[],
  },
  messages: {
    viewList: ['ADMIN'] as UserRole[],
    viewOne: ['USER', 'ADMIN'] as UserRole[],
    create: ['ADMIN'] as UserRole[],
    delete: ['ADMIN'] as UserRole[],
    send: ['ADMIN'] as UserRole[],
  },
} as const;
