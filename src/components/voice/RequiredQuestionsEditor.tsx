import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Plus, X } from 'lucide-react';
import type { RequiredQuestion } from '@/components/voice/voiceTypes';

const ANSWER_TYPES: { value: RequiredQuestion['type']; label: string }[] = [
  { value: 'text', label: 'Text' },
  { value: 'email', label: 'Email' },
  { value: 'phone', label: 'Phone' },
  { value: 'number', label: 'Number' },
  { value: 'yes_no', label: 'Yes / No' },
];

interface RequiredQuestionsEditorProps {
  questions: RequiredQuestion[];
  onChange: (questions: RequiredQuestion[]) => void;
  disabled?: boolean;
}

export function RequiredQuestionsEditor({ questions, onChange, disabled }: RequiredQuestionsEditorProps) {
  const addQuestion = () => {
    if (questions.length >= 10) return;
    onChange([
      ...questions,
      { id: crypto.randomUUID(), question: '', type: 'text', required: true },
    ]);
  };

  const updateQuestion = (id: string, patch: Partial<RequiredQuestion>) => {
    onChange(questions.map(q => (q.id === id ? { ...q, ...patch } : q)));
  };

  const removeQuestion = (id: string) => {
    onChange(questions.filter(q => q.id !== id));
  };

  return (
    <div className="space-y-3">
      <Label className="text-sm font-medium">Required Questions</Label>
      <p className="text-xs text-muted-foreground">
        Questions the assistant must ask during the conversation (max 10).
      </p>

      {questions.map((q, idx) => (
        <div key={q.id} className="flex items-start gap-2 rounded-lg border border-border p-2">
          <span className="text-xs text-muted-foreground mt-2.5 w-5 shrink-0">{idx + 1}.</span>
          <div className="flex-1 space-y-2">
            <Input
              placeholder="e.g. What is your email address?"
              value={q.question}
              onChange={e => updateQuestion(q.id, { question: e.target.value })}
              disabled={disabled}
              className="h-8 text-sm"
            />
            <div className="flex items-center gap-3">
              <Select
                value={q.type}
                onValueChange={v => updateQuestion(q.id, { type: v as RequiredQuestion['type'] })}
                disabled={disabled}
              >
                <SelectTrigger className="h-7 w-28 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ANSWER_TYPES.map(t => (
                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="flex items-center gap-1.5">
                <Switch
                  checked={q.required}
                  onCheckedChange={v => updateQuestion(q.id, { required: v })}
                  disabled={disabled}
                  className="scale-75"
                />
                <span className="text-xs text-muted-foreground">Required</span>
              </div>
            </div>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-7 w-7 shrink-0 mt-0.5"
            onClick={() => removeQuestion(q.id)}
            disabled={disabled}
          >
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>
      ))}

      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={addQuestion}
        disabled={disabled || questions.length >= 10}
        className="w-full"
      >
        <Plus className="h-3.5 w-3.5 mr-1.5" />
        Add Question {questions.length > 0 && `(${questions.length}/10)`}
      </Button>
    </div>
  );
}
