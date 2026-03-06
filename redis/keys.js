export const roomKeys = {
    roomMeta: (roomId) => `room:${roomId}:meta`,
    playerState: (roomId) => `room:${roomId}:playerState`,
    members: (roomId) => `room:${roomId}:members`,
    queue: (roomId) => `room:${roomId}:queue`,
    graceTime: (roomId, userId) => `room:${roomId}:grace:${userId}`,
    reconnect: (userId) => `reconnect:${userId}`
};

export const socketKeys = {
    sockets: (roomId, userId) => `room:${roomId}:sockets:${userId}`,
    socket: (socketId) => `socket:${socketId}`,
    socketCount: "global:socketCount"
}