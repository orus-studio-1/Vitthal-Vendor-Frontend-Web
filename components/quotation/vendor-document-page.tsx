'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { CheckCircle2, Download, FileSignature, Loader2, SendHorizontal, ShieldAlert, XCircle } from 'lucide-react';
import SignaturePad from '@/components/quotation/signature-pad';
import { PublicVendorQuotation, vendorQuotationApi } from '@/lib/api';
import { toast } from 'sonner';

function formatDate(value?: string | null) {
  if (!value) return 'Not specified';
  return new Date(value).toLocaleString();
}

function formatCurrency(value?: number | null) {
  if (value === null || value === undefined) return 'Not specified';
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(value);
}

function VendorDocumentContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token') || '';
  const [quotation, setQuotation] = useState<PublicVendorQuotation | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [decision, setDecision] = useState<'approved' | 'rejected'>('approved');
  const [vendorPrice, setVendorPrice] = useState('');
  const [vendorMoq, setVendorMoq] = useState('');
  const [vendorNotes, setVendorNotes] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [signatureData, setSignatureData] = useState<string | null>(null);

  const isExpired = useMemo(() => {
    if (!quotation?.token_expires_at) return false;
    return new Date(quotation.token_expires_at).getTime() < Date.now();
  }, [quotation?.token_expires_at]);

  const isFinal = quotation
    ? ['vendor_approved', 'vendor_rejected', 'admin_approved', 'admin_rejected'].includes(quotation.status)
    : false;
  const isAgreement = quotation?.quotation_kind === 'vendor_agreement';

  useEffect(() => {
    if (!token) {
      setLoading(false);
      setError('Missing document token in the URL.');
      return;
    }

    const loadQuotation = async () => {
      try {
        setLoading(true);
        setError('');
        const response = await vendorQuotationApi.getQuotation(token);
        const nextQuotation = response.data;
        if (!nextQuotation) {
          throw new Error('Document details were not returned by the server.');
        }
        setQuotation(nextQuotation);
        setVendorPrice(nextQuotation?.vendor_price?.toString?.() || '');
        setVendorMoq(nextQuotation?.vendor_moq?.toString?.() || '');
        setVendorNotes(nextQuotation?.vendor_notes || '');
        setRejectionReason(nextQuotation?.vendor_rejection_reason || '');
      } catch (quotationError) {
        const message = quotationError instanceof Error ? quotationError.message : 'Failed to load document';
        setError(message);
      } finally {
        setLoading(false);
      }
    };

    void loadQuotation();
  }, [token]);

  const handleSubmit = async () => {
    if (!token || !quotation) return;

    try {
      setSubmitting(true);
      setError('');

      if (decision === 'approved') {
        if (!signatureData) {
          throw new Error(`Signature is required before approving the ${isAgreement ? 'agreement' : 'quotation'}.`);
        }

        const response = await vendorQuotationApi.respondToQuotation(token, {
          decision: 'approved',
          vendorPrice: vendorPrice.trim() ? Number(vendorPrice) : null,
          vendorMoq: vendorMoq.trim() ? Number(vendorMoq) : null,
          vendorNotes: vendorNotes.trim(),
          vendorSignatureData: signatureData,
        });

        if (!response.data) {
          throw new Error('The response was saved, but no updated document was returned.');
        }
        setQuotation(response.data);
        toast.success(`${isAgreement ? 'Agreement' : 'Quotation'} submitted successfully`);
      } else {
        if (!rejectionReason.trim()) {
          throw new Error(`Please provide a reason for rejecting the ${isAgreement ? 'agreement' : 'quotation'}.`);
        }

        const response = await vendorQuotationApi.respondToQuotation(token, {
          decision: 'rejected',
          rejectionReason: rejectionReason.trim(),
        });

        if (!response.data) {
          throw new Error('The rejection was saved, but no updated document was returned.');
        }
        setQuotation(response.data);
        toast.success(`${isAgreement ? 'Agreement' : 'Quotation'} rejection submitted successfully`);
      }
    } catch (submitError) {
      const message = submitError instanceof Error ? submitError.message : 'Failed to submit document response';
      setError(message);
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="mx-auto flex min-h-[70vh] max-w-4xl items-center justify-center px-4">
        <Loader2 className="h-8 w-8 animate-spin text-blue-700" />
      </div>
    );
  }

  if (error && !quotation) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-16">
        <div className="rounded-[2rem] border border-red-200 bg-red-50 p-8 text-red-700">
          <div className="flex items-center gap-3">
            <ShieldAlert className="h-6 w-6" />
            <h1 className="text-xl font-semibold">Document unavailable</h1>
          </div>
          <p className="mt-3 text-sm">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[radial-gradient(circle_at_top,#eff6ff,transparent_45%),linear-gradient(180deg,#f8fafc,#eef2ff_40%,#f8fafc)]">
      <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="rounded-[2rem] border border-slate-200 bg-white/90 p-6 shadow-xl backdrop-blur sm:p-8">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="font-mono text-[11px] uppercase tracking-[0.34em] text-slate-500">{isAgreement ? 'Secure vendor agreement' : 'Secure vendor quotation'}</p>
              <h1 className="mt-3 text-3xl font-semibold text-slate-900">{quotation?.title}</h1>
              <p className="mt-2 text-sm text-slate-500">{quotation?.quotation_number} • {quotation?.company_name}</p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium capitalize text-slate-700">
                {quotation?.status.replace(/_/g, ' ')}
              </span>
              {token ? (
                <a
                  href={vendorQuotationApi.getQuotationPdfUrl(token)}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  <Download className="h-4 w-4" />
                  Download PDF
                </a>
              ) : null}
            </div>
          </div>

          <div className="mt-8 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="space-y-6">
              <section className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                <h2 className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-500">{isAgreement ? 'Business Terms' : 'Admin request'}</h2>
                
                {isAgreement ? (
                  <div className="mt-4 grid gap-3 text-sm text-slate-700 sm:grid-cols-2">
                    <p><span className="font-medium text-slate-900">Company Name:</span> {quotation?.company_name}</p>
                    <p><span className="font-medium text-slate-900">Business Type:</span> {quotation?.business_type || 'Not specified'}</p>
                    <p><span className="font-medium text-slate-900">GST Number:</span> {quotation?.gst_number || 'Not specified'}</p>
                    <p><span className="font-medium text-slate-900">Designation:</span> {quotation?.designation || 'Not specified'}</p>
                    <p><span className="font-medium text-slate-900">Credit Cycle:</span> {quotation?.credit_cycle || 'Not specified'}</p>
                    <p><span className="font-medium text-slate-900">Commission Range:</span> {quotation?.minimum_commision_percentage ?? 0}% - {quotation?.maximum_commision_percentage ?? 0}%</p>
                    <div className="sm:col-span-2">
                      <span className="font-medium text-slate-900">Business Description:</span>
                      <p className="mt-1">{quotation?.business_description || 'Not provided'}</p>
                    </div>
                  </div>
                ) : (
                  <div className="mt-4 grid gap-3 text-sm text-slate-700 sm:grid-cols-2">
                    <p><span className="font-medium text-slate-900">Quantity:</span> {quotation?.quantity} {quotation?.unit}</p>
                    <p><span className="font-medium text-slate-900">Target price:</span> {formatCurrency(quotation?.target_price)}</p>
                    <p><span className="font-medium text-slate-900">Requested MOQ:</span> {quotation?.requested_moq ?? 'Not specified'}</p>
                    <p><span className="font-medium text-slate-900">Validity:</span> {formatDate(quotation?.validity_date)}</p>
                  </div>
                )}

                <div className="mt-4 rounded-2xl bg-white p-4 text-sm text-slate-600 shadow-sm">
                  {quotation?.request_notes || (isAgreement ? 'Please review your updated business terms above and sign to agree to the platform terms and conditions.' : 'No additional request notes were provided by the admin.')}
                </div>
                <p className="mt-3 text-xs text-slate-500">Prepared by {quotation?.created_by_admin_name}. This secure link expires on {formatDate(quotation?.token_expires_at)}.</p>
              </section>

              <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={() => setDecision('approved')}
                    disabled={isFinal || isExpired}
                    className={`rounded-2xl px-4 py-3 text-sm font-medium transition ${decision === 'approved' ? 'bg-emerald-700 text-white' : 'border border-emerald-200 text-emerald-700 hover:bg-emerald-50'} disabled:cursor-not-allowed disabled:opacity-60`}
                  >
                    {isAgreement ? 'Approve and sign agreement' : 'Approve and sign'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setDecision('rejected')}
                    disabled={isFinal || isExpired}
                    className={`rounded-2xl px-4 py-3 text-sm font-medium transition ${decision === 'rejected' ? 'bg-red-700 text-white' : 'border border-red-200 text-red-700 hover:bg-red-50'} disabled:cursor-not-allowed disabled:opacity-60`}
                  >
                    {isAgreement ? 'Reject agreement' : 'Reject quotation'}
                  </button>
                </div>

                {decision === 'approved' ? (
                  <div className="mt-5 space-y-4">
                    {!isAgreement && (
                      <div className="grid gap-4 sm:grid-cols-2">
                        <label className="space-y-2">
                          <span className="text-sm font-medium text-slate-700">Your price</span>
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={vendorPrice}
                            onChange={(event) => setVendorPrice(event.target.value)}
                            disabled={isFinal || isExpired}
                            className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-blue-400 disabled:bg-slate-50"
                            placeholder="Enter price"
                          />
                        </label>
                        <label className="space-y-2">
                          <span className="text-sm font-medium text-slate-700">Your MOQ</span>
                          <input
                            type="number"
                            min="0"
                            step="1"
                            value={vendorMoq}
                            onChange={(event) => setVendorMoq(event.target.value)}
                            disabled={isFinal || isExpired}
                            className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-blue-400 disabled:bg-slate-50"
                            placeholder="Enter MOQ"
                          />
                        </label>
                      </div>
                    )}
                    <label className="space-y-2">
                      <span className="text-sm font-medium text-slate-700">Vendor notes</span>
                      <textarea
                        value={vendorNotes}
                        onChange={(event) => setVendorNotes(event.target.value)}
                        disabled={isFinal || isExpired}
                        className="min-h-28 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-blue-400 disabled:bg-slate-50"
                        placeholder={isAgreement ? 'Add any conditions or onboarding notes.' : 'Lead time, packing, commercial notes, and any conditions.'}
                      />
                    </label>
                    <div>
                      <div className="mb-2 flex items-center gap-2">
                        <FileSignature className="h-4 w-4 text-slate-500" />
                        <span className="text-sm font-medium text-slate-700">Vendor signature</span>
                      </div>
                      <SignaturePad onChange={setSignatureData} />
                    </div>
                  </div>
                ) : (
                  <div className="mt-5">
                    <label className="space-y-2">
                      <span className="text-sm font-medium text-slate-700">Reason for rejection</span>
                      <textarea
                        value={rejectionReason}
                        onChange={(event) => setRejectionReason(event.target.value)}
                        disabled={isFinal || isExpired}
                        className="min-h-28 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-blue-400 disabled:bg-slate-50"
                        placeholder={isAgreement ? 'Explain why this agreement cannot be accepted.' : 'Explain why this quotation cannot be accepted.'}
                      />
                    </label>
                  </div>
                )}

                {error ? <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div> : null}

                <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
                  <p className="text-xs text-slate-500">
                    {isExpired ? `This secure ${isAgreement ? 'agreement' : 'quotation'} link has expired.` : isFinal ? `Your ${isAgreement ? 'agreement' : 'quotation'} response has already been recorded.` : `Submit once you have finished editing the ${isAgreement ? 'agreement' : 'quotation'} details.`}
                  </p>
                  <button
                    type="button"
                    onClick={() => void handleSubmit()}
                    disabled={submitting || isExpired || isFinal}
                    className="inline-flex items-center gap-2 rounded-2xl bg-blue-700 px-5 py-3 text-sm font-medium text-white hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : decision === 'approved' ? <CheckCircle2 className="h-4 w-4" /> : <SendHorizontal className="h-4 w-4" />}
                    {decision === 'approved' ? (isAgreement ? 'Submit signed agreement' : 'Submit signed quotation') : 'Submit rejection'}
                  </button>
                </div>
              </section>
            </div>

            <aside className="space-y-6">
              <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                <h2 className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-500">Response timeline</h2>
                <div className="mt-4 space-y-3 text-sm text-slate-600">
                  <p><span className="font-medium text-slate-900">Opened:</span> {formatDate(quotation?.vendor_opened_at)}</p>
                  <p><span className="font-medium text-slate-900">Responded:</span> {formatDate(quotation?.vendor_responded_at)}</p>
                  <p><span className="font-medium text-slate-900">Admin reviewed:</span> {formatDate(quotation?.admin_reviewed_at)}</p>
                </div>
              </section>

              <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                <h2 className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-500">Current outcome</h2>
                <div className="mt-4 space-y-3 text-sm text-slate-600">
                  {!isAgreement && <p><span className="font-medium text-slate-900">Vendor price:</span> {formatCurrency(quotation?.vendor_price)}</p>}
                  {!isAgreement && <p><span className="font-medium text-slate-900">Vendor MOQ:</span> {quotation?.vendor_moq ?? 'Not specified'}</p>}
                  <p><span className="font-medium text-slate-900">Vendor notes:</span> {quotation?.vendor_notes || 'Not provided'}</p>
                  <p><span className="font-medium text-slate-900">Rejection reason:</span> {quotation?.vendor_rejection_reason || 'Not rejected'}</p>
                  <p><span className="font-medium text-slate-900">Admin note:</span> {quotation?.admin_review_notes || 'Admin has not reviewed this yet.'}</p>
                </div>
              </section>

              {isFinal ? (
                <section className={`rounded-3xl border p-5 shadow-sm ${quotation?.status === 'admin_approved' ? 'border-emerald-200 bg-emerald-50' : 'border-amber-200 bg-amber-50'}`}>
                  <div className="flex items-start gap-3">
                    {quotation?.status === 'admin_approved' ? (
                      <CheckCircle2 className="mt-0.5 h-5 w-5 text-emerald-700" />
                    ) : (
                      <XCircle className="mt-0.5 h-5 w-5 text-amber-700" />
                    )}
                    <div>
                      <h3 className="font-semibold text-slate-900">
                        {quotation?.status === 'admin_approved' ? `${isAgreement ? 'Agreement' : 'Quotation'} approved by admin` : `${isAgreement ? 'Agreement' : 'Quotation'} closed`}
                      </h3>
                      <p className="mt-1 text-sm text-slate-600">
                        {quotation?.status === 'admin_approved'
                          ? `Your signed ${isAgreement ? 'agreement' : 'quotation'} has been received and approved.`
                          : `This ${isAgreement ? 'agreement' : 'quotation'} is no longer open for edits or resubmission.`}
                      </p>
                    </div>
                  </div>
                </section>
              ) : null}
            </aside>
          </div>
        </div>
      </div>
    </div>
  );
}

export function VendorDocumentPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto flex min-h-[70vh] max-w-4xl items-center justify-center px-4">
          <Loader2 className="h-8 w-8 animate-spin text-blue-700" />
        </div>
      }
    >
      <VendorDocumentContent />
    </Suspense>
  );
}
