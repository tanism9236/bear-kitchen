import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import type { ActivityLevel, Gender, Member } from '@/types';
import { useMembers } from '@/hooks/useMembers';
import { useToast } from '@/components/Toast';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { EmptyState } from '@/components/EmptyState';
import { recommendNutritionGoal, ACTIVITY_LABELS, GENDER_LABELS } from '@/utils/nutrition';

const ACTIVITY_OPTIONS = Object.entries(ACTIVITY_LABELS) as [
  ActivityLevel,
  string
][];

/** Editable draft of the selected member. */
interface MemberDraft {
  name: string;
  role: string;
  gender: Gender;
  age: string;
  height: string;
  weight: string;
  activityLevel: ActivityLevel;
  calories: string;
  protein: string;
  carbs: string;
  fat: string;
}

function toDraft(m: Member): MemberDraft {
  return {
    name: m.name,
    role: m.role,
    gender: m.gender,
    age: m.age > 0 ? String(m.age) : '',
    height: m.height > 0 ? String(m.height) : '',
    weight: m.weight > 0 ? String(m.weight) : '',
    activityLevel: m.activityLevel,
    calories: m.nutritionGoal.calories > 0 ? String(m.nutritionGoal.calories) : '',
    protein: m.nutritionGoal.protein > 0 ? String(m.nutritionGoal.protein) : '',
    carbs: m.nutritionGoal.carbs > 0 ? String(m.nutritionGoal.carbs) : '',
    fat: m.nutritionGoal.fat > 0 ? String(m.nutritionGoal.fat) : '',
  };
}

const num = (s: string): number => {
  const n = Number.parseFloat(s);
  return Number.isFinite(n) && n > 0 ? n : 0;
};

