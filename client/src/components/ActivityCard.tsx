import { useState } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Heart, MessageCircle, Users, Edit2, Trash2, X, Check } from 'lucide-react';
import { trpc } from '@/lib/trpc';
import { useUsername } from '@/contexts/UsernameContext';
import { format } from 'date-fns';
import { toast } from 'sonner';

interface ActivityCardProps {
  id: number;
  placeName: string;
  date: string;
  roughTime: string;
  description?: string;
  proposerUsername: string;
  participantCount: number;
  participantNames: string[];
  commentCount: number;
  createdAt: Date;
}

export function ActivityCard({
  id,
  placeName,
  date,
  roughTime,
  description,
  proposerUsername,
  participantCount,
  participantNames,
  commentCount,
  createdAt,
}: ActivityCardProps) {
  const { username } = useUsername();
  const [showComments, setShowComments] = useState(false);
  const [commentInput, setCommentInput] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    placeName,
    date,
    roughTime,
    description: description || '',
  });
  const [editingCommentId, setEditingCommentId] = useState<number | null>(null);
  const [editingCommentContent, setEditingCommentContent] = useState('');

  const utils = trpc.useUtils();

  const deleteActivityMutation = trpc.activities.delete.useMutation({
    onSuccess: () => {
      utils.activities.list.invalidate();
      toast.success('Activity deleted');
    },
    onError: () => {
      toast.error('Failed to delete activity');
    },
  });

  const updateActivityMutation = trpc.activities.update.useMutation({
    onSuccess: () => {
      utils.activities.list.invalidate();
      setIsEditing(false);
      toast.success('Activity updated');
    },
    onError: () => {
      toast.error('Failed to update activity');
    },
  });

  const addParticipantMutation = trpc.participants.add.useMutation({
    onSuccess: () => {
      utils.activities.list.invalidate();
    },
    onError: () => {
      toast.error('Failed to join activity');
    },
  });

  const removeParticipantMutation = trpc.participants.remove.useMutation({
    onSuccess: () => {
      utils.activities.list.invalidate();
    },
    onError: () => {
      toast.error('Failed to leave activity');
    },
  });

  const addCommentMutation = trpc.comments.add.useMutation({
    onSuccess: () => {
      utils.comments.list.invalidate();
      utils.activities.list.invalidate();
      setCommentInput('');
    },
    onError: () => {
      toast.error('Failed to add comment');
    },
  });

  const deleteCommentMutation = trpc.comments.delete.useMutation({
    onSuccess: () => {
      utils.comments.list.invalidate();
      utils.activities.list.invalidate();
      toast.success('Comment deleted');
    },
    onError: () => {
      toast.error('Failed to delete comment');
    },
  });

  const updateCommentMutation = trpc.comments.update.useMutation({
    onSuccess: () => {
      utils.comments.list.invalidate();
      utils.activities.list.invalidate();
      setEditingCommentId(null);
      setEditingCommentContent('');
      toast.success('Comment updated');
    },
    onError: () => {
      toast.error('Failed to update comment');
    },
  });

  const { data: comments, isLoading: commentsLoading } = trpc.comments.list.useQuery(
    { activityId: id },
    { enabled: showComments }
  );

  const isParticipant = participantNames.includes(username || '');
  const isProposer = username === proposerUsername;

  const handleToggleParticipant = () => {
    if (isParticipant) {
      removeParticipantMutation.mutate({ activityId: id, username: username! });
    } else {
      addParticipantMutation.mutate({ activityId: id, username: username! });
    }
  };

  const handleSaveEdit = () => {
    updateActivityMutation.mutate({
      activityId: id,
      username: username!,
      ...editData,
    });
  };

  const handleSaveCommentEdit = (commentId: number) => {
    if (!editingCommentContent.trim()) {
      toast.error('Comment cannot be empty');
      return;
    }
    updateCommentMutation.mutate({
      commentId,
      username: username!,
      content: editingCommentContent,
    });
  };

  const handleCommentKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && e.ctrlKey) {
      if (commentInput.trim()) {
        addCommentMutation.mutate({
          activityId: id,
          username: username!,
          content: commentInput,
        });
      }
    }
  };

  return (
    <Card className="overflow-hidden hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        {isEditing ? (
          <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Place Name</label>
              <Input
                value={editData.placeName}
                onChange={(e) => setEditData({ ...editData, placeName: e.target.value })}
                placeholder="Place name"
                className="font-semibold"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Date</label>
                <Input
                  type="date"
                  value={editData.date}
                  onChange={(e) => setEditData({ ...editData, date: e.target.value })}
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Time</label>
                <Input
                  value={editData.roughTime}
                  onChange={(e) => setEditData({ ...editData, roughTime: e.target.value })}
                  placeholder="e.g., 2:00 PM"
                />
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Description</label>
              <Textarea
                value={editData.description}
                onChange={(e) => setEditData({ ...editData, description: e.target.value })}
                placeholder="Add details about the activity... (press Enter for new line)"
                rows={5}
                className="resize-none"
              />
              <p className="text-xs text-muted-foreground">Ctrl+Enter to save</p>
            </div>
            <div className="flex gap-2 sticky bottom-0 bg-background pt-2">
              <Button
                size="sm"
                onClick={handleSaveEdit}
                disabled={updateActivityMutation.isPending}
              >
                <Check className="w-4 h-4 mr-1" />
                Save
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setIsEditing(false)}
              >
                <X className="w-4 h-4 mr-1" />
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className="font-semibold text-lg text-foreground">{placeName}</h3>
                <p className="text-sm text-muted-foreground">by {proposerUsername}</p>
              </div>
              {isProposer && (
                <div className="flex gap-1">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setIsEditing(true)}
                    className="h-8 w-8 p-0"
                  >
                    <Edit2 className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => deleteActivityMutation.mutate({ activityId: id, username: username! })}
                    disabled={deleteActivityMutation.isPending}
                    className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              )}
            </div>

            <div className="flex items-center gap-4 text-sm text-muted-foreground mt-2">
              <span>📍 {date}</span>
              <span>🕐 {roughTime}</span>
            </div>

            {description && (
              <p className="text-sm text-foreground/80 mt-2 whitespace-pre-wrap break-words">{description}</p>
            )}
          </>
        )}
      </CardHeader>

      <CardContent className="space-y-4">
        {!isEditing && (
          <>
            {/* Participant section */}
            <div className="flex items-center justify-between">
              <Button
                size="sm"
                variant={isParticipant ? 'default' : 'outline'}
                onClick={handleToggleParticipant}
                disabled={addParticipantMutation.isPending || removeParticipantMutation.isPending}
              >
                <Heart className={`w-4 h-4 mr-1 ${isParticipant ? 'fill-current' : ''}`} />
                I'm In
              </Button>

              <div className="flex items-center gap-2 text-sm">
                <Users className="w-4 h-4 text-muted-foreground" />
                <span className="font-medium">{participantCount}</span>
                {participantCount > 0 && (
                  <span className="text-muted-foreground text-xs truncate" title={participantNames.join(', ')}>
                    {participantNames.join(', ')}
                  </span>
                )}
              </div>
            </div>

            {/* Comments section */}
            <div className="space-y-3 border-t border-border pt-3">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setShowComments(!showComments)}
                className="w-full justify-start"
              >
                <MessageCircle className="w-4 h-4 mr-2" />
                {commentCount} comments
              </Button>

              {showComments && (
                <div className="space-y-3">
                  {/* Comment input */}
                  <div className="space-y-1">
                    <Textarea
                      value={commentInput}
                      onChange={(e) => setCommentInput(e.target.value)}
                      onKeyDown={handleCommentKeyDown}
                      placeholder="Add a comment... (Ctrl+Enter to post)"
                      className="text-sm resize-none"
                      rows={2}
                    />
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() =>
                          addCommentMutation.mutate({
                            activityId: id,
                            username: username!,
                            content: commentInput,
                          })
                        }
                        disabled={!commentInput.trim() || addCommentMutation.isPending}
                      >
                        Post
                      </Button>
                      <p className="text-xs text-muted-foreground flex items-center">
                        or Ctrl+Enter
                      </p>
                    </div>
                  </div>

                  {/* Comments list */}
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {commentsLoading ? (
                      <p className="text-sm text-muted-foreground italic">Loading comments...</p>
                    ) : comments && comments.length > 0 ? (
                      comments.map((comment) => (
                        <div key={comment.id} className="bg-background rounded p-2 text-sm border border-border">
                          {editingCommentId === comment.id ? (
                            <div className="space-y-2">
                              <Textarea
                                value={editingCommentContent}
                                onChange={(e) => setEditingCommentContent(e.target.value)}
                                className="text-sm resize-none"
                                rows={2}
                              />
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  onClick={() => handleSaveCommentEdit(comment.id)}
                                  disabled={updateCommentMutation.isPending}
                                >
                                  <Check className="w-3 h-3 mr-1" />
                                  Save
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => setEditingCommentId(null)}
                                >
                                  <X className="w-3 h-3 mr-1" />
                                  Cancel
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <>
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <p className="font-medium text-foreground">{comment.username}</p>
                                  <p className="text-foreground/80 whitespace-pre-wrap break-words">{comment.content}</p>
                                  <p className="text-xs text-muted-foreground mt-1">
                                    {format(new Date(comment.createdAt), 'MMM d, h:mm a')}
                                  </p>
                                </div>
                                {username === comment.username && (
                                  <div className="flex gap-1 ml-2">
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      onClick={() => {
                                        setEditingCommentId(comment.id);
                                        setEditingCommentContent(comment.content);
                                      }}
                                      disabled={updateCommentMutation.isPending}
                                      className="h-6 w-6 p-0"
                                    >
                                      <Edit2 className="w-3 h-3" />
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      onClick={() => deleteCommentMutation.mutate({ commentId: comment.id, username: username! })}
                                      disabled={deleteCommentMutation.isPending}
                                      className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                                    >
                                      <Trash2 className="w-3 h-3" />
                                    </Button>
                                  </div>
                                )}
                              </div>
                            </>
                          )}
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-muted-foreground italic">No comments yet</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
