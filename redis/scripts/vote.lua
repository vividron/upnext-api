-- KEYS[1] = queue kay
-- KEYS[2] = user vote key

-- ARGV[1] = songId
-- ARGV[2] = vote (1 or -1)

local prevVote = redis.call("HGET", KEYS[2], ARGV[1])
local delta = 0

if not prevVote then
    delta = tonumber(ARGV[2])
else
    prevVote = tonumber(prevVote)

    if prevVote == tonumber(ARGV[2]) then
        return {0}
    end

    delta = tonumber(ARGV[2]) - prevVote
end

local newScore = redis.call("ZINCRBY", KEYS[1], delta, ARGV[1])

redis.call("HSET", KEYS[2], ARGV[1], ARGV[2])

return {delta, newScore}
