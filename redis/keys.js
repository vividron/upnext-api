export const keys = {
    hostId: (roomId) => `room:${roomId}:hostId`,
    playerState: (roomId) => `room:${roomId}:playerState`,
    members: (roomId) => `room:${roomId}:members`,
    queue: (roomId) => `room:${roomId}:queue`,
    sockets: (roomId, userId) => `room:${roomId}:sockets:${userId}`,
    socket: (socketId) => `socket:${socketId}`,
    graceTime: (roomId, userId) => `room:${roomId}:grace:${userId}`,
    reconnect: (userId) => `reconnect:${userId}`
};