interface TagSidebarProps {
  allTags: string[]
  activeTags: Set<string>
  onTagToggle: (tag: string, checked: boolean) => void
  onSelectAll: (select: boolean) => void
}

function TagSidebar({
  allTags,
  activeTags,
  onTagToggle,
  onSelectAll
}: TagSidebarProps): React.JSX.Element {
  const allSelected = allTags.length > 0 && allTags.every((t) => activeTags.has(t))
  const noneSelected = allTags.every((t) => !activeTags.has(t))

  return (
    <div className="tag-sidebar">
      <h2 className="sidebar-title">Tags</h2>

      <div className="tag-controls">
        <button
          className="btn-small"
          onClick={() => onSelectAll(true)}
          disabled={allSelected}
          title="Select all tags"
        >
          All
        </button>
        <button
          className="btn-small"
          onClick={() => onSelectAll(false)}
          disabled={noneSelected}
          title="Deselect all tags"
        >
          None
        </button>
      </div>

      {allTags.length === 0 ? (
        <p className="empty-state">No tags found</p>
      ) : (
        <ul className="tag-list">
          {allTags.map((tag) => (
            <li key={tag} className="tag-item">
              <label className="tag-label">
                <input
                  type="checkbox"
                  checked={activeTags.has(tag)}
                  onChange={(e) => onTagToggle(tag, e.target.checked)}
                  className="tag-checkbox"
                />
                <span className="tag-name">{tag}</span>
              </label>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export default TagSidebar
