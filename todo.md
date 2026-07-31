# Hawaii Activity Planner - Project TODO

## Database & Backend
- [x] Create database schema for activities, participants, and comments
- [x] Build API procedures for creating activities
- [x] Build API procedures for fetching activities with participant and comment data
- [x] Build API procedures for adding/removing participants (upvote)
- [x] Build API procedures for posting and fetching comments
- [x] Implement session-based username storage (no auth required)

## Frontend - Core Pages
- [x] Create username prompt modal (first visit)
- [x] Build activity feed page layout
- [x] Build activity card component with all data points (place, date, time, proposer)
- [x] Build new activity suggestion form
- [x] Implement participant list and "I'm in" button
- [x] Build comment thread UI
- [x] Add edit/delete functionality for activities and comments (optional - owner only, deferred to v2)

## Styling & Design
- [x] Set up Hawaii-inspired color palette (light, tropical, airy)
- [x] Configure typography for elegant, minimalistic feel
- [x] Apply Tailwind CSS theming for consistent design
- [x] Ensure responsive design for mobile and desktop
- [x] Add subtle animations and micro-interactions

## Testing & Polish
- [x] Write vitest tests for backend procedures
- [x] Test end-to-end user flows (manual testing)
- [x] Verify session persistence for username
- [x] Test activity creation and upvoting
- [x] Test comment functionality
- [x] Cross-browser and responsive testing

## Deployment & Delivery
- [x] Final UI polish and refinement
- [x] Performance optimization
- [x] Create checkpoint and publish

## Future Enhancements (v2)
- [ ] Activity filtering by date range
- [ ] User profiles and activity history
- [ ] Push notifications for activity updates
- [ ] Activity categories and tags
- [ ] Map integration to show activity locations

## Edit/Delete Feature (User Request)
- [x] Add delete activity API procedure (owner only)
- [x] Add edit activity API procedure (owner only)
- [x] Add delete comment API procedure (owner only)
- [x] Add edit comment API procedure (owner only)
- [x] Add edit/delete UI controls to activity cards
- [x] Add edit/delete UI controls to comments (edit + delete)
- [x] Clear all test activities from database
- [x] Test edit and delete workflows

## UI/UX Improvements (User Request)
- [x] Upgrade description fields to full textareas with multi-line support
- [x] Add Enter key support for new lines (Ctrl+Enter to submit)
- [x] Make full text visible when editing activities
- [x] Add scrollable edit form for better visibility
- [x] Add Ctrl+Enter keyboard shortcut for comments
- [x] Preserve line breaks in displayed text (whitespace-pre-wrap)
