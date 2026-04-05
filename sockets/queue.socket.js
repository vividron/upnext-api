import { isSongInQueue } from "../services/queue.service.js";
import { resolveRoomRole } from "../services/room.service.js";
import { voteLimiter, voteSongAtomic } from "../services/vote.service.js";
import { EVENTS } from "./socket.events.js"
import { getIO } from "./socket.gateway.js";

const registerQueueSocket = (socket) => {
    socket.on(EVENTS.QUEUE_VOTE_SONG, async ({ roomId, songId, vote }, ack) => {
        try {
            const userId = socket.userId;

            // vote limiter
            const allowed = await voteLimiter(roomId, userId);
            if (!allowed) {
                return ack({
                    ok: false,
                    error: {
                        code: "VOTE_LIMIT_EXCEEDED",
                        message: "Vote limit reached"
                    }
                });
            }

            // Check if song exist in queue
            const isSongValid = await isSongInQueue(roomId, songId);
            if (!isSongValid) {
                return ack({
                    ok: false,
                    error: {
                        code: "INVALID_SONG",
                        message: "Song is not present in the queue"
                    }
                });
            }

            // validate vote
            if (vote !== -1 && vote !== 1) {
                return ack({
                    ok: false,
                    error: {
                        code: "INVALID_VOTE",
                        message: "Invalid vote"
                    }
                });
            }

            // vote song
            const { delta, score } = await voteSongAtomic(roomId, userId, songId, vote);
            if (delta === 0) {
                return ack({
                    ok: false,
                    error: {
                        code: "SAME_VOTE",
                        message: "Same vote"
                    }
                });
            }

            // broadcast vote
            getIO().to(roomId).emit(EVENTS.QUEUE_SCORES_UPDATED, [{ songId, score: Number(score) }]);

            return ack({ ok: true });

        } catch (error) {

            console.error("Vote error:", error);

            return ack({
                ok: false,
                error: {
                    code: "VOTE_FAILED",
                    message: "Failed to vote the song"
                }
            });
        }
    })
}

export default registerQueueSocket;