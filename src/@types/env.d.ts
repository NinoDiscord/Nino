declare namespace NodeJS {
  interface ProcessEnv {
    /**
     * Returns the environment the Node app is running in.
     */
    NODE_ENV: 'development' | 'production';

    /**
     * Returns `'true'` if the app is running using the **`yarn test`** command.
     */
    JEST?: 'true';
  }
}
