import { autoLinkSlackWorkspace } from "../workspace";

// Mock prisma with inline methods
const mockFindUnique = jest.fn();
const mockUpsert = jest.fn();

jest.mock("@/lib/prisma", () => ({
  __esModule: true,
  default: {
    workspace: { findUnique: (...args: unknown[]) => mockFindUnique(...args) },
    workspaceUser: { upsert: (...args: unknown[]) => mockUpsert(...args) },
  },
}));

beforeEach(() => {
  jest.clearAllMocks();
});

describe("autoLinkSlackWorkspace", () => {
  it("creates a WorkspaceUser when Slack user's team matches an existing workspace", async () => {
    // Workspace was set up by a teammate — the bot is installed, channels configured
    mockFindUnique.mockResolvedValue({
      id: "ws_abc123",
      slackTeamId: "T_TEAM_123",
      slackTeamName: "Acme Corp",
      onboardingCompleted: true,
    });
    mockUpsert.mockResolvedValue({
      userId: "usr_new_member",
      workspaceId: "ws_abc123",
      role: "member",
    });

    await autoLinkSlackWorkspace("usr_new_member", "T_TEAM_123");

    expect(mockFindUnique).toHaveBeenCalledWith({
      where: { slackTeamId: "T_TEAM_123" },
    });
    expect(mockUpsert).toHaveBeenCalledWith({
      where: {
        userId_workspaceId: {
          userId: "usr_new_member",
          workspaceId: "ws_abc123",
        },
      },
      create: {
        userId: "usr_new_member",
        workspaceId: "ws_abc123",
        role: "member",
        isDefault: true,
      },
      update: {},
    });
  });

  it("does nothing when no workspace matches the Slack team", async () => {
    mockFindUnique.mockResolvedValue(null);

    await autoLinkSlackWorkspace("usr_orphan", "T_UNKNOWN");

    expect(mockFindUnique).toHaveBeenCalledWith({
      where: { slackTeamId: "T_UNKNOWN" },
    });
    expect(mockUpsert).not.toHaveBeenCalled();
  });

  it("is idempotent — upsert does not overwrite existing membership", async () => {
    mockFindUnique.mockResolvedValue({
      id: "ws_abc123",
      slackTeamId: "T_TEAM_123",
    });
    mockUpsert.mockResolvedValue({
      userId: "usr_existing",
      workspaceId: "ws_abc123",
      role: "owner",
    });

    await autoLinkSlackWorkspace("usr_existing", "T_TEAM_123");

    // update: {} means don't overwrite the existing role
    expect(mockUpsert).toHaveBeenCalledWith(
      expect.objectContaining({ update: {} }),
    );
  });
});
