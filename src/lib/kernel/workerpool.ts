import { pool } from "workerpool";
import type Pool from "workerpool/types/Pool";


/**
 *
 */
export default class WorkerPool {
    /**
     * The internal worker pool instance.
     */
    private instance: Pool;


    /**
     * Creates a new worker pool, allowing to run multiple tasks in parallel,
     * using Node.js worker threads.
     */
    constructor() {
        this.instance = pool("", {
            workerType: "thread"
        });
    }
}