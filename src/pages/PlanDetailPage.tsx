import { useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { usePlans } from '@/hooks/usePlans';
import { useRecipes } from '@/hooks/useRecipes';
import { useMembers } from '@/hooks/useMembers';
import { EmptyState } from '@/components/EmptyState';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { BackButton } from '@/components/BackButton';
import { usePageLabel } from '@/navigation/NavigationProvider';
import { useToast } from '@/components/Toast';
import { generateId } from '@/utils/id';
import type { Meal, MealItem, MealSlot, Plan } from '@/types';
import { MEAL_SLOT_LABELS, PLAN_TYPE_LABELS } from '@/types';

const WEEKDAYS = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
const STANDARD_SLOTS = ['breakfast', 'lunch', 'dinner'] as const;

function shortDate(d: string): string {
  const [, m, day] = d.split('-');
  return `${Number(m)}/${Number(day)}`;
}

function weekdayLabel(d: string): string {
  return WEEKDAYS[new Date(`${d}T00:00:00`).getDay()];
}

function dateRangeLabel(plan: Plan): string {
  if (plan.type === 'weekly' && plan.endDate) {
    return `${shortDate(plan.startDate)} - ${shortDate(plan.endDate)}`;
  }
  return shortDate(plan.startDate);
}

/** All dates the plan covers (weekly = the picked range, others = single day). */
function planDates(plan: Plan): string[] {
  if (plan.type !== 'weekly') return [plan.startDate];
  const dates: string[] = [];
  const end = plan.endDate ?? plan.startDate;
  const d = new Date(`${plan.startDate}T00:00:00`);
  const endD = new Date(`${end}T00:00:00`);
  while (d <= endD && dates.length < 31) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    dates.push(`${y}-${m}-${day}`);
    d.setDate(d.getDate() + 1);
  }
  return dates;
}

function slotLabel(slot: MealSlot): string {
  return MEAL_SLOT_LABELS[slot] ?? slot;
}

/** Where a new item goes: a day + a meal slot. */
interface AddTarget {
  date: string;
  slot: string;
}

type AddStep = 'choice' | 'recipe' | 'custom';

