import mongoose from 'mongoose';

export default class DatabaseManager {
    public url: string;

    /**
     * Creates a new instance of the database manager
     * @param url The mongodb url to connect to
     */
    constructor(url: string) {
        this.url = url;
    }

    /**
     * Asynchronous connects to MongoDB
     */
    async connect() {
        const conn = await mongoose.connect(this.url, { useNewUrlParser: true });
        conn.connection.on('error', (error: any) => {
            throw error;
        });
    }
}