import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useUsername } from '@/contexts/UsernameContext';

export function UsernameModal() {
  const { username, setUsername } = useUsername();
  const [input, setInput] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = () => {
    const trimmed = input.trim();
    if (!trimmed) {
      setError('Please enter a username');
      return;
    }
    if (trimmed.length > 50) {
      setError('Username must be 50 characters or less');
      return;
    }
    setUsername(trimmed);
    setInput('');
    setError('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSubmit();
    }
  };

  return (
    <Dialog open={!username} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-md" onPointerDownOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle className="text-2xl">Welcome to Hawaii Activity Planner</DialogTitle>
          <DialogDescription>
            Enter your name to join the group and start planning activities together.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <Input
            placeholder="Your name"
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              setError('');
            }}
            onKeyDown={handleKeyDown}
            autoFocus
            className="text-base"
          />
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button onClick={handleSubmit} className="w-full" size="lg">
            Get Started
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
