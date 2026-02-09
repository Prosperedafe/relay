export const encrypt = (data: string): string => {
  return btoa(data);
};

export const decrypt = (encrypted: string): string => {
  return atob(encrypted);
};


