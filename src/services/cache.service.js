const { getRedisClient } = require("../config/redis");
const logger = require("../utils/logger");

const DEFAULT_TTL = parseInt(process.env.CACHE_TTL) || 300;

const buildTaskListKey = (orgId, filters) => {
  const hash = Buffer.from(JSON.stringify(filters)).toString("base64url");
  if (filters.assignee) {
    return `tasks:assignee:${filters.assignee}:${orgId}:${hash}`;
  }
  return `tasks:list:${orgId}:${hash}`;
};

const buildAssigneePattern = (assigneeId, orgId) =>
  `tasks:assignee:${assigneeId}:${orgId}:*`;

const buildOrgPattern = (orgId) => `tasks:list:${orgId}:*`;

const get = async (key) => {
  try {
    const client = getRedisClient();
    const data = await client.get(key);
    return data ? JSON.parse(data) : null;
  } catch (err) {
    logger.warn(`Cache GET failed [${key}]: ${err.message}`);
    return null;
  }
};

const set = async (key, value, ttl = DEFAULT_TTL) => {
  try {
    const client = getRedisClient();
    await client.set(key, JSON.stringify(value), "EX", ttl);
  } catch (err) {
    logger.warn(`Cache SET failed [${key}]: ${err.message}`);
  }
};

const invalidatePattern = async (pattern) => {
  try {
    const client = getRedisClient();
    let cursor = "0";
    do {
      const [nextCursor, keys] = await client.scan(
        cursor,
        "MATCH",
        pattern,
        "COUNT",
        100
      );
      cursor = nextCursor;
      if (keys.length) {
        await client.del(...keys);
        logger.debug(`Cache invalidated ${keys.length} keys [pattern: ${pattern}]`);
      }
    } while (cursor !== "0");
  } catch (err) {
    logger.warn(`Cache INVALIDATE failed [${pattern}]: ${err.message}`);
  }
};

const invalidateTaskCaches = async (orgId, assigneeId = null) => {
  await invalidatePattern(buildOrgPattern(orgId));
  if (assigneeId) {
    await invalidatePattern(buildAssigneePattern(assigneeId, orgId));
  }
};

module.exports = {
  get,
  set,
  invalidatePattern,
  invalidateTaskCaches,
  buildTaskListKey,
};
