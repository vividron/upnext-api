-- KEYS[1] = queue key
-- KEYS[2] = user vote key

-- ARGV = list of songIds

local results = {}

if #ARGV > 50 then 
    return {}
end

for i = 1, #ARGV do

    local songId = ARGV[i]
    local prevVote = redis.call("HGET", KEYS[2], songId)
    local delta = 0

    if not prevVote then
        delta = 1
    else
        prevVote = tonumber(prevVote)

        if prevVote == 1 then
            delta = 0
        else
            delta = 2
        end
    end

    if delta ~= 0 then

        local newScore = redis.call("ZINCRBY", KEYS[1], delta, songId)

        redis.call("HSET", KEYS[2], songId, 1)

        table.insert(results, {songId, newScore})

    end

end

return results