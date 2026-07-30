import { db } from "@mcs/db";
import NextAuth from "next-auth";
import GitHub from "next-auth/providers/github";
import GitLab from "next-auth/providers/gitlab";

function normalizeUsername(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 32);
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  session: { strategy: "jwt" },
  providers: [GitHub, GitLab],
  pages: { signIn: "/login" },
  callbacks: {
    async signIn({ user, account, profile }) {
      if (!account) return false;

      const existingAccount = await db.oAuthAccount.findUnique({
        where: {
          provider_providerAccountId: {
            provider: account.provider,
            providerAccountId: account.providerAccountId,
          },
        },
        include: { user: true },
      });

      if (existingAccount) {
        await db.user.update({
          where: { id: existingAccount.userId },
          data: {
            name: user.name ?? existingAccount.user.name,
            email: user.email ?? existingAccount.user.email,
            image: user.image ?? existingAccount.user.image,
          },
        });
        user.id = existingAccount.userId;
        return true;
      }

      const rawUsername =
        (profile?.login as string | undefined) ??
        (profile?.username as string | undefined) ??
        user.email?.split("@")[0] ??
        `${account.provider}-user`;
      const base = normalizeUsername(rawUsername) || `${account.provider}-user`;
      const collision = await db.user.findUnique({ where: { username: base } });
      const username = collision
        ? `${base.slice(0, 24)}-${account.providerAccountId.slice(-6)}`
        : base;

      const userByEmail = user.email
        ? await db.user.findUnique({ where: { email: user.email } })
        : null;
      const persistedUser = userByEmail
        ? await db.user.update({
            where: { id: userByEmail.id },
            data: {
              oauthAccounts: {
                create: {
                  provider: account.provider,
                  providerAccountId: account.providerAccountId,
                  accessToken: account.access_token,
                  refreshToken: account.refresh_token,
                  expiresAt: account.expires_at
                    ? new Date(account.expires_at * 1000)
                    : null,
                  tokenType: account.token_type,
                  scope: account.scope,
                },
              },
            },
          })
        : await db.user.create({
            data: {
              username,
              name: user.name,
              email: user.email,
              image: user.image,
              oauthAccounts: {
                create: {
                  provider: account.provider,
                  providerAccountId: account.providerAccountId,
                  accessToken: account.access_token,
                  refreshToken: account.refresh_token,
                  expiresAt: account.expires_at
                    ? new Date(account.expires_at * 1000)
                    : null,
                  tokenType: account.token_type,
                  scope: account.scope,
                },
              },
            },
          });

      user.id = persistedUser.id;
      return true;
    },
    async jwt({ token, user, account }) {
      if (user?.id) token.userId = user.id;
      if (user?.name) token.name = user.name;
      if (user?.email) token.email = user.email;
      if (user?.image) token.picture = user.image;

      if (account) {
        const persisted = await db.oAuthAccount.findUnique({
          where: {
            provider_providerAccountId: {
              provider: account.provider,
              providerAccountId: account.providerAccountId,
            },
          },
          include: { user: true },
        });
        if (persisted) {
          token.userId = persisted.userId;
          token.username = persisted.user.username;
          token.name = persisted.user.name ?? token.name;
          token.email = persisted.user.email ?? token.email;
          token.picture = persisted.user.image ?? token.picture;
        }
      } else if (token.userId && !token.username) {
        const persisted = await db.user.findUnique({
          where: { id: token.userId as string },
        });
        if (persisted) {
          token.username = persisted.username;
          token.name = persisted.name ?? token.name;
          token.email = persisted.email ?? token.email;
          token.picture = persisted.image ?? token.picture;
        }
      }

      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.userId as string;
        session.user.username = token.username as string;
        session.user.name = (token.name as string | undefined) ?? session.user.name;
        session.user.email =
          (token.email as string | undefined) ?? session.user.email;
        session.user.image =
          (token.picture as string | undefined) ?? session.user.image;
      }
      return session;
    },
  },
});
