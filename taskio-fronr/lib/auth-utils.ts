export const isElevatedRole = (role?: string | null): boolean => {
  if (!role) return false;
  const upperRole = role.toUpperCase();
  return upperRole === 'ADMIN' || upperRole === 'SUPER_ADMIN';
};

export const isNormalUser = (role?: string | null): boolean => {
  return !isElevatedRole(role);
};
