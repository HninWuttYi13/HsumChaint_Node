import { redis } from '@/lib/redis';
/**
 * Clears all paginated user list caches using a non-blocking SCAN.
 * This should be called whenever a user is Created, Updated  or Deleted.
 */
export const clearUserListCache = async () => {
  try {
    //start scanning from the beginning
    let cursor = '0';
    //use a loop to find keys in batches, keeping Redis responsive
    do {
      //scan for keys matching our list pattern
      //nexCursor = where to continue & keys =  matched keys
      const [nextCursor, keys] = await redis.scan(cursor, 'MATCH', 'users:list:*', 'COUNT', 100);
      //update cursor and move forward in dataset
      cursor = nextCursor;
      //If we found matching keys in this batch, delete them
      if (keys.length > 0) {
        await redis.del(...keys);
      }
    } while (cursor !== '0'); //'0' means we've circled back to the start
    console.info('User list cache cleared successfully');
  } catch (error) {
    console.error('Redis Scan/Clear Error:', error);
  }
};
