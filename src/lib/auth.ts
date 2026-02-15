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
      slackTeamId: string;
      workspaceId?: string;
      workspaceName?: string;
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
  ],
  callbacks: {
    async signIn({ profile }) {
      if (!profile) return false;

      const slackTeamId = (profile as Record<string, unknown>)[
        "https://slack.com/team_id"
      ] as string | undefined;

      return !!slackTeamId;
    },
    async jwt({ token, profile }) {
      if (profile) {
        const slackTeamId = (profile as Record<string, unknown>)[
          "https://slack.com/team_id"
        ] as string;
        const slackUserId = (profile as Record<string, unknown>)[
          "https://slack.com/user_id"
        ] as string;

        token.slackUserId = slackUserId;
        token.slackTeamId = slackTeamId;

        const workspace = await prisma.workspace.findUnique({
          where: { slackTeamId },
        });

        if (workspace) {
          token.workspaceId = workspace.id;
          token.workspaceName = workspace.slackTeamName;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.slackUserId = token.slackUserId as string;
        session.user.slackTeamId = token.slackTeamId as string;
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
