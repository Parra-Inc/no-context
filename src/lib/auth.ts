import NextAuth from "next-auth";
import type { NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { compare } from "bcryptjs";
import prisma from "./prisma";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name: string;
      email?: string;
      image?: string;
      slackUserId?: string;
      slackTeamId?: string;
      workspaceId?: string;
      workspaceName?: string;
      isEmailVerified?: boolean;
      authType: "slack" | "email";
    };
  }
}

export const authConfig: NextAuthConfig = {
  providers: [
    {
      id: "slack",
      name: "Slack",
      type: "oauth",
      clientId: process.env.SLACK_CLIENT_ID!,
      clientSecret: process.env.SLACK_CLIENT_SECRET!,
      checks: ["state"],
      authorization: {
        url: "https://slack.com/openid/connect/authorize",
        params: {
          scope: "openid profile email",
        },
      },
      token: {
        url: "https://slack.com/api/openid.connect.token",
        async conform(response: Response) {
          const data = await response.json();
          // Strip id_token — Slack's OIDC returns a broken nonce, and Auth.js
          // tries to validate it even with type "oauth". Removing it forces
          // Auth.js to use the userinfo endpoint instead.
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const { id_token, ...rest } = data;
          return Response.json(rest);
        },
      },
      userinfo: "https://slack.com/api/openid.connect.userInfo",
      profile(profile) {
        return {
          id: profile.sub,
          name: profile.name,
          email: profile.email,
          image: profile.picture,
          slackUserId: profile["https://slack.com/user_id"],
          slackTeamId: profile["https://slack.com/team_id"],
        };
      },
    },
    Credentials({
      id: "email",
      name: "Email",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const email = credentials?.email as string;
        const password = credentials?.password as string;

        if (!email || !password) return null;

        const user = await prisma.user.findUnique({
          where: { email: email.toLowerCase() },
        });

        if (!user || !user.hashedPassword) return null;

        const isValid = await compare(password, user.hashedPassword);
        if (!isValid) return null;

        return {
          id: user.id,
          name: user.name || user.email,
          email: user.email,
          emailVerified: user.emailVerified,
          authType: "email" as const,
        };
      },
    }),
  ],
  callbacks: {
    async signIn({ account, profile }) {
      if (account?.provider === "slack") {
        if (!profile) return false;
        const slackTeamId = (profile as Record<string, unknown>)[
          "https://slack.com/team_id"
        ] as string | undefined;
        return !!slackTeamId;
      }
      // Email credentials — always allow sign-in
      return true;
    },
    async jwt({ token, user, account, profile }) {
      if (account?.provider === "slack" && profile) {
        const slackTeamId = (profile as Record<string, unknown>)[
          "https://slack.com/team_id"
        ] as string;
        const slackUserId = (profile as Record<string, unknown>)[
          "https://slack.com/user_id"
        ] as string;
        const email = (profile.email as string | undefined)?.toLowerCase();
        const name = profile.name as string | undefined;

        token.slackUserId = slackUserId;
        token.slackTeamId = slackTeamId;
        token.authType = "slack";

        // Find or create a User record for this Slack identity
        let dbUser = await prisma.user.findFirst({
          where: {
            OR: [{ slackUserId }, ...(email ? [{ email }] : [])],
          },
        });

        if (!dbUser && email) {
          dbUser = await prisma.user.create({
            data: {
              email,
              slackUserId,
              name: name || null,
            },
          });
        } else if (dbUser && !dbUser.slackUserId) {
          dbUser = await prisma.user.update({
            where: { id: dbUser.id },
            data: { slackUserId },
          });
        }

        if (dbUser) {
          token.userId = dbUser.id;
        }

        const workspace = await prisma.workspace.findUnique({
          where: { slackTeamId },
        });

        if (workspace) {
          token.workspaceId = workspace.id;
          token.workspaceName = workspace.slackTeamName;
        }
      }

      if (account?.provider === "email" && user) {
        token.authType = "email";
        token.userId = user.id;
        token.isEmailVerified = !!(user as Record<string, unknown>)
          .emailVerified;
      }

      // Lazy workspace resolution: if workspaceId is missing, try to find it
      if (!token.workspaceId) {
        if (token.authType === "slack" && token.slackTeamId) {
          const workspace = await prisma.workspace.findUnique({
            where: { slackTeamId: token.slackTeamId as string },
          });
          if (workspace) {
            token.workspaceId = workspace.id;
            token.workspaceName = workspace.slackTeamName;
          }
        } else if (token.authType === "email" && token.userId) {
          const dbUser = await prisma.user.findUnique({
            where: { id: token.userId as string },
            select: {
              workspaceId: true,
              workspace: { select: { slackTeamName: true } },
            },
          });
          if (dbUser?.workspaceId) {
            token.workspaceId = dbUser.workspaceId;
            token.workspaceName = dbUser.workspace?.slackTeamName;
          }
        }
      }

      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.authType =
          (token.authType as "slack" | "email") || "slack";

        if (token.userId) {
          session.user.id = token.userId as string;
        }

        if (token.authType === "slack") {
          session.user.slackUserId = token.slackUserId as string;
          session.user.slackTeamId = token.slackTeamId as string;
        }

        if (token.authType === "email") {
          session.user.isEmailVerified = token.isEmailVerified as
            | boolean
            | undefined;
        }

        // Common: both auth types can have workspace after linking
        session.user.workspaceId = token.workspaceId as string | undefined;
        session.user.workspaceName = token.workspaceName as string | undefined;
      }
      return session;
    },
  },
  pages: {
    signIn: "/signin",
    error: "/",
  },
};

export const { handlers, signIn, signOut, auth } = NextAuth(authConfig);
