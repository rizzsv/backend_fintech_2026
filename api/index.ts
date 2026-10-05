/**
 * Vercel Serverless Function Entrypoint
 * 
 * Exports the Express app for Vercel to handle as a serverless function.
 * This file is only used in Vercel production deployment.
 * 
 * Local development still uses src/server.ts with server.listen().
 */

import app from '../src/app';

// Export the Express app as the default Vercel handler
export default app;
