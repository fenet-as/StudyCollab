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
    <nav className={styles.tabsNav}>
      {TABS.map((tab) => (
        <span
          key={tab}
          className={`${styles.tabLink} ${
            activeTab === tab ? styles.activeTab : ""
          }`}
          onClick={() => setActiveTab(tab)}
        >
          {tab}
        </span>
      ))}
    </nav>
  );
}