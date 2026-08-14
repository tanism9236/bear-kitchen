import { useEffect, useState } from 'react';
import { TAG_DIMENSION_COLORS } from '@/data/tags';
import {
  LIBRARY_CHANGED_EVENT,
  loadTagGroups,
  loadCustomTags,
  addDimensionTag,
  renameDimensionTag,
  deleteDimensionTag,
  addCustomTag,
  renameCustomTag,
  deleteCustomTag,
} from '@/utils/storage';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import type { TagDimension, TagGroup, Tag } from '@/types';

interface TagSelectorProps {
  selectedTags: string[];
  onChange: (tags: string[]) => void;
}

interface PendingDelete {
  kind: 'dimension' | 'custom';
  dimension?: TagDimension;
  name: string;
  id: string;
}

export function TagSelector({ selectedTags, onChange }: TagSelectorProps) {
  const [tagGroups, setTagGroups] = useState<TagGroup[]>(loadTagGroups);
  const [customTags, setCustomTags] = useState<Tag[]>(loadCustomTags);
  const [adding, setAdding] = useState<string | null>(null); // group key: dimension | 'custom'
  const [addValue, setAddValue] = useState('');
  const [managing, setManaging] = useState<string | null>(null);
  const [renaming, setRenaming] = useState<string | null>(null); // tag id
  const [renameValue, setRenameValue] = useState('');
  const [pendingDelete, setPendingDelete] = useState<PendingDelete | null>(
    null
  );

  const refresh = () => {
    setTagGroups(loadTagGroups());
    setCustomTags(loadCustomTags());
  };

  useEffect(() => {
    window.addEventListener(LIBRARY_CHANGED_EVENT, refresh);
    return () => window.removeEventListener(LIBRARY_CHANGED_EVENT, refresh);
  }, []);

  const toggle = (tagId: string) => {
    if (selectedTags.includes(tagId)) {
      onChange(selectedTags.filter((t) => t !== tagId));
    } else {
      onChange([...selectedTags, tagId]);
    }
  };

  // ===== Add =====

  const startAdd = (key: string) => {
    setAdding(key);
    setAddValue('');
  };

  const confirmAdd = () => {
    if (!adding) return;
    const name = addValue.trim();
    if (!name) return;
    if (adding === 'custom') {
      const tag = addCustomTag(name);
      if (tag && !selectedTags.includes(tag.id)) {
        onChange([...selectedTags, tag.id]);
      }
    } else {
      const id = addDimensionTag(adding as TagDimension, name);
      if (id && !selectedTags.includes(id)) {
        onChange([...selectedTags, id]);
      }
    }
    refresh();
    setAddValue('');
    // keep input open for quick consecutive adds; blur/取消 closes
  };

  const labelStyle = undefined;

  // ===== Rename =====

  const startRename = (id: string, name: string) => {
    setRenaming(id);
    setRenameValue(name);
  };

  const confirmRename = () => {
    if (!renaming) return;
    const newName = renameValue.trim();
    if (!newName) return;

    if (pendingIsCustom(renaming)) {
      renameCustomTag(renaming, newName);
    } else {
      const [dimension, ...rest] = renaming.split(':');
      const oldName = rest.join(':');
      const newId = renameDimensionTag(
        dimension as TagDimension,
        oldName,
        newName
      );
      if (!newId) {
        // rename failed (name collision or missing) — bail out
        setRenaming(null);
        refresh();
        return;
      }
      if (selectedTags.includes(renaming)) {
        // keep the renamed tag selected
        onChange(selectedTags.map((t) => (t === renaming ? newId : t)));
      }
    }
    refresh();
    setRenaming(null);
  };

  const pendingIsCustom = (id: string) => !id.includes(':');

  // ===== Delete =====

  const requestDelete = (tag: PendingDelete) => setPendingDelete(tag);

  const doDelete = () => {
    if (!pendingDelete) return;
    const { kind, dimension, name, id } = pendingDelete;
    if (kind === 'custom') {
      deleteCustomTag(id);
    } else if (dimension) {
      deleteDimensionTag(dimension, name);
    }
    onChange(selectedTags.filter((t) => t !== id));
    refresh();
    setPendingDelete(null);
  };

  // ===== Chip rendering =====

  const renderChips = (
    groupKey: string,
    entries: { id: string; name: string; dimension: TagDimension }[]
  ) => {
    const isGroupManaging = managing === groupKey;
    return entries.map(({ id, name, dimension }) => {
      const color = TAG_DIMENSION_COLORS[dimension];
      const isSelected = selectedTags.includes(id);

      if (renaming === id) {
        return (
          <span className="tag-edit-chip" key={id}>
            <input
              className="tag-edit-input"
              value={renameValue}
              onChange={(e) => setRenameValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  confirmRename();
                }
                if (e.key === 'Escape') setRenaming(null);
              }}
              autoFocus
            />
            <button
              type="button"
              className="tag-edit-confirm"
              onClick={confirmRename}
              aria-label="确认改名"
            >
              ✓
            </button>
          </span>
        );
      }

      return (
        <span className={`tag-toggle-wrap ${isGroupManaging ? 'managing' : ''}`} key={id}>
          <button
            type="button"
            className={`tag-toggle ${isSelected ? 'active' : ''}`}
            style={
              isSelected
                ? {
                    backgroundColor: color.text,
                    borderColor: color.text,
                    color: '#fff',
                  }
                : { backgroundColor: color.bg, color: color.text }
            }
            onClick={() => (isGroupManaging ? startRename(id, name) : toggle(id))}
          >
            {name}
          </button>
          {isGroupManaging && (
            <button
              type="button"
              className="tag-toggle-delete"
              aria-label={`删除标签 ${name}`}
              onClick={() =>
                requestDelete(
                  dimension === 'custom'
                    ? { kind: 'custom', name, id }
                    : { kind: 'dimension', dimension, name, id }
                )
              }
            >
              ×
            </button>
          )}
        </span>
      );
    });
  };

  const renderGroup = (
    key: string,
    label: string,
    entries: { id: string; name: string; dimension: TagDimension }[]
  ) => {
    const isManaging = managing === key;
    return (
      <div className="tag-selector-group" key={key}>
        <div className="tag-selector-group-header">
          <span className="tag-selector-group-label" style={labelStyle}>
            {label}
          </span>
          <div className="tag-selector-group-actions">
            <button
              type="button"
              className="tag-group-action"
              onClick={() => (adding === key ? setAdding(null) : startAdd(key))}
            >
              {adding === key ? '收起' : '＋ 添加'}
            </button>
            <button
              type="button"
              className={`tag-group-action ${isManaging ? 'active' : ''}`}
              onClick={() => {
                setManaging(isManaging ? null : key);
                setRenaming(null);
              }}
            >
              {isManaging ? '完成' : '管理'}
            </button>
          </div>
        </div>

        {adding === key && (
          <div className="tag-add-row">
            <input
              type="text"
              className="input"
              placeholder={`输入${label}标签名称`}
              value={addValue}
              onChange={(e) => setAddValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  confirmAdd();
                }
                if (e.key === 'Escape') setAdding(null);
              }}
              autoFocus
            />
            <button type="button" className="btn btn-sm btn-primary" onClick={confirmAdd}>
              添加
            </button>
          </div>
        )}

        {entries.length > 0 ? (
          <div className="tag-selector-chips">{renderChips(key, entries)}</div>
        ) : (
          <p className="tag-group-empty">
            还没有标签，点击「＋ 添加」创建一个
          </p>
        )}
      </div>
    );
  };

  return (
    <div className="tag-selector">
      {tagGroups.map((group) =>
        renderGroup(
          group.dimension,
          group.label,
          group.tags.map((name) => ({
            id: `${group.dimension}:${name}`,
            name,
            dimension: group.dimension,
          }))
        )
      )}

      {renderGroup(
        'custom',
        '自定义',
        customTags.map((t) => ({
          id: t.id,
          name: t.name,
          dimension: 'custom' as TagDimension,
        }))
      )}

      <ConfirmDialog
        open={pendingDelete !== null}
        title={`删除标签「${pendingDelete?.name ?? ''}」？`}
        message="使用该标签的菜谱也会同时移除这个标签，且无法恢复。"
        confirmText="删除"
        danger
        onConfirm={doDelete}
        onCancel={() => setPendingDelete(null)}
      />
    </div>
  );
}
