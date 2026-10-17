import React from "react";
import styles from "./TabNavigation.module.css";

const TABS = [
  "Overview",
  "Notes",
  "Tasks",
  "Files",
  "Chat",
  "Group Settings",
];

export default function TabNavigation({ activeTab, setActiveTab }) {
  return (
    <nav className={styles.tabsNav} role="tablist" aria-label="Dashboard sections">
      {TABS.map((tab) => (
        <button
          key={tab}
          type="button"
          role="tab"
          aria-selected={activeTab === tab}
          className={`${styles.tabLink} ${
            activeTab === tab ? styles.activeTab : ""
          }`}
          onClick={() => setActiveTab(tab)}
        >
          {tab}
        </button>
      ))}
    </nav>
  );
}