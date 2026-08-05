import "dotenv/config";
import express from "express";
import { createApp } from "../server/app.js";

// Vercel exposes this Express app as the /api function. Rewrites preserve the
// original /api/... request path so the app's existing routes keep working.
export default createApp(express());
