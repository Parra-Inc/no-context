import NextAuth from "next-auth";
import type { NextAuthConfig } from "next-auth";
import prisma from "./prisma";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name: string;
      image?: string;
      slackUserId: string;
      workspaceId: string;
      workspaceName: string;
    };
  }
}

export const authConfig: NextAuthConfig = {
  providers: [
    {
      id: "slack",
      name: "Slack",
      type: "oidc",
      issuer: "https://slack.com",
      clientId: process.env.SLACK_CLIENT_ID!,
      clientSecret: process.env.SLACK_CLIENT_SECRET!,
      authorization: {
        params: {
          scope: "openid profile email",
        },
      },
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
  ],
  callbacks: {
    async signIn({ profile }) {
      if (!profile) return false;

      const slackTeamId = (profile as Record<string, unknown>)[
        "https://slack.com/team_id"
      ] as string | undefined;

      if (!slackTeamId) return false;

      // Check if workspace has installed the app
      const workspace = await prisma.workspace.findUnique({
        where: { slackTeamId },
      });

      return !!workspace?.isActive;
    },
    async jwt({ token, profile }) {
      if (profile) {
        const slackTeamId = (profile as Record<string, unknown>)[
          "https://slack.com/team_id"
        ] as string;
        const slackUserId = (profile as Record<string, unknown>)[
          "https://slack.com/user_id"
        ] as string;

        const workspace = await prisma.workspace.findUnique({
          where: { slackTeamId },
        });

        if (workspace) {
          token.workspaceId = workspace.id;
          token.workspaceName = workspace.slackTeamName;
          token.slackUserId = slackUserId;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.workspaceId = token.workspaceId as string;
        session.user.workspaceName = token.workspaceName as string;
        session.user.slackUserId = token.slackUserId as string;
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
