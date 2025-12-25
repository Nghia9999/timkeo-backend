export class User {
  id: number;
  name: string;
  email: string;
  googleId?: string;
  avatar?: string;
  sport?: string;
  location?: {
    latitude: number;
    longitude: number;
  };
  trustScore?: number;
  createdAt?: Date;
  updatedAt?: Date;
}
