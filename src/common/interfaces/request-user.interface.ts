import { UserRole } from '@modules/users/schemas/user.schema';

export interface RequestUser {
  _id: string;
  email: string;
  role: UserRole;
  name: string;
}
