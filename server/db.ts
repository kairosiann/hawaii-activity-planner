import { eq, and } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, activities, InsertActivity, participants, comments } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// Activity queries
export async function createActivity(activity: InsertActivity) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(activities).values(activity);
  return result;
}

export async function getActivities() {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.select().from(activities).orderBy((a) => a.createdAt);
  return result;
}

export async function getActivityWithDetails(activityId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const activity = await db.select().from(activities).where(eq(activities.id, activityId)).limit(1);
  const participantList = await db.select().from(participants).where(eq(participants.activityId, activityId));
  const commentList = await db.select().from(comments).where(eq(comments.activityId, activityId)).orderBy((c) => c.createdAt);
  
  return {
    activity: activity[0],
    participants: participantList,
    comments: commentList,
  };
}

// Participant queries
export async function addParticipant(activityId: number, username: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // Check if already a participant
  const existing = await db
    .select()
    .from(participants)
    .where(and(eq(participants.activityId, activityId), eq(participants.username, username)))
    .limit(1);
  
  if (existing.length > 0) {
    return existing[0];
  }
  
  const result = await db.insert(participants).values({ activityId, username });
  return result;
}

export async function removeParticipant(activityId: number, username: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db
    .delete(participants)
    .where(and(eq(participants.activityId, activityId), eq(participants.username, username)));
}

export async function getParticipants(activityId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db
    .select()
    .from(participants)
    .where(eq(participants.activityId, activityId));
  
  return result;
}

// Comment queries
export async function addComment(activityId: number, username: string, content: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(comments).values({ activityId, username, content });
  return result;
}

export async function getComments(activityId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db
    .select()
    .from(comments)
    .where(eq(comments.activityId, activityId))
    .orderBy((c) => c.createdAt);
  
  return result;
}

// Delete comment with ownership check
export async function deleteComment(commentId: number, username: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // Verify ownership
  const comment = await db.select().from(comments).where(eq(comments.id, commentId)).limit(1);
  if (!comment.length || comment[0].username !== username) {
    throw new Error("Unauthorized: only the comment author can delete this comment");
  }
  
  await db.delete(comments).where(eq(comments.id, commentId));
}

// Activity deletion with ownership check
export async function deleteActivity(activityId: number, username: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // Verify ownership
  const activity = await db.select().from(activities).where(eq(activities.id, activityId)).limit(1);
  if (!activity.length || activity[0].proposerUsername !== username) {
    throw new Error("Unauthorized: only the proposer can delete this activity");
  }
  
  // Delete related comments and participants first
  await db.delete(comments).where(eq(comments.activityId, activityId));
  await db.delete(participants).where(eq(participants.activityId, activityId));
  
  // Then delete the activity
  await db.delete(activities).where(eq(activities.id, activityId));
}

// Activity editing with ownership check
export async function updateActivity(
  activityId: number,
  username: string,
  updates: Partial<Omit<InsertActivity, 'proposerUsername'>>
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // Verify ownership
  const activity = await db.select().from(activities).where(eq(activities.id, activityId)).limit(1);
  if (!activity.length || activity[0].proposerUsername !== username) {
    throw new Error("Unauthorized: only the proposer can edit this activity");
  }
  
  await db.update(activities).set(updates).where(eq(activities.id, activityId));
}

// Update comment with ownership check
export async function updateComment(
  commentId: number,
  username: string,
  content: string
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // Verify ownership
  const comment = await db.select().from(comments).where(eq(comments.id, commentId)).limit(1);
  if (!comment.length || comment[0].username !== username) {
    throw new Error("Unauthorized: only the comment author can edit this comment");
  }
  
  await db.update(comments).set({ content }).where(eq(comments.id, commentId));
}