export function MembersPage() {
  const { members, loading, addMember, updateMember, deleteMember } = useMembers();
  const { showToast } = useToast();

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [draft, setDraft] = useState<MemberDraft | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  // 默认选中第一个成员
  useEffect(() => {
    if (!loading && !selectedId && members.length > 0) {
      setSelectedId(members[0].id);
    }
  }, [loading, selectedId, members]);

  const selected = useMemo(
    () => members.find((m) => m.id === selectedId) ?? null,
    [members, selectedId]
  );

  // 切换成员时重置表单
  useEffect(() => {
    setDraft(selected ? toDraft(selected) : null);
    setError(null);
  }, [selectedId]); // eslint-disable-line react-hooks/exhaustive-deps

  const set = (patch: Partial<MemberDraft>) =>
    setDraft((d) => (d ? { ...d, ...patch } : d));

  const handleAddMember = () => {
    const created = addMember({
      name: '新成员',
      role: '成员',
      gender: 'female',
      age: 0,
      height: 0,
      weight: 0,
      activityLevel: 'moderate',
      nutritionGoal: { calories: 0, protein: 0, carbs: 0, fat: 0 },
    });
    setSelectedId(created.id);
  };

  const handleGenerateGoal = () => {
    if (!draft) return;
    const goal = recommendNutritionGoal(
      draft.gender,
      num(draft.age),
      num(draft.height),
      num(draft.weight),
      draft.activityLevel
    );
    if (!goal) {
      setError('请先完整填写年龄、身高和体重，才能生成推荐目标');
      return;
    }
    setError(null);
    set({
      calories: String(goal.calories),
      protein: String(goal.protein),
      carbs: String(goal.carbs),
      fat: String(goal.fat),
    });
  };

  const handleSave = () => {
    if (!draft || !selected) return;
    if (draft.name.trim() === '') return setError('请输入成员名称');
    const ok = updateMember(selected.id, {
      name: draft.name.trim(),
      role: draft.role.trim() || '成员',
      gender: draft.gender,
      age: num(draft.age),
      height: num(draft.height),
      weight: num(draft.weight),
      activityLevel: draft.activityLevel,
      nutritionGoal: {
        calories: num(draft.calories),
        protein: num(draft.protein),
        carbs: num(draft.carbs),
        fat: num(draft.fat),
      },
    });
    if (!ok) showToast('保存失败：存储空间不足', 'error');
    else showToast('已保存');
  };

  const handleDelete = () => {
    if (!selected) return;
    const ok = deleteMember(selected.id);
    setConfirmDelete(false);
    setSelectedId(null);
    if (!ok) showToast('删除失败：存储空间不足', 'error');
    else showToast(`已删除「${selected.name}」`);
  };

  if (loading) {
    return (
      <div className="page-loading">
        <div className="spinner" />
      </div>
    );
  }

  return (
    <div className="myk-page">
      <div className="detail-topbar">
        <Link to="/my" className="btn btn-ghost">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
            <path d="M19 12H5M12 19l-7-7 7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          我的厨房
        </Link>
        <div className="detail-topbar-actions">
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={handleAddMember}
          >
            + 添加成员
          </button>
        </div>
      </div>

      {/* 1. 家庭成员 */}
      <section className="myk-section">
        {members.length === 0 ? (
          <EmptyState
            icon="🐻"
            title="还没有成员"
            description="点击右上角「+ 添加成员」创建"
          />
        ) : (
          <div className="myk-member-list">
            {members.map((m) => (
              <button
                key={m.id}
                type="button"
                className={`myk-member-card ${m.id === selectedId ? 'active' : ''}`}
                onClick={() => setSelectedId(m.id)}
              >
                <span className="myk-member-name">{m.name}</span>
                <span className="myk-member-role">{m.role}</span>
              </button>
            ))}
          </div>
        )}
      </section>

      {/* 2. 成员详情 + 3. Nutrition Goal */}
      {selected && draft && (
        <section className="myk-section myk-detail-card">
          <h2 className="detail-section-title">成员详情</h2>

          <div className="myk-form">
            <div className="form-field">
              <label className="form-label">名称</label>
              <input
                className="input"
                type="text"
                placeholder="如：Tan"
                value={draft.name}
                onChange={(e) => set({ name: e.target.value })}
              />
            </div>

            <div className="form-field">
              <label className="form-label">角色</label>
              <input
                className="input"
                type="text"
                placeholder="如：Owner / 成员"
                value={draft.role}
                onChange={(e) => set({ role: e.target.value })}
              />
            </div>

            <div className="form-field">
              <label className="form-label">性别</label>
              <div className="myk-segmented">
                {(['male', 'female'] as Gender[]).map((g) => (
                  <button
                    key={g}
                    type="button"
                    className={`myk-segment ${draft.gender === g ? 'active' : ''}`}
                    onClick={() => set({ gender: g })}
                  >
                    {GENDER_LABELS[g]}
                  </button>
                ))}
              </div>
            </div>

            <div className="myk-field-row">
              <div className="form-field">
                <label className="form-label">年龄</label>
                <input
                  className="input"
                  type="number"
                  inputMode="numeric"
                  min="0"
                  placeholder="岁"
                  value={draft.age}
                  onChange={(e) => set({ age: e.target.value })}
                />
              </div>
              <div className="form-field">
                <label className="form-label">身高</label>
                <input
                  className="input"
                  type="number"
                  inputMode="decimal"
                  min="0"
                  placeholder="cm"
                  value={draft.height}
                  onChange={(e) => set({ height: e.target.value })}
                />
              </div>
              <div className="form-field">
                <label className="form-label">体重</label>
                <input
                  className="input"
                  type="number"
                  inputMode="decimal"
                  min="0"
                  placeholder="kg"
                  value={draft.weight}
                  onChange={(e) => set({ weight: e.target.value })}
                />
              </div>
            </div>

            <div className="form-field">
              <label className="form-label">活动水平</label>
              <select
                className="input myk-select"
                value={draft.activityLevel}
                onChange={(e) =>
                  set({ activityLevel: e.target.value as ActivityLevel })
                }
              >
                {ACTIVITY_OPTIONS.map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <h2 className="detail-section-title myk-goal-title">Nutrition Goal</h2>

          <div className="myk-form">
            <div className="myk-goal-actions">
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={handleGenerateGoal}
              >
                生成推荐目标
              </button>
              <span className="myk-goal-hint">每日目标，可手动修改</span>
            </div>

            <div className="myk-goal-grid">
              <div className="myk-goal-cell">
                <label className="form-label">热量</label>
                <input
                  className="input"
                  type="number"
                  inputMode="numeric"
                  min="0"
                  placeholder="kcal"
                  value={draft.calories}
                  onChange={(e) => set({ calories: e.target.value })}
                />
                <span className="myk-goal-unit">kcal</span>
              </div>
              <div className="myk-goal-cell">
                <label className="form-label">蛋白质</label>
                <input
                  className="input"
                  type="number"
                  inputMode="numeric"
                  min="0"
                  placeholder="g"
                  value={draft.protein}
                  onChange={(e) => set({ protein: e.target.value })}
                />
                <span className="myk-goal-unit">g</span>
              </div>
              <div className="myk-goal-cell">
                <label className="form-label">碳水</label>
                <input
                  className="input"
                  type="number"
                  inputMode="numeric"
                  min="0"
                  placeholder="g"
                  value={draft.carbs}
                  onChange={(e) => set({ carbs: e.target.value })}
                />
                <span className="myk-goal-unit">g</span>
              </div>
              <div className="myk-goal-cell">
                <label className="form-label">脂肪</label>
                <input
                  className="input"
                  type="number"
                  inputMode="numeric"
                  min="0"
                  placeholder="g"
                  value={draft.fat}
                  onChange={(e) => set({ fat: e.target.value })}
                />
                <span className="myk-goal-unit">g</span>
              </div>
            </div>

            {error && <p className="inv-form-error">{error}</p>}

            <div className="myk-detail-actions">
              <button
                type="button"
                className="btn form-pill-btn-primary myk-save-btn"
                onClick={handleSave}
              >
                保存
              </button>
              <button
                type="button"
                className="btn detail-delete-btn"
                onClick={() => setConfirmDelete(true)}
              >
                删除成员
              </button>
            </div>
          </div>
        </section>
      )}

      <ConfirmDialog
        open={confirmDelete}
        title="删除成员"
        message={`确定要删除「${selected?.name ?? ''}」吗？其营养目标也会一并删除。`}
        confirmText="删除"
        cancelText="取消"
        danger
        onConfirm={handleDelete}
        onCancel={() => setConfirmDelete(false)}
      />
    </div>
  );
}
