export const mockSlackClient = {
  chat: { postMessage: jest.fn() },
  reactions: { add: jest.fn(), remove: jest.fn() },
  files: { uploadV2: jest.fn() },
  conversations: { info: jest.fn() },
  users: { info: jest.fn() },
  team: { info: jest.fn() },
};

export const getSlackClient = jest.fn(() => mockSlackClient);
export const verifySlackSignature = jest.fn(() => true);
export const postThreadReply = jest.fn();
export const addReaction = jest.fn();
export const removeReaction = jest.fn();