export function PlanDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { loading, getPlanById, setMeal, removeMeal, updatePlan, deletePlan } =
    usePlans();
  const { recipes } = useRecipes();
  const { members } = useMembers();

  // —— 添加内容流程（选择方式 → 菜谱/自定义）——
  const [addTarget, setAddTarget] = useState<AddTarget | null>(null);
  const [addStep, setAddStep] = useState<AddStep>('choice');
  const [recipeSearch, setRecipeSearch] = useState('');
  const [customItemName, setCustomItemName] = useState('');
  const [customItemNote, setCustomItemNote] = useState('');
  const [customItemError, setCustomItemError] = useState<string | null>(null);

  // —— 自定义餐次 ——
  const [customSlotDate, setCustomSlotDate] = useState<string | null>(null);
  const [customSlotName, setCustomSlotName] = useState('');
  const [customSlotError, setCustomSlotError] = useState<string | null>(null);

  // —— 删除确认 ——
  const [mealToDelete, setMealToDelete] = useState<Meal | null>(null);
  const [planDeleteOpen, setPlanDeleteOpen] = useState(false);
  // —— 编辑态：默认只读，编辑后才能添加/删除/删除整计划 ——
  const [editing, setEditing] = useState(false);

  const plan = getPlanById(id);

  // 注册页面显示名：被菜谱详情返回时按钮显示「← 计划名」
  usePageLabel(plan?.title);

  const dates = useMemo(() => (plan ? planDates(plan) : []), [plan]);

  const mealsByDate = useMemo(() => {
    const map = new Map<string, Meal[]>();
    if (!plan) return map;
    for (const meal of plan.meals) {
      const list = map.get(meal.date) ?? [];
      list.push(meal);
      map.set(meal.date, list);
    }
    return map;
  }, [plan]);

  const recipeById = useMemo(() => {
    const map = new Map<string, { id: string; name: string }>();
    for (const r of recipes) map.set(r.id, r);
    return map;
  }, [recipes]);

  const filteredRecipes = useMemo(() => {
    const q = recipeSearch.trim().toLowerCase();
    if (!q) return recipes;
    return recipes.filter((r) => r.name.toLowerCase().includes(q));
  }, [recipes, recipeSearch]);

  if (loading) {
    return (
      <div className="page-loading">
        <div className="spinner" />
      </div>
    );
  }

  if (!plan) {
    return (
      <div className="plan-detail-page">
        <EmptyState
          icon="📅"
          title="计划不存在"
          description="它可能已被删除"
          action={
            <Link to="/plan" className="btn btn-primary">
              返回计划列表
            </Link>
          }
        />
      </div>
    );
  }

  const closeAddFlow = () => {
    setAddTarget(null);
    setAddStep('choice');
    setRecipeSearch('');
    setCustomItemName('');
    setCustomItemNote('');
    setCustomItemError(null);
  };

  const openAdd = (date: string, slot: string) => {
    setAddTarget({ date, slot });
    setAddStep('choice');
  };

  /** Append an item to the meal at (date, slot); create the meal if absent. */
  const addItem = (target: AddTarget, item: MealItem) => {
    const existing = plan.meals.find(
      (m) => m.date === target.date && m.slot === target.slot
    );
    if (existing) {
      setMeal(plan.id, { ...existing, items: [...existing.items, item] });
    } else {
      setMeal(plan.id, {
        id: generateId(),
        date: target.date,
        slot: target.slot,
        memberIds: [], // empty = inherit plan-level members
        items: [item],
      });
    }
  };

  const handlePickRecipe = (recipeId: string) => {
    if (!addTarget) return;
    const recipe = recipeById.get(recipeId);
    if (!recipe) return;
    const item: MealItem = {
      id: generateId(),
      kind: 'recipe',
      recipeId,
      recipeName: recipe.name,
      servings: 1,
    };
    addItem(addTarget, item);
    closeAddFlow();
  };

  const handleAddCustomItem = () => {
    if (!addTarget) return;
    if (!customItemName.trim()) {
      setCustomItemError('请填写名称');
      return;
    }
    const item: MealItem = {
      id: generateId(),
      kind: 'custom',
      name: customItemName.trim(),
      note: customItemNote.trim() || undefined,
    };
    addItem(addTarget, item);
    closeAddFlow();
  };

  const handleRemoveItem = (meal: Meal, itemId: string) => {
    setMeal(plan.id, {
      ...meal,
      items: meal.items.filter((i) => i.id !== itemId),
    });
  };

  const handleDeletePlan = () => {
    deletePlan(plan.id);
    setPlanDeleteOpen(false);
    showToast('计划已删除');
    navigate('/plan');
  };

  const togglePlanMember = (memberId: string) => {
    const current = plan.memberIds ?? [];
    updatePlan(plan.id, {
      memberIds: current.includes(memberId)
        ? current.filter((m) => m !== memberId)
        : [...current, memberId],
    });
  };

  const handleCreateCustomSlot = () => {
    if (!customSlotDate) return;
    const name = customSlotName.trim();
    if (!name) {
      setCustomSlotError('请填写餐次名称');
      return;
    }
    setCustomSlotDate(null);
    setCustomSlotName('');
    setCustomSlotError(null);
    openAdd(customSlotDate, name);
  };

  /** Members shown on a meal: own override, else plan-level inheritance. */
  const mealMemberNames = (meal: Meal): string[] => {
    const ids =
      meal.memberIds.length > 0 ? meal.memberIds : (plan.memberIds ?? []);
    return ids
      .map((mid) => members.find((m) => m.id === mid)?.name ?? '?')
      .filter(Boolean);
  };

  const renderMealCard = (meal: Meal) => (
    <div className="plan-meal-card">
      {mealMemberNames(meal).length > 0 && (
        <div className="plan-meal-members-line">{mealMemberNames(meal).join('、')}</div>
      )}
      {meal.items.length > 0 && (
        <ul className="plan-meal-items">
          {meal.items.map((item) => (
            <li key={item.id} className="plan-meal-item">
              {item.kind === 'recipe' ? (
                <>
                  <Link
                    to={`/recipes/${item.recipeId}`}
                    className="plan-meal-item-name"
                  >
                    <span>
                      {recipeById.has(item.recipeId)
                        ? recipeById.get(item.recipeId)!.name
                        : item.recipeName}
                    </span>
                    <svg
                      className="plan-meal-item-book"
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
                      <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
                    </svg>
                  </Link>
                  {!recipeById.has(item.recipeId) && (
                    <span className="plan-meal-item-gone">菜谱已删除</span>
                  )}
                </>
              ) : (
                <span className="plan-meal-item-name">
                  {item.name}
                  {item.note && (
                    <span className="plan-meal-item-note">{item.note}</span>
                  )}
                </span>
              )}
              {editing && (
                <button
                  className="plan-meal-item-remove"
                  onClick={() => handleRemoveItem(meal, item.id)}
                  aria-label="移除"
                >
                  ×
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );

  const renderSlotHead = (
    slotKey: string,
    label: string,
    date: string,
    meal: Meal | undefined
  ) => (
    <div className="plan-slot-row-head">
      <span className="plan-slot-name">{label}</span>
      {editing && (
        <div className="plan-slot-actions">
          <button
            type="button"
            className="plan-slot-add"
            onClick={() => openAdd(date, slotKey)}
          >
            + 添加
          </button>
          {meal && (
            <button
              type="button"
              className="plan-slot-remove"
              onClick={() => setMealToDelete(meal)}
              aria-label="删除这一餐"
            >
              删除
            </button>
          )}
        </div>
      )}
    </div>
  );

  return (
    <div className="plan-detail-page">
      {/* Top bar */}
      <div className="detail-topbar">
        <BackButton fallback="/plan">←</BackButton>
        <span className="detail-topbar-title">计划</span>
        <div className="detail-topbar-actions">
          {editing && (
            <button
              className="btn detail-delete-btn"
              onClick={() => setPlanDeleteOpen(true)}
            >
              删除计划
            </button>
          )}
          <button
            className="btn btn-secondary"
            onClick={() => setEditing(!editing)}
          >
            {editing ? '完成' : '编辑'}
          </button>
        </div>
      </div>

      {/* Plan header */}
      <div className="plan-detail-header">
        <span className={`plan-type-chip plan-type-${plan.type}`}>
          {PLAN_TYPE_LABELS[plan.type]}
        </span>
        <h1 className="detail-name">{plan.title}</h1>
        <p className="plan-detail-dates">{dateRangeLabel(plan)}</p>
        {members.length > 0 && (
          <div className="plan-member-setting">
            <span className="plan-member-setting-label">成员</span>
            <div className="plan-member-chips">
              {members.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  className={`plan-member-chip ${(plan.memberIds ?? []).includes(m.id) ? 'active' : ''}`}
                  onClick={() => togglePlanMember(m.id)}
                >
                  {m.name}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Slots by date */}
      <div className="plan-days">
        {dates.map((date) => {
          const dayMeals = mealsByDate.get(date) ?? [];
          const todayLabel =
            date === new Date().toISOString().slice(0, 10) ? '今天' : null;
          const customMeals = dayMeals.filter(
            (m) => !STANDARD_SLOTS.includes(m.slot as (typeof STANDARD_SLOTS)[number])
          );
          return (
            <section key={date} className="plan-day">
              <div className="plan-day-head">
                <h2 className="plan-day-title">
                  {shortDate(date)} {weekdayLabel(date)}
                  {todayLabel && (
                    <span className="plan-day-today">{todayLabel}</span>
                  )}
                </h2>
              </div>

              <div className="plan-slot-rows">
                {STANDARD_SLOTS.map((slot) => {
                  const meal = dayMeals.find((m) => m.slot === slot);
                  return (
                    <div key={slot} className="plan-slot-row">
                      {renderSlotHead(slot, MEAL_SLOT_LABELS[slot], date, meal)}
                      {meal && renderMealCard(meal)}
                    </div>
                  );
                })}

                {customMeals.map((meal) => (
                  <div key={meal.id} className="plan-slot-row">
                    {renderSlotHead(meal.slot, slotLabel(meal.slot), date, meal)}
                    {renderMealCard(meal)}
                  </div>
                ))}

                {editing && (
                  <button
                    type="button"
                    className="plan-slot-more"
                    onClick={() => {
                      setCustomSlotDate(date);
                      setCustomSlotName('');
                      setCustomSlotError(null);
                    }}
                  >
                    + 自定义餐次
                  </button>
                )}
              </div>
            </section>
          );
        })}
      </div>

      {/* 添加内容流程 dialog（方式选择 → 菜谱/自定义） */}
      {addTarget && (
        <div className="overlay" onClick={closeAddFlow}>
          <div
            className="plan-create-dialog animate-scaleIn"
            onClick={(e) => e.stopPropagation()}
          >
            {addStep === 'choice' && (
              <>
                <h3 className="confirm-dialog-title">添加内容</h3>
                <p className="plan-add-context">
                  {shortDate(addTarget.date)} {weekdayLabel(addTarget.date)} ·{' '}
                  {slotLabel(addTarget.slot)}
                </p>
                <div className="plan-type-options">
                  <button
                    type="button"
                    className="plan-type-option"
                    onClick={() => setAddStep('recipe')}
                  >
                    <span className="plan-type-option-label">从菜谱添加</span>
                    <span className="plan-type-option-hint">
                      从现有菜谱中选择
                    </span>
                  </button>
                  <button
                    type="button"
                    className="plan-type-option"
                    onClick={() => setAddStep('custom')}
                  >
                    <span className="plan-type-option-label">自定义添加</span>
                    <span className="plan-type-option-hint">
                      饭团、外卖等任何食物
                    </span>
                  </button>
                </div>
              </>
            )}

            {addStep === 'recipe' && (
              <>
                <h3 className="confirm-dialog-title dialog-title-serif">
                  选择菜谱
                </h3>
                <div className="search-bar plan-recipe-search">
                  <svg
                    className="search-icon"
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                  >
                    <circle
                      cx="11"
                      cy="11"
                      r="7"
                      stroke="currentColor"
                      strokeWidth="2"
                    />
                    <path
                      d="M21 21l-4-4"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                  </svg>
                  <input
                    type="text"
                    placeholder="搜索菜谱"
                    value={recipeSearch}
                    onChange={(e) => setRecipeSearch(e.target.value)}
                    autoFocus
                  />
                </div>
                <div className="plan-recipe-list">
                  {filteredRecipes.length === 0 ? (
                    <p className="plan-day-empty">没有找到菜谱</p>
                  ) : (
                    filteredRecipes.map((r) => (
                      <button
                        key={r.id}
                        className="plan-recipe-row"
                        onClick={() => handlePickRecipe(r.id)}
                      >
                        {r.name}
                      </button>
                    ))
                  )}
                </div>
              </>
            )}

            {addStep === 'custom' && (
              <>
                <h3 className="confirm-dialog-title">添加自定义食物</h3>
                <div className="form-field">
                  <label className="form-label">名称</label>
                  <input
                    type="text"
                    className="input"
                    placeholder="例如：饭团、外卖"
                    value={customItemName}
                    onChange={(e) => setCustomItemName(e.target.value)}
                    autoFocus
                  />
                </div>
                <div className="form-field">
                  <label className="form-label">备注（可选）</label>
                  <input
                    type="text"
                    className="input"
                    value={customItemNote}
                    onChange={(e) => setCustomItemNote(e.target.value)}
                  />
                </div>
                {customItemError && (
                  <p className="form-error">{customItemError}</p>
                )}
                <div className="confirm-dialog-actions">
                  <button
                    className="btn btn-secondary"
                    onClick={() => setAddStep('choice')}
                  >
                    返回
                  </button>
                  <button
                    className="btn btn-primary"
                    onClick={handleAddCustomItem}
                  >
                    添加
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* 自定义餐次 dialog */}
      {customSlotDate && (
        <div className="overlay" onClick={() => setCustomSlotDate(null)}>
          <div
            className="plan-create-dialog animate-scaleIn"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="confirm-dialog-title">自定义餐次</h3>
            <p className="plan-add-context">
              {shortDate(customSlotDate)} {weekdayLabel(customSlotDate)}
            </p>
            <div className="form-field">
              <label className="form-label">餐次名称</label>
              <input
                type="text"
                className="input"
                placeholder="例如：下午茶、夜宵"
                value={customSlotName}
                onChange={(e) => setCustomSlotName(e.target.value)}
                autoFocus
              />
            </div>
            {customSlotError && <p className="form-error">{customSlotError}</p>}
            <div className="confirm-dialog-actions">
              <button
                className="btn btn-secondary"
                onClick={() => setCustomSlotDate(null)}
              >
                取消
              </button>
              <button
                className="btn btn-primary"
                onClick={handleCreateCustomSlot}
              >
                下一步
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={mealToDelete !== null}
        title="删除这一餐？"
        message={`将删除「${mealToDelete ? slotLabel(mealToDelete.slot) : ''}」及其全部内容`}
        confirmText="删除"
        danger
        onConfirm={() => {
          if (mealToDelete) removeMeal(plan.id, mealToDelete.id);
          setMealToDelete(null);
        }}
        onCancel={() => setMealToDelete(null)}
      />

      <ConfirmDialog
        open={planDeleteOpen}
        title="删除整个计划？"
        message={`「${plan.title}」及其所有餐次将被删除`}
        confirmText="删除"
        danger
        onConfirm={handleDeletePlan}
        onCancel={() => setPlanDeleteOpen(false)}
      />
    </div>
  );
}
