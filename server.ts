import "dotenv/config";
import { createApp } from "./server/app";

// Vercel detects this root entry point and invokes the Express app as a
// request-driven function. Do not call listen() in this module.
export default createApp();
