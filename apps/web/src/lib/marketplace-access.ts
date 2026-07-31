export function canAccessOwnedResource(
  isPublic: boolean,
  ownerId: string,
  authorizedOwnerId?: string,
): boolean {
  return isPublic || Boolean(authorizedOwnerId && ownerId === authorizedOwnerId);
}

export function marketplaceVisibilityWhere(authorizedOwnerId?: string) {
  return {
    OR: [
      { isPublic: true as const },
      ...(authorizedOwnerId ? [{ ownerId: authorizedOwnerId }] : []),
    ],
  };
}

export function marketplaceCollectionVisibilityWhere(
  authorizedOwnerId?: string,
) {
  return {
    OR: [
      { isPublic: true as const },
      ...(authorizedOwnerId ? [{ ownerId: authorizedOwnerId }] : []),
    ],
  };
}
