import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { usePlans, defaultPlanTitle } from '@/hooks/usePlans';
import { EmptyState } from '@/components/EmptyState';
import { useToast } from '@/components/Toast';
import type { Plan, PlanType } from '@/types';
import { PLAN_TYPE_LABELS } from '@/types';

/** 'YYYY-MM-DD' → '8/17' */
function shortDate(d: string): string {
  const [, m, day] = d.split('-');
  return `${Number(m)}/${Number(day)}`;
}

export function planDateRangeLabel(plan: Plan): string {
  if (plan.type === 'weekly' && plan.endDate) {
    return `${shortDate(plan.startDate)} - ${shortDate(plan.endDate)}`;
  }
  return shortDate(plan.startDate);
}

function addDays(dateStr: string, days: number): string {
  const d = new Date(`${dateStr}T00:00:00`);
  d.setDate(d.getDate() + days);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function todayStr(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function diffDays(start: string, end: string): number {
  const s = new Date(`${start}T00:00:00`).getTime();
  const e = new Date(`${end}T00:00:00`).getTime();
  return Math.round((e - s) / 86400000);
}

const TYPE_OPTIONS: { value: PlanType; label: string; hint: string }[] = [
  { value: 'weekly', label: '一周计划', hint: '家庭一周饮食安排' },
  { value: 'daily', label: '单日计划', hint: '某一天的三餐' },
  { value: 'event', label: '聚餐计划', hint: '生日、朋友聚餐等' },
];

export function PlanPage() {
  const { plans, loading, addPlan } = usePlans();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [createOpen, setCreateOpen] = useState(false);
  const [type, setType] = useState<PlanType>('weekly');
  const [startDate, setStartDate] = useState(todayStr);
  const [endDate, setEndDate] = useState(() => addDays(todayStr(), 6));
  const [title, setTitle] = useState('');
  const [error, setError] = useState<string | null>(null);

  const sortedPlans = useMemo(
    () => [...plans].sort((a, b) => (a.startDate < b.startDate ? 1 : -1)),
    [plans]
  );

  const resetCreate = () => {
    setType('weekly');
    setTitle('');
    setError(null);
  };

  const openCreate = () => {
    setStartDate(todayStr());
    setEndDate(addDays(todayStr(), 6));
    resetCreate();
    setCreateOpen(true);
  };

  const handleTypeChange = (next: PlanType) => {
    setType(next);
    if (next === 'weekly' && endDate < startDate) {
      setEndDate(addDays(startDate, 6));
    }
  };

  const handleStartDateChange = (value: string) => {
    setStartDate(value);
    if (type === 'weekly' && value && endDate < value) {
      setEndDate(addDays(value, 6));
    }
  };

  const handleCreate = () => {
    if (!startDate) {
      setError('请选择日期');
      return;
    }
    let finalEndDate: string | undefined;
    if (type === 'weekly') {
      if (!endDate) {
        setError('请选择结束日期');
        return;
      }
      if (endDate < startDate) {
        setError('结束日期不能早于开始日期');
        return;
      }
      finalEndDate = endDate;
    }
    const finalTitle =
      title.trim() || defaultPlanTitle(type, startDate, finalEndDate);
    if (!finalTitle) {
      setError('请填写计划名称');
      return;
    }
    const plan = addPlan({
      type,
      title: finalTitle,
      startDate,
      endDate: finalEndDate,
    });
    setCreateOpen(false);
    if (!plan) return;
    showToast('计划已创建');
    navigate(`/plan/${plan.id}`);
  };

  if (loading) {
    return (
      <div className="page-loading">
        <div className="spinner" />
      </div>
    );
  }

  return (
    <div className="plan-page">
      <div className="page-header">
        <div className="page-header-left">
          <h1 className="page-title">饮食计划</h1>
          <p className="page-subtitle">Plan the week, enjoy the meal.</p>
        </div>
      </div>

      {sortedPlans.length === 0 ? (
        <EmptyState
          icon="📅"
          title="还没有计划"
          description="创建一周计划或聚餐计划，安排家庭饮食"
          action={
            <button className="btn btn-primary" onClick={openCreate}>
              创建计划
            </button>
          }
        />
      ) : (
        <div className="plan-list">
          {sortedPlans.map((plan) => (
            <Link key={plan.id} to={`/plan/${plan.id}`} className="plan-card">
              <div className="plan-card-top">
                <span className={`plan-type-chip plan-type-${plan.type}`}>
                  {PLAN_TYPE_LABELS[plan.type]}
                </span>
                <span className="plan-card-meal-count">
                  {plan.meals.length > 0 ? `${plan.meals.length} 餐` : '空白计划'}
                </span>
              </div>
              <h3 className="plan-card-title">{plan.title}</h3>
              <span className="plan-card-dates">{planDateRangeLabel(plan)}</span>
            </Link>
          ))}
        </div>
      )}

      <button
        className="fab-add"
        title="创建计划"
        aria-label="创建计划"
        onClick={openCreate}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
          <path
            d="M12 5v14M5 12h14"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      </button>

      {createOpen && (
        <div className="overlay" onClick={() => setCreateOpen(false)}>
          <div
            className="plan-create-dialog animate-scaleIn"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="confirm-dialog-title">创建计划</h3>

            <div className="form-field">
              <label className="form-label">类型</label>
              <div className="plan-type-options">
                {TYPE_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    className={`plan-type-option ${type === opt.value ? 'active' : ''}`}
                    onClick={() => handleTypeChange(opt.value)}
                  >
                    <span className="plan-type-option-label">{opt.label}</span>
                    <span className="plan-type-option-hint">{opt.hint}</span>
                  </button>
                ))}
              </div>
            </div>

            {type === 'weekly' ? (
              <>
                <div className="form-field">
                  <label className="form-label">开始日期</label>
                  <input
                    type="date"
                    className="input"
                    value={startDate}
                    onChange={(e) => handleStartDateChange(e.target.value)}
                  />
                </div>
                <div className="form-field">
                  <label className="form-label">结束日期</label>
                  <input
                    type="date"
                    className="input"
                    value={endDate}
                    min={startDate || undefined}
                    onChange={(e) => setEndDate(e.target.value)}
                  />
                  {startDate && endDate && endDate >= startDate && (
                    <p className="plan-date-hint">
                      覆盖 {shortDate(startDate)} - {shortDate(endDate)}，共{' '}
                      {diffDays(startDate, endDate) + 1} 天
                    </p>
                  )}
                </div>
              </>
            ) : (
              <div className="form-field">
                <label className="form-label">日期</label>
                <input
                  type="date"
                  className="input"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
            )}

            <div className="form-field">
              <label className="form-label">
                计划名称{type !== 'event' && '（可选）'}
              </label>
              <input
                type="text"
                className="input"
                placeholder={
                  type === 'event'
                    ? '例如：生日聚餐'
                    : defaultPlanTitle(
                        type,
                        startDate,
                        type === 'weekly' ? endDate : undefined
                      ) || '自定义名称'
                }
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            {error && <p className="form-error">{error}</p>}

            <div className="confirm-dialog-actions">
              <button
                className="btn btn-secondary"
                onClick={() => setCreateOpen(false)}
              >
                取消
              </button>
              <button className="btn btn-primary" onClick={handleCreate}>
                创建
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
