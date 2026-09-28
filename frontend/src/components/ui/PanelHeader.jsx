import Icon from './Icon';
import styles from './PanelHeader.module.css';

/**
 * The header bar on top of every panel card.
 * tabs: [{ id, label, icon, iconColor, badge }]
 * With one tab it is a title; with several it switches views. `children` go on the right.
 */
export default function PanelHeader({ tabs, activeTab, onTabChange, children }) {
  return (
    <div className={styles.header}>
      <div className={styles.tabs} role="tablist">
        {tabs.map((tab, index) => {
          const isActive = tabs.length === 1 || tab.id === activeTab;
          return (
            <div key={tab.id} className={styles.tabWrap}>
              {index > 0 && <span className={styles.separator} />}
              <button
                type="button"
                role="tab"
                aria-selected={isActive}
                className={`${styles.tab} ${isActive ? styles.active : ''}`}
                onClick={() => onTabChange?.(tab.id)}
              >
                <Icon name={tab.icon} size={16} strokeWidth={2} style={{ color: tab.iconColor }} />
                {tab.label}
                {tab.badge}
              </button>
            </div>
          );
        })}
      </div>
      {children && <div className={styles.actions}>{children}</div>}
    </div>
  );
}
