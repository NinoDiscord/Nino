import { Redis } from "ioredis";

/**
 * Manages queue data structure using Redis as the storage service.
 *
 * @remarks
 * Redis does not assure data consistency, so every method here might congest with another.
 * None the less, it should be consistent enough due to the small latency and the constant time complexity.
 *
 * Redis implements the queue as a deque.
 */
export default class RedisQueue {
    private redis: Redis;
    private key: string;

    constructor(redis: Redis, key: string) {
        this.redis = redis;
        this.key = key;
    }

    /**
     * Pushes a new item (or new items) to the end of the list
     *
     * @remarks
     * Works in O(1) time complexity
     */
    push(value: string | string[]): Promise<void> {
        return this.redis.rpush(this.key, value);
    }

    /**
     * Returns and removes the first element of the list
     *
     * @remarks
     * Works in O(1) time complexity
     */
    pop(): Promise<string>{
        return this.redis.lpop(this.key);
    }

    /**
     * Returns the first element of the list
     *
     * @remarks
     * Works in O(1) time complexity
     */
    peek(): Promise<string> {
        return this.redis.lindex(this.key, 0);
    }

    /**
     * Returns the last element of the list
     *
     * @remarks
     * Works in O(1) time complexity
     */
    peekEnd(): Promise<string> {
        return this.redis.lindex(this.key, -1);
    }

    /**
     * Returns the length of the list
     *
     * @remarks
     * Works in O(1) time complexity
     */
    length(): Promise<number> {
        return this.redis.llen(this.key);
    }
}