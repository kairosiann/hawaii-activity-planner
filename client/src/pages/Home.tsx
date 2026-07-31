import { useUsername } from '@/contexts/UsernameContext';
import { UsernameModal } from '@/components/UsernameModal';
import { ActivitySuggestionForm } from '@/components/ActivitySuggestionForm';
import { ActivityCard } from '@/components/ActivityCard';
import { Button } from '@/components/ui/button';
import { trpc } from '@/lib/trpc';
import { Loader2, LogOut } from 'lucide-react';

export default function Home() {
  const { username, clearUsername } = useUsername();
  const { data: activities, isLoading, error } = trpc.activities.list.useQuery();

  return (
    <>
      <UsernameModal />
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/5">
        {/* Header */}
        <header className="sticky top-0 z-40 border-b border-border/50 bg-background/80 backdrop-blur-sm">
          <div className="container py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="text-2xl">🌺</div>
              <div>
                <h1 className="text-2xl font-bold text-foreground">Hawaii Activity Planner</h1>
                <p className="text-xs text-muted-foreground">Plan together, adventure awaits</p>
              </div>
            </div>

            {username && (
              <div className="flex items-center gap-3">
                <div className="text-sm">
                  <p className="font-medium text-foreground">{username}</p>
                  <p className="text-xs text-muted-foreground">Ready to explore</p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    clearUsername();
                  }}
                  className="gap-2"
                >
                  <LogOut className="w-4 h-4" />
                  Change
                </Button>
              </div>
            )}
          </div>
        </header>

        {/* Main Content */}
        <main className="container py-8 space-y-8">
          {/* Suggestion Form */}
          <section>
            <ActivitySuggestionForm />
          </section>

          {/* Activity Feed */}
          <section>
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-foreground">Upcoming Activities</h2>
              <p className="text-sm text-muted-foreground mt-1">
                {activities?.length === 0 ? 'No activities yet. Be the first to suggest one!' : `${activities?.length} activities planned`}
              </p>
            </div>

            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : error ? (
              <div className="text-center py-12 bg-card rounded-lg border border-destructive/50">
                <p className="text-destructive font-medium">Failed to load activities</p>
                <p className="text-sm text-muted-foreground mt-2">Please try refreshing the page</p>
              </div>
            ) : activities && activities.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {activities.map((activity) => (
                  <ActivityCard
                    key={activity.id}
                    id={activity.id}
                    placeName={activity.placeName}
                    date={activity.date}
                    roughTime={activity.roughTime}
                    description={activity.description || undefined}
                    proposerUsername={activity.proposerUsername}
                    participantCount={activity.participantCount}
                    participantNames={activity.participantNames}
                    commentCount={activity.commentCount}
                    createdAt={activity.createdAt}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-12 bg-card rounded-lg border border-border">
                <p className="text-muted-foreground">No activities yet</p>
                <p className="text-sm text-muted-foreground mt-2">Scroll up to suggest the first activity!</p>
              </div>
            )}
          </section>
        </main>

        {/* Footer */}
        <footer className="border-t border-border/50 bg-background/50 mt-16">
          <div className="container py-6 text-center text-sm text-muted-foreground">
            <p>Made for planning amazing Hawaii adventures together 🌴</p>
          </div>
        </footer>
      </div>
    </>
  );
}
