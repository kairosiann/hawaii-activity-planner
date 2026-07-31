import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { trpc } from '@/lib/trpc';
import { useUsername } from '@/contexts/UsernameContext';
import { toast } from 'sonner';

export function ActivitySuggestionForm() {
  const { username } = useUsername();
  const [placeName, setPlaceName] = useState('');
  const [date, setDate] = useState('');
  const [roughTime, setRoughTime] = useState('');
  const [description, setDescription] = useState('');

  const utils = trpc.useUtils();
  const createActivityMutation = trpc.activities.create.useMutation({
    onSuccess: () => {
      setPlaceName('');
      setDate('');
      setRoughTime('');
      setDescription('');
      utils.activities.list.invalidate();
      toast.success('Activity suggested! 🌺');
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to create activity');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!placeName.trim() || !date || !roughTime.trim()) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (!username) {
      toast.error('Please enter a username first');
      return;
    }

    createActivityMutation.mutate({
      placeName: placeName.trim(),
      date,
      roughTime: roughTime.trim(),
      description: description.trim() || undefined,
      proposerUsername: username,
    });
  };

  return (
    <Card className="border-accent/30 bg-gradient-to-br from-accent/5 to-transparent">
      <CardHeader>
        <CardTitle className="text-lg">Suggest an Activity</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                Place Name *
              </label>
              <Input
                placeholder="e.g., Waikiki Beach, Diamond Head Trail"
                value={placeName}
                onChange={(e) => setPlaceName(e.target.value)}
                disabled={createActivityMutation.isPending}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                Date *
              </label>
              <Input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                disabled={createActivityMutation.isPending}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">
              Rough Time *
            </label>
            <Input
              placeholder="e.g., 2:00 PM, Morning, Evening"
              value={roughTime}
              onChange={(e) => setRoughTime(e.target.value)}
              disabled={createActivityMutation.isPending}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">
              Description (optional)
            </label>
            <Textarea
              placeholder="Add any details about the activity... (press Enter for new line)"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && e.ctrlKey) {
                  handleSubmit(e as any);
                }
              }}
              disabled={createActivityMutation.isPending}
              rows={4}
              className="resize-none"
            />
            <p className="text-xs text-muted-foreground">Ctrl+Enter to submit</p>
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={createActivityMutation.isPending}
          >
            {createActivityMutation.isPending ? 'Suggesting...' : 'Suggest Activity'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
