import type { NextAuthConfig } from "next-auth";

export const authConfig = {
  providers: [], // Credentials provider added in auth.ts
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isPrincipalRoute = nextUrl.pathname.startsWith("/principal");

      if (isPrincipalRoute) {
        if (!isLoggedIn) return false;
        const role = (auth.user as any)?.role;
        const isAllowedRole = role === "PRINCIPAL" || role === "SUPER_ADMIN" || role === "SystemAdmin";
        if (!isAllowedRole) return false;
        return true;
      }
      return true;
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as any).role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        (session.user as any).role = token.role as string;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
  },
} satisfies NextAuthConfig;
