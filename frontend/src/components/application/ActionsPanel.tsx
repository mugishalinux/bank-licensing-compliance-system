import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { PlayCircle, MessageSquareWarning, CheckCircle2, ThumbsUp, ThumbsDown } from 'lucide-react';
import { applicationsApi, DecisionPayload } from '../../api/applications';
import { Application, ApplicationStatus, UserRole } from '../../types';
import { errorMessage } from '../../utils/formatters';
import { useAuth } from '../../context/AuthContext';
import Confirm from '../common/Confirm';
import DecisionDialog from './DecisionDialog';

type Dialog = null | 'start' | 'info' | 'complete' | 'approve' | 'reject';

interface Props { app: Application }

export default function ActionsPanel({ app }: Props) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [dialog, setDialog] = useState<Dialog>(null);

  const sameDept = !!user?.department_id && user.department_id === app.department_id;
  const isReviewer = user?.role === UserRole.REVIEWER && sameDept;
  const isApprover = user?.role === UserRole.APPROVER && sameDept;
  const assignedToMe = !app.reviewer_id || app.reviewer_id === user?.id;

  const reviewerCanStart = isReviewer && app.status === ApplicationStatus.SUBMITTED;
  const reviewerCanWork =
    isReviewer && app.status === ApplicationStatus.UNDER_REVIEW && assignedToMe;
  const approverCanDecide = isApprover && app.status === ApplicationStatus.REVIEWED;

  const showPanel = reviewerCanStart || reviewerCanWork || approverCanDecide;
  if (!showPanel) return null;

  const onSuccess = (msg: string) => {
    qc.invalidateQueries({ queryKey: ['app', app.id] });
    qc.invalidateQueries({ queryKey: ['apps'] });
    qc.invalidateQueries({ queryKey: ['comments', app.id] });
    setDialog(null);
    toast.success(msg);
  };

  const startReview = useMutation({
    mutationFn: () => applicationsApi.startReview(app.id),
    onSuccess: () => onSuccess('Review started'),
    onError: (e) => toast.error(errorMessage(e, 'Could not start review')),
  });

  const requestInfo = useMutation({
    mutationFn: (dto: DecisionPayload) => applicationsApi.requestInfo(app.id, dto),
    onSuccess: () => onSuccess('Information requested'),
    onError: (e) => toast.error(errorMessage(e, 'Could not request info')),
  });

  const completeReview = useMutation({
    mutationFn: (dto: DecisionPayload) => applicationsApi.completeReview(app.id, dto),
    onSuccess: () => onSuccess('Review completed — sent to approver'),
    onError: (e) => toast.error(errorMessage(e, 'Could not complete review')),
  });

  const approve = useMutation({
    mutationFn: (dto: DecisionPayload) => applicationsApi.approve(app.id, dto),
    onSuccess: () => onSuccess('Application approved'),
    onError: (e) => toast.error(errorMessage(e, 'Could not approve')),
  });

  const reject = useMutation({
    mutationFn: (dto: DecisionPayload) => applicationsApi.reject(app.id, dto),
    onSuccess: () => onSuccess('Application rejected'),
    onError: (e) => toast.error(errorMessage(e, 'Could not reject')),
  });

  return (
    <>
      <div className="card">
        <div className="px-5 py-3 border-b border-[color:var(--color-bnr-line)]">
          <h3 className="font-medium text-[14px]">Actions</h3>
        </div>
        <div className="px-5 py-4 space-y-2">
          {reviewerCanStart && (
            <button className="btn btn-primary w-full" onClick={() => setDialog('start')}>
              <PlayCircle size={15} /> Start review
            </button>
          )}
          {reviewerCanWork && (
            <>
              <button className="btn btn-ghost w-full" onClick={() => setDialog('info')}>
                <MessageSquareWarning size={15} /> Request more information
              </button>
              <button className="btn btn-primary w-full" onClick={() => setDialog('complete')}>
                <CheckCircle2 size={15} /> Complete review
              </button>
            </>
          )}
          {approverCanDecide && (
            <>
              <button className="btn btn-primary w-full" onClick={() => setDialog('approve')}>
                <ThumbsUp size={15} /> Approve
              </button>
              <button className="btn btn-danger w-full" onClick={() => setDialog('reject')}>
                <ThumbsDown size={15} /> Reject
              </button>
            </>
          )}
        </div>
      </div>

      <Confirm
        open={dialog === 'start'}
        onClose={() => setDialog(null)}
        onConfirm={() => startReview.mutate()}
        title="Start review"
        message="You will be assigned as the reviewer for this application."
        confirmLabel="Start review"
        busy={startReview.isPending}
      />

      <DecisionDialog
        open={dialog === 'info'}
        onClose={() => setDialog(null)}
        onSubmit={(d) => requestInfo.mutate(d)}
        title="Request more information"
        description="The applicant will be notified by email and given the chance to resubmit."
        confirmLabel="Send request"
        busy={requestInfo.isPending}
        placeholder="Describe what is missing or needs clarification…"
      />

      <DecisionDialog
        open={dialog === 'complete'}
        onClose={() => setDialog(null)}
        onSubmit={(d) => completeReview.mutate(d)}
        title="Complete review"
        description="The application will move to the approval queue."
        confirmLabel="Complete review"
        busy={completeReview.isPending}
        placeholder="Summary of your review for the approver…"
      />

      <DecisionDialog
        open={dialog === 'approve'}
        onClose={() => setDialog(null)}
        onSubmit={(d) => approve.mutate(d)}
        title="Approve application"
        description="The applicant will be notified by email that their application has been approved."
        confirmLabel="Approve"
        busy={approve.isPending}
        placeholder="Approval note for the applicant…"
      />

      <DecisionDialog
        open={dialog === 'reject'}
        onClose={() => setDialog(null)}
        onSubmit={(d) => reject.mutate(d)}
        title="Reject application"
        description="The applicant will be notified by email. This decision is final."
        confirmLabel="Reject"
        busy={reject.isPending}
        destructive
        placeholder="Reason for rejection…"
      />
    </>
  );
}
