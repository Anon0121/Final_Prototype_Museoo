// Permission utility functions
export const checkPermission = (userPermissions, feature) => {
  if (!userPermissions || !userPermissions[feature]) {
    return false;
  }

  const permission = userPermissions[feature];
  
  // If not allowed at all (0 or false), deny access
  return permission.allowed && permission.allowed !== 0;
};

export const canView = (userPermissions, feature) => {
  return checkPermission(userPermissions, feature);
};

export const canEdit = (userPermissions, feature) => {
  return checkPermission(userPermissions, feature);
};

export const canAdmin = (userPermissions, feature) => {
  return checkPermission(userPermissions, feature);
};

export const getAccessLevel = (userPermissions, feature) => {
  if (!userPermissions || !userPermissions[feature]) {
    return 'none';
  }
  
  const permission = userPermissions[feature];
  return (permission.allowed && permission.allowed !== 0) ? 'access' : 'none';
}; 