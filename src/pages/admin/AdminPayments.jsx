import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import api from '../../services/api';
import StatusBadge from '../../components/StatusBadge';
import Modal from '../../components/Modal';
import { useToast } from '../../context/ToastContext';
import { 
  Receipt, 
  User, 
  RefreshCw,
  Loader2,
  Edit3,
  Trash2
} from 'lucide-react';
import { formatCurrency, RUPEE_SYMBOL } from '../../utils/formatters';

const ALLOWED_PAYMENT_METHODS = ['Cash', 'Cheque', 'Bank Transfer', 'UPI', 'Card'];

export const AdminPayments = () => {
  const toast = useToast();
  const location = useLocation();

  const [students, setStudents] = useState([]);
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [feeData, setFeeData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [studentLoading, setStudentLoading] = useState(false);
  const [error, setError] = useState('');

  // Payment Recording Modal
  const [isRecordModalOpen, setIsRecordModalOpen] = useState(false);
  const [targetInstallment, setTargetInstallment] = useState(null);
  const [paymentForm, setPaymentForm] = useState({
    payment_method: 'Cash',
    reference_number: '',
    remarks: ''
  });
  const [recordLoading, setRecordLoading] = useState(false);
  const [recordError, setRecordError] = useState('');

  // Payment Edit Modal
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editPaymentTarget, setEditPaymentTarget] = useState(null);
  const [editPaymentForm, setEditPaymentForm] = useState({
    payment_method: 'Cash',
    reference_number: '',
    remarks: ''
  });
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState('');

  // Payment Delete Modal
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deletePaymentTarget, setDeletePaymentTarget] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  // Receipt Modal
  const [selectedReceipt, setSelectedReceipt] = useState(null);

  // Load students list initially
  useEffect(() => {
    async function init() {
      setLoading(true);
      setError('');
      try {
        const res = await api.get('/students');
        const list = res.data || [];
        setStudents(list);

        // Check URL parameter ?student_id=
        const params = new URLSearchParams(location.search);
        const sid = params.get('student_id');
        if (sid && list.some((s) => String(s.id) === String(sid))) {
          setSelectedStudentId(String(sid));
        } else if (list.length > 0) {
          setSelectedStudentId(String(list[0].id));
        }
      } catch (err) {
        setError(err.message || 'Failed to load students for fee management');
      } finally {
        setLoading(false);
      }
    }
    init();
  }, [location.search]);

  // Load fees whenever selectedStudentId changes
  useEffect(() => {
    if (!selectedStudentId) {
      setFeeData(null);
      return;
    }

    async function fetchFees() {
      setStudentLoading(true);
      try {
        const res = await api.get(`/students/${selectedStudentId}/fees`);
        setFeeData(res.data);
      } catch (err) {
        toast.error(err.message || 'Failed to load fee ledger for student');
        setFeeData(null);
      } finally {
        setStudentLoading(false);
      }
    }
    fetchFees();
  }, [selectedStudentId]);

  const openRecordPaymentModal = (installment) => {
    setTargetInstallment(installment);
    setRecordError('');
    setPaymentForm({
      payment_method: 'Cash',
      reference_number: '',
      remarks: ''
    });
    setIsRecordModalOpen(true);
  };

  const handleRecordSubmit = async (e) => {
    e.preventDefault();
    if (!targetInstallment) return;
    setRecordError('');

    setRecordLoading(true);
    try {
      const res = await api.post('/payments', {
        installment_id: targetInstallment.id,
        amount_paid: Number(targetInstallment.amount),
        payment_method: paymentForm.payment_method,
        reference_number: paymentForm.reference_number.trim() || null,
        remarks: paymentForm.remarks.trim() || null
      });

      const paymentData = res.data?.payment || res.data;
      const receiptNumber = paymentData?.receipt_number || 'N/A';

      toast.success(`Payment recorded successfully! Generated Receipt #${receiptNumber}`);
      setIsRecordModalOpen(false);

      // Refresh fee data for current student
      const refreshRes = await api.get(`/students/${selectedStudentId}/fees`);
      setFeeData(refreshRes.data);

      if (paymentData) {
        const studentInfo = res.data?.student || refreshRes.data?.student;
        const studentName = studentInfo?.name || (studentInfo ? `${studentInfo.first_name || ''} ${studentInfo.last_name || ''}`.trim() : '');
        const className = typeof studentInfo?.class === 'object' ? studentInfo.class?.name : (studentInfo?.class || studentInfo?.class_name || '');

        setSelectedReceipt({
          ...paymentData,
          amount_paid: paymentData.amount_paid || targetInstallment?.amount || 0,
          student_name: studentName,
          class_name: className,
          installment_number: res.data?.installment?.installment_number || targetInstallment?.installment_number
        });
      }
    } catch (err) {
      setRecordError(err.message || 'Failed to record installment payment');
    } finally {
      setRecordLoading(false);
    }
  };

  const openEditPaymentModal = (inst) => {
    setEditPaymentTarget(inst);
    setEditError('');
    setEditPaymentForm({
      payment_method: inst.payment?.payment_method || 'Cash',
      reference_number: inst.payment?.reference_number || '',
      remarks: inst.payment?.remarks || ''
    });
    setIsEditModalOpen(true);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!editPaymentTarget?.payment?.id) return;
    setEditError('');
    setEditLoading(true);
    try {
      await api.put(`/payments/${editPaymentTarget.payment.id}`, {
        payment_method: editPaymentForm.payment_method,
        reference_number: editPaymentForm.reference_number.trim() || null,
        remarks: editPaymentForm.remarks.trim() || null
      });
      toast.success(`Payment details for Receipt #${editPaymentTarget.payment.receipt_number} updated.`);
      setIsEditModalOpen(false);
      setEditPaymentTarget(null);

      // Refresh fee data for current student
      const refreshRes = await api.get(`/students/${selectedStudentId}/fees`);
      setFeeData(refreshRes.data);
    } catch (err) {
      setEditError(err.message || 'Failed to update payment record');
    } finally {
      setEditLoading(false);
    }
  };

  const openDeletePaymentModal = (inst) => {
    setDeletePaymentTarget(inst);
    setDeleteError('');
    setIsDeleteModalOpen(true);
  };

  const handleDeleteSubmit = async (e) => {
    e.preventDefault();
    if (!deletePaymentTarget?.payment?.id) return;
    setDeleteError('');
    setDeleteLoading(true);
    try {
      await api.delete(`/payments/${deletePaymentTarget.payment.id}`);
      toast.success(`Payment receipt #${deletePaymentTarget.payment.receipt_number} deleted. Installment reverted to PENDING.`);
      setIsDeleteModalOpen(false);
      setDeletePaymentTarget(null);

      // Refresh fee data for current student
      const refreshRes = await api.get(`/students/${selectedStudentId}/fees`);
      setFeeData(refreshRes.data);
    } catch (err) {
      setDeleteError(err.message || 'Failed to delete payment record');
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 16, marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', color: 'var(--text-main)', marginBottom: 4 }}>
            Fee Ledgers & Payment Recording
          </h1>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
            Track quarterly installment clearance and record full installment payments with automated receipt generation.
          </p>
        </div>
      </div>

      {/* Student Selector Card */}
      <div className="card" style={{ padding: 20, marginBottom: 24 }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1, minWidth: 'min(100%, 280px)' }}>
            <User size={18} color="var(--crimson-700)" />
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>
                Select Enrolled Student:
              </label>
              <select
                className="form-select"
                value={selectedStudentId}
                onChange={(e) => setSelectedStudentId(e.target.value)}
                style={{ padding: '8px 12px', fontSize: '0.875rem' }}
              >
                {students.map((s) => (
                  <option key={s.id} value={s.id}>
                    STD-{String(s.id).padStart(4, '0')} — {s.first_name} {s.last_name} ({s.class_name} - Sec {s.section_name})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {feeData && (
            <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Academic Year</div>
                <div style={{ fontWeight: 700, fontSize: '0.9375rem' }}>{feeData.fee_structure?.academic_year || '2026-2027'}</div>
              </div>
            </div>
          )}
        </div>
      </div>

      {studentLoading ? (
        <div style={{ padding: 60, textAlign: 'center', color: 'var(--text-muted)' }}>
          <RefreshCw size={24} className="animate-spin" style={{ margin: '0 auto 12px', color: 'var(--crimson-700)' }} />
          <p>Loading student fee ledger...</p>
        </div>
      ) : !feeData ? (
        <div className="card" style={{ padding: 48, textAlign: 'center', color: 'var(--text-muted)' }}>
          <Receipt size={36} color="#cbd5e1" style={{ margin: '0 auto 12px' }} />
          <div style={{ fontWeight: 600, color: 'var(--text-main)', marginBottom: 4 }}>No fee schedule loaded</div>
          <p style={{ fontSize: '0.8125rem' }}>Select an enrolled student above to inspect installment status.</p>
        </div>
      ) : (
        <>
          {/* Financial Summary Cards */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 200px), 1fr))',
            gap: 16,
            marginBottom: 24
          }}>
            <div className="card" style={{ padding: 18 }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: 4 }}>
                Annual Tuition Fee
              </div>
              <div style={{ fontSize: '1.625rem', fontWeight: 800, fontFamily: 'Outfit, sans-serif' }}>
                {formatCurrency(feeData.summary?.annual_fee || 0, true)}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 4 }}>
                4 Quarters @ {formatCurrency(Number(feeData.summary?.annual_fee || 0) / 4, true)}
              </div>
            </div>

            <div className="card" style={{ padding: 18, backgroundColor: '#f0fdf4', borderColor: '#bbf7d0' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#166534', marginBottom: 4 }}>
                Total Paid
              </div>
              <div style={{ fontSize: '1.625rem', fontWeight: 800, fontFamily: 'Outfit, sans-serif', color: '#166534' }}>
                {formatCurrency(feeData.summary?.total_paid || 0, true)}
              </div>
              <div style={{ fontSize: '0.75rem', color: '#166534', marginTop: 4 }}>
                Cleared Installments
              </div>
            </div>

            <div className="card" style={{ padding: 18, backgroundColor: '#fef2f2', borderColor: '#fecaca' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#991b1b', marginBottom: 4 }}>
                Total Pending
              </div>
              <div style={{ fontSize: '1.625rem', fontWeight: 800, fontFamily: 'Outfit, sans-serif', color: '#991b1b' }}>
                {formatCurrency(feeData.summary?.total_pending || 0, true)}
              </div>
              <div style={{ fontSize: '0.75rem', color: '#991b1b', marginTop: 4 }}>
                Awaiting Payment
              </div>
            </div>
          </div>

          {/* 4 Quarterly Installments Table */}
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <div className="card-header" style={{ margin: 0, padding: '16px 20px' }}>
              <div>
                <h3 className="card-title">Quarterly Installment Schedule (Q1 - Q4)</h3>
                <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                  Mandatory sequential quarterly fee installments for student: {feeData.student?.first_name} {feeData.student?.last_name}
                </p>
              </div>
            </div>

            <div className="table-container" style={{ border: 'none', borderRadius: 0 }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Quarter</th>
                    <th>Due Date</th>
                    <th>Installment Amount</th>
                    <th>Status</th>
                    <th>Receipt & Payment Details</th>
                    <th style={{ textAlign: 'right' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {feeData.installments.map((inst) => {
                    const isPaid = inst.status === 'PAID';
                    return (
                      <tr key={inst.id}>
                        <td>
                          <div style={{ fontWeight: 700, fontSize: '0.9375rem' }}>
                            Quarter {inst.installment_number}
                          </div>
                          <div style={{ fontSize: '0.6875rem', color: 'var(--text-light)' }}>
                            Inst #{inst.id}
                          </div>
                        </td>
                        <td>
                          <span style={{ fontSize: '0.8125rem', fontWeight: 500 }}>
                            {inst.due_date ? new Date(inst.due_date).toLocaleDateString() : 'N/A'}
                          </span>
                        </td>
                        <td>
                          <span style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--text-main)' }}>
                            {formatCurrency(inst.amount, true)}
                          </span>
                        </td>
                        <td>
                          <StatusBadge status={inst.status} />
                        </td>
                        <td>
                          {isPaid && inst.payment ? (
                            <div>
                              <div style={{ fontWeight: 600, fontSize: '0.8125rem', color: 'var(--crimson-800)' }}>
                                Receipt #{inst.payment.receipt_number}
                              </div>
                              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                {inst.payment.payment_method} &bull; {new Date(inst.payment.payment_date).toLocaleDateString()}
                                {inst.payment.reference_number && ` &bull; Ref: ${inst.payment.reference_number}`}
                              </div>
                            </div>
                          ) : (
                            <span style={{ fontSize: '0.8125rem', color: 'var(--text-light)' }}>—</span>
                          )}
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          {!isPaid ? (
                            <button
                              type="button"
                              onClick={() => openRecordPaymentModal(inst)}
                              className="btn btn-primary btn-sm"
                              style={{ padding: '6px 14px', fontSize: '0.8125rem' }}
                            >
                              <Receipt size={14} />
                              <span>Record Payment</span>
                            </button>
                          ) : (
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 6 }}>
                              <button
                                type="button"
                                onClick={() => setSelectedReceipt({
                                  ...inst.payment,
                                  amount_paid: inst.payment?.amount_paid || inst.amount || 0,
                                  student_name: feeData.student?.name || `${feeData.student?.first_name || ''} ${feeData.student?.last_name || ''}`.trim(),
                                  class_name: feeData.student?.class?.name || feeData.student?.class_name || (typeof feeData.student?.class === 'string' ? feeData.student.class : ''),
                                  installment_number: inst.installment_number
                                })}
                                className="btn btn-secondary btn-sm"
                                style={{ padding: '4px 8px', fontSize: '0.75rem' }}
                                title="View Receipt"
                              >
                                <span>Receipt</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => openEditPaymentModal(inst)}
                                className="btn btn-secondary btn-sm"
                                style={{ padding: '4px 8px', fontSize: '0.75rem' }}
                                title="Edit Payment"
                              >
                                <Edit3 size={13} />
                                <span>Edit</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => openDeletePaymentModal(inst)}
                                className="btn btn-secondary btn-sm"
                                style={{
                                  padding: '4px 8px',
                                  fontSize: '0.75rem',
                                  color: 'var(--crimson-700)',
                                  borderColor: '#fecaca',
                                  backgroundColor: '#ffffff'
                                }}
                                title="Delete Payment Record"
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Record Payment Modal */}
      <Modal
        isOpen={isRecordModalOpen}
        onClose={() => !recordLoading && setIsRecordModalOpen(false)}
        title={`Record Payment for Quarter ${targetInstallment?.installment_number}`}
        maxWidth="500px"
      >
        <form onSubmit={handleRecordSubmit}>
          {recordError && (
            <div style={{
              padding: '10px 14px',
              backgroundColor: 'var(--status-rejected-bg)',
              color: 'var(--status-rejected-text)',
              border: '1px solid var(--status-rejected-border)',
              borderRadius: 8,
              fontSize: '0.8125rem',
              marginBottom: 16
            }}>
              {recordError}
            </div>
          )}

          <div style={{
            padding: 14,
            backgroundColor: '#f8fafc',
            border: '1px solid var(--border-subtle)',
            borderRadius: 8,
            marginBottom: 18,
            fontSize: '0.8125rem'
          }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <div><strong>Student:</strong> {feeData?.student?.first_name} {feeData?.student?.last_name}</div>
              <div><strong>Class:</strong> {feeData?.student?.class_name}</div>
              <div><strong>Quarter:</strong> Q{targetInstallment?.installment_number}</div>
              <div><strong>Fixed Amount:</strong> {formatCurrency(targetInstallment?.amount || 0, true)}</div>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Payment Amount ({RUPEE_SYMBOL}) *</label>
            <input
              type="text"
              className="form-input"
              value={`${formatCurrency(targetInstallment?.amount || 0, true)} (Full Installment Required)`}
              disabled
              style={{ backgroundColor: 'var(--bg-subtle)', fontWeight: 700 }}
            />
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 4 }}>
              * Per school operations policy, partial installment payments are not permitted.
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Payment Method *</label>
            <select
              className="form-select"
              value={paymentForm.payment_method}
              onChange={(e) => setPaymentForm({ ...paymentForm, payment_method: e.target.value })}
              required
            >
              {ALLOWED_PAYMENT_METHODS.map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Transaction Reference Number</label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. CHEQ-8902 or UPI/NEFT-49102"
              value={paymentForm.reference_number}
              onChange={(e) => setPaymentForm({ ...paymentForm, reference_number: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Remarks / Administrative Notes</label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. Received at bursar counter"
              value={paymentForm.remarks}
              onChange={(e) => setPaymentForm({ ...paymentForm, remarks: e.target.value })}
            />
          </div>

          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 20 }}>
            <button
              type="button"
              disabled={recordLoading}
              onClick={() => setIsRecordModalOpen(false)}
              className="btn btn-secondary btn-sm"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={recordLoading}
              className="btn btn-primary btn-sm"
            >
              {recordLoading ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  <span>Recording Payment...</span>
                </>
              ) : (
                <span>Confirm & Generate Receipt</span>
              )}
            </button>
          </div>
        </form>
      </Modal>

      {/* Official Receipt Viewer Modal */}
      <Modal
        isOpen={Boolean(selectedReceipt)}
        onClose={() => setSelectedReceipt(null)}
        title="Official School Payment Receipt"
        maxWidth="500px"
        footer={
          <div style={{ display: 'flex', justifyContent: 'flex-end', width: '100%' }}>
            <button
              type="button"
              onClick={() => setSelectedReceipt(null)}
              className="btn btn-primary btn-sm"
            >
              Done
            </button>
          </div>
        }
      >
        {selectedReceipt && (() => {
          const rawPayment = selectedReceipt.payment || selectedReceipt;
          const studentObj = selectedReceipt.student || (feeData?.student ? feeData.student : null);
          const studentName = selectedReceipt.student_name || studentObj?.name || (studentObj ? `${studentObj.first_name || ''} ${studentObj.last_name || ''}`.trim() : '');
          const className = selectedReceipt.class_name || (typeof studentObj?.class === 'object' ? studentObj?.class?.name : (studentObj?.class || studentObj?.class_name || ''));
          const installmentNum = selectedReceipt.installment_number || selectedReceipt.installment?.installment_number || rawPayment.installment_number;

          const receipt = {
            ...rawPayment,
            amount_paid: rawPayment.amount_paid !== undefined && rawPayment.amount_paid !== null && rawPayment.amount_paid !== '' ? rawPayment.amount_paid : (rawPayment.amount || targetInstallment?.amount || 0),
            receipt_number: rawPayment.receipt_number || 'N/A',
            payment_method: rawPayment.payment_method || 'Cash',
            student_name: studentName,
            class_name: className,
            installment_number: installmentNum
          };

          return (
            <div style={{
              border: '2px solid var(--border-subtle)',
              borderRadius: 10,
              padding: 20,
              backgroundColor: '#ffffff'
            }}>
              <div style={{ textAlign: 'center', borderBottom: '1px dashed var(--border-medium)', paddingBottom: 16, marginBottom: 16 }}>
                <div style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: '1.125rem', color: 'var(--crimson-800)' }}>
                  OAKRIDGE ACADEMY
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  Official Installment Fee Clearance Receipt
                </div>
                <div style={{
                  marginTop: 10,
                  display: 'inline-block',
                  padding: '4px 12px',
                  backgroundColor: '#ecfdf5',
                  color: '#065f46',
                  borderRadius: 4,
                  fontWeight: 800,
                  fontSize: '0.9375rem'
                }}>
                  RECEIPT #{receipt.receipt_number || 'N/A'}
                </div>
              </div>

              {(receipt.student_name || receipt.installment_number) && (
                <div style={{
                  padding: '10px 12px',
                  backgroundColor: '#f8fafc',
                  borderRadius: 6,
                  marginBottom: 16,
                  fontSize: '0.8125rem',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <div>
                    <span style={{ color: 'var(--text-muted)' }}>Student: </span>
                    <strong>{receipt.student_name || 'Enrolled Student'}</strong>
                    {receipt.class_name && <span style={{ color: 'var(--text-muted)' }}> ({receipt.class_name})</span>}
                  </div>
                  {receipt.installment_number && (
                    <div style={{ fontWeight: 600, color: 'var(--crimson-700)' }}>
                      Quarter {receipt.installment_number}
                    </div>
                  )}
                </div>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: '0.875rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Amount Paid:</span>
                  <span style={{ fontWeight: 800, color: 'var(--text-main)', fontSize: '1rem' }}>
                    {formatCurrency(receipt.amount_paid || 0, true)}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Payment Method:</span>
                  <span style={{ fontWeight: 600 }}>{receipt.payment_method || 'N/A'}</span>
                </div>
                {receipt.reference_number && (
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Reference #:</span>
                    <code>{receipt.reference_number}</code>
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Payment Date:</span>
                  <span>{new Date(receipt.payment_date || Date.now()).toLocaleDateString()}</span>
                </div>
                {receipt.remarks && (
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Remarks:</span>
                    <span>{receipt.remarks}</span>
                  </div>
                )}
              </div>

              <div style={{
                marginTop: 20,
                paddingTop: 12,
                borderTop: '1px solid var(--border-subtle)',
                textAlign: 'center',
                fontSize: '0.6875rem',
                color: 'var(--text-light)'
              }}>
                System Generated Receipt &bull; Valid without physical signature
              </div>
            </div>
          );
        })()}
      </Modal>

      {/* Edit Payment Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => !editLoading && setIsEditModalOpen(false)}
        title={`Edit Payment - Receipt #${editPaymentTarget?.payment?.receipt_number || 'N/A'}`}
        maxWidth="500px"
      >
        <form onSubmit={handleEditSubmit}>
          {editError && (
            <div style={{
              padding: '10px 14px',
              backgroundColor: 'var(--status-rejected-bg)',
              color: 'var(--status-rejected-text)',
              border: '1px solid var(--status-rejected-border)',
              borderRadius: 8,
              fontSize: '0.8125rem',
              marginBottom: 16
            }}>
              {editError}
            </div>
          )}

          <div style={{
            padding: '12px 14px',
            backgroundColor: '#f8fafc',
            borderRadius: 8,
            marginBottom: 16,
            fontSize: '0.875rem'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
              <span style={{ color: 'var(--text-muted)' }}>Student:</span>
              <strong>{feeData?.student?.first_name} {feeData?.student?.last_name}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
              <span style={{ color: 'var(--text-muted)' }}>Installment:</span>
              <span>Quarter {editPaymentTarget?.installment_number}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-muted)' }}>Amount Paid:</span>
              <strong style={{ color: 'var(--crimson-800)' }}>
                {formatCurrency(editPaymentTarget?.payment?.amount_paid || editPaymentTarget?.amount || 0)}
              </strong>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Payment Method *</label>
            <select
              className="form-select"
              value={editPaymentForm.payment_method}
              onChange={(e) => setEditPaymentForm({ ...editPaymentForm, payment_method: e.target.value })}
              required
            >
              {ALLOWED_PAYMENT_METHODS.map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Reference / Transaction Number</label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. UPI-123456 or Cheque #889900"
              maxLength={100}
              value={editPaymentForm.reference_number}
              onChange={(e) => setEditPaymentForm({ ...editPaymentForm, reference_number: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Remarks / Accounting Notes</label>
            <textarea
              className="form-textarea"
              rows={2}
              placeholder="Optional notes or cash counter receipt info"
              maxLength={500}
              value={editPaymentForm.remarks}
              onChange={(e) => setEditPaymentForm({ ...editPaymentForm, remarks: e.target.value })}
            />
          </div>

          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 20 }}>
            <button
              type="button"
              disabled={editLoading}
              onClick={() => setIsEditModalOpen(false)}
              className="btn btn-secondary btn-sm"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={editLoading}
              className="btn btn-primary btn-sm"
            >
              {editLoading ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <span>Save Changes</span>
              )}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Payment Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => !deleteLoading && setIsDeleteModalOpen(false)}
        title="Delete Payment Record"
        maxWidth="480px"
      >
        <form onSubmit={handleDeleteSubmit}>
          {deleteError && (
            <div style={{
              padding: '10px 14px',
              backgroundColor: 'var(--status-rejected-bg)',
              color: 'var(--status-rejected-text)',
              border: '1px solid var(--status-rejected-border)',
              borderRadius: 8,
              fontSize: '0.8125rem',
              marginBottom: 16
            }}>
              {deleteError}
            </div>
          )}

          <div style={{ marginBottom: 16, fontSize: '0.875rem', color: 'var(--text-main)', lineHeight: 1.5 }}>
            Are you sure you want to delete payment receipt <strong>#{deletePaymentTarget?.payment?.receipt_number}</strong> for <strong>Quarter {deletePaymentTarget?.installment_number}</strong> ({formatCurrency(deletePaymentTarget?.payment?.amount_paid || deletePaymentTarget?.amount || 0)})?
          </div>

          <div style={{
            padding: '10px 14px',
            backgroundColor: '#fffbeb',
            color: '#92400e',
            border: '1px solid #fde68a',
            borderRadius: 8,
            fontSize: '0.75rem',
            marginBottom: 20
          }}>
            Warning: Deleting this payment will permanently remove the receipt record and revert Quarter {deletePaymentTarget?.installment_number} status from <strong>PAID</strong> back to <strong>PENDING</strong>.
          </div>

          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <button
              type="button"
              disabled={deleteLoading}
              onClick={() => setIsDeleteModalOpen(false)}
              className="btn btn-secondary btn-sm"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={deleteLoading}
              className="btn btn-danger btn-sm"
            >
              {deleteLoading ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  <span>Deleting...</span>
                </>
              ) : (
                <>
                  <Trash2 size={14} />
                  <span>Delete Record</span>
                </>
              )}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default AdminPayments;
