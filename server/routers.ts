import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { z } from "zod";
import {
  createActivity,
  getActivities,
  getParticipants,
  getComments,
  addParticipant,
  removeParticipant,
  addComment,
  deleteComment,
  deleteActivity,
  updateActivity,
  updateComment,
} from "./db";

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  activities: router({
    list: publicProcedure.query(async () => {
      const allActivities = await getActivities();

      // Enrich each activity with participant and comment counts
      const enriched = await Promise.all(
        allActivities.map(async (activity) => {
          const participants = await getParticipants(activity.id);
          const comments = await getComments(activity.id);
          return {
            ...activity,
            participantCount: participants.length,
            participantNames: participants.map((p) => p.username),
            commentCount: comments.length,
          };
        })
      );

      return enriched;
    }),

    create: publicProcedure
      .input(
        z.object({
          placeName: z.string().min(1),
          date: z.string().min(1),
          roughTime: z.string().min(1),
          description: z.string().optional(),
          proposerUsername: z.string().min(1),
        })
      )
      .mutation(async ({ input }) => {
        const result = await createActivity({
          placeName: input.placeName,
          date: input.date,
          roughTime: input.roughTime,
          description: input.description,
          proposerUsername: input.proposerUsername,
        });
        return result;
      }),

    delete: publicProcedure
      .input(
        z.object({
          activityId: z.number(),
          username: z.string().min(1),
        })
      )
      .mutation(async ({ input }) => {
        await deleteActivity(input.activityId, input.username);
        return { success: true };
      }),

    update: publicProcedure
      .input(
        z.object({
          activityId: z.number(),
          username: z.string().min(1),
          placeName: z.string().min(1).optional(),
          date: z.string().min(1).optional(),
          roughTime: z.string().min(1).optional(),
          description: z.string().optional(),
        })
      )
      .mutation(async ({ input }) => {
        const { activityId, username, ...updates } = input;
        await updateActivity(activityId, username, updates);
        return { success: true };
      }),
  }),

  participants: router({
    add: publicProcedure
      .input(
        z.object({
          activityId: z.number(),
          username: z.string().min(1),
        })
      )
      .mutation(async ({ input }) => {
        await addParticipant(input.activityId, input.username);
        return { success: true };
      }),

    remove: publicProcedure
      .input(
        z.object({
          activityId: z.number(),
          username: z.string().min(1),
        })
      )
      .mutation(async ({ input }) => {
        await removeParticipant(input.activityId, input.username);
        return { success: true };
      }),

    list: publicProcedure
      .input(
        z.object({
          activityId: z.number(),
        })
      )
      .query(async ({ input }) => {
        return await getParticipants(input.activityId);
      }),
  }),

  comments: router({
    add: publicProcedure
      .input(
        z.object({
          activityId: z.number(),
          username: z.string().min(1),
          content: z.string().min(1),
        })
      )
      .mutation(async ({ input }) => {
        await addComment(input.activityId, input.username, input.content);
        return { success: true };
      }),

    list: publicProcedure
      .input(
        z.object({
          activityId: z.number(),
        })
      )
      .query(async ({ input }) => {
        return await getComments(input.activityId);
      }),

    delete: publicProcedure
      .input(
        z.object({
          commentId: z.number(),
          username: z.string().min(1),
        })
      )
      .mutation(async ({ input }) => {
        await deleteComment(input.commentId, input.username);
        return { success: true };
      }),

    update: publicProcedure
      .input(
        z.object({
          commentId: z.number(),
          username: z.string().min(1),
          content: z.string().min(1),
        })
      )
      .mutation(async ({ input }) => {
        await updateComment(input.commentId, input.username, input.content);
        return { success: true };
      }),
  }),
});

export type AppRouter = typeof appRouter;
