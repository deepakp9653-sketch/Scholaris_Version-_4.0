import "next-auth";

declare module "next-auth" {
  interface User {
    role?: string;
    institutionId?: string;
  }

  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      role?: string;
      institutionId?: string;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role?: string;
    institutionId?: string;
  }
}
