export const roomKeys = {
    hostId: (roomId) => `room:${roomId}:hostId`,
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