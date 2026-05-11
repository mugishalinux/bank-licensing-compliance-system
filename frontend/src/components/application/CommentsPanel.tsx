import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { MessageSquare, Send } from 'lucide-react';
import { commentsApi } from '../../api/comments';
import { Application, ApplicationStatus, CommentKind, UserRole } from '../../types';
import { COMMENT_LABEL, errorMessage, fmtRel } from '../../utils/formatters';
import { useAuth } from '../../context/AuthContext';
import EmptyState from '../common/EmptyState';
import Spinner from '../common/Spinner';

interface Props { app: Application }

const KIND_TONE: Record<CommentKind, string> = {
  [CommentKind.INFO_REQUEST]: 'bg-orange-50 text-orange-700',
  [CommentKind.REVIEW_NOTE]: 'bg-purple-50 text-purple-700',
  [CommentKind.APPROVAL]: 'bg-emerald-50 text-emerald-700',
  [CommentKind.REJECTION]: 'bg-red-50 text-red-700',
  [CommentKind.APPLICANT_REPLY]: 'bg-blue-50 text-blue-700',
};

export default function CommentsPanel({ app }: Props) {
  const qc = useQueryClient();
  const { user } = useAuth();
  const [body, setBody] = useState('');

  const list = useQuery({
    queryKey: ['comments', app.id],
    queryFn: () => commentsApi.list(app.id),
  });

  const add = useMutation({
    mutationFn: () => commentsApi.add(app.id, { body: body.trim() }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['comments', app.id] });
      setBody('');
      toast.success('Comment added');
    },
    onError: (e) => toast.error(errorMessage(e, 'Could not post comment')),
  });

  const canReply =
    !!user &&
    (user.role === UserRole.APPLICANT
      ? app.applicant_id === user.id && app.status === ApplicationStatus.ADDITIONAL_INFO_REQUIRED
      : (user.role === UserRole.REVIEWER || user.role === UserRole.APPROVER) &&
        user.department_id === app.department_id);

  return (
    <div className="card">
      <div className="px-5 py-3 border-b border-[color:var(--color-bnr-line)] flex items-center justify-between">
        <h2 className="font-medium text-[14px]">Conversation</h2>
        {list.data && <span className="text-[11px] text-[color:var(--color-ink-soft)]">{list.data.length} message{list.data.length === 1 ? '' : 's'}</span>}
      </div>

      <div className="px-5 py-4">
        {list.isLoading ? (
          <div className="flex justify-center py-4"><Spinner size={18} /></div>
        ) : (list.data?.length ?? 0) === 0 ? (
          <EmptyState
            icon={<MessageSquare size={28} />}
            title="No messages yet"
            message="Comments from reviewers and your replies will appear here."
          />
        ) : (
          <ul className="space-y-4">
            {list.data?.map((c) => (
              <li key={c.id} className="flex gap-3">
                <div className="h-8 w-8 shrink-0 rounded-full bg-bnr text-white flex items-center justify-center text-[11px] font-semibold">
                  {c.author?.full_name?.slice(0, 1).toUpperCase() ?? '?'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 text-[12px]">
                    <span className="font-medium">{c.author?.full_name ?? 'Unknown'}</span>
                    <span className={`tag ${KIND_TONE[c.kind]}`}>{COMMENT_LABEL[c.kind]}</span>
                    <span className="text-[color:var(--color-ink-soft)]">{fmtRel(c.created_at)}</span>
                  </div>
                  <p className="text-[13px] mt-1 whitespace-pre-wrap break-words">{c.body}</p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {canReply && (
        <form
          onSubmit={(e) => { e.preventDefault(); if (body.trim()) add.mutate(); }}
          className="px-5 py-3 border-t border-[color:var(--color-bnr-line)] flex gap-2"
        >
          <textarea
            className="textarea flex-1"
            rows={2}
            placeholder="Write a reply…"
            value={body}
            onChange={(e) => setBody(e.target.value)}
          />
          <button type="submit" className="btn btn-primary self-end" disabled={!body.trim() || add.isPending}>
            <Send size={14} /> Send
          </button>
        </form>
      )}
    </div>
  );
}
