export type UserRole = 'AIQX_TEAM' | 'REQUESTOR';

export interface UserDto {
  id: string;
  displayName: string;
  username: string;
  givenName: string;
  familyName: string;
  mail: string;
}

export interface UserDtoWithRoles extends UserDto {
  roles: UserRole[];
}
