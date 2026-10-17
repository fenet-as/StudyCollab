import React, { useEffect, useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import { fetchGroupOverview } from '../../../../api/groupOverviewApi';

import StatsGrid from './components/StatsGrid/StatsGrid';
import UpcomingTasks from './components/UpcomingTasks/UpcomingTasks';
import RecentNotes from './components/RecentNotes/RecentNotes';
import RecentFiles from './components/RecentFiles/RecentFiles';
import MembersCard from './components/MembersCard/MembersCard';
import QuickActions from './components/QuickActions/QuickActions';

import styles from './GroupOverview.module.css';

export default function GroupOverview({ groupId, setActiveTab, onOpenModal }) {
  const [overview, setOverview] = useState(null);
  const [loading, setLoading] = useState(() => Boolean(groupId));
  const [error, setError] = useState(null);
  const [prevGroupId, setPrevGroupId] = useState(groupId);

  if (groupId !== prevGroupId) {
    setPrevGroupId(groupId);
    if (!groupId) {
      setLoading(false);
      setOverview(null);
      setError(null);
    } else {
      setLoading(true);
      setError(null);
    }
  }

  useEffect(() => {
    if (!groupId) {
      return;
    }

    let isMounted = true;

    fetchGroupOverview(groupId)
      .then((data) => {
        if (isMounted) {
          setOverview(data);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (isMounted) {
          setError(err.message || 'An error occurred while fetching group overview.');
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [groupId]);

  const handleTabChange = (tabName) => {
    if (setActiveTab) {
      setActiveTab(tabName);
    }
  };

  const handleGoToGroupSettings = () => {
    handleTabChange('Group Settings');
  };

  if (!groupId) {
    return (
      <div className={styles.overviewContainer}>
        <p className={styles.warningMessage}>
          <AlertTriangle size={20} />
          <span>No group selected. Please select a study group from the sidebar.</span>
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className={styles.overviewContainer}>
        <p className={styles.statusMessage}>Loading overview dashboard...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.overviewContainer}>
        <p className={styles.errorMessage}>
          Failed to load overview: {error}
        </p>
      </div>
    );
  }

  if (!overview) return null;

  const { stats, upcomingTasks, recentNotes, recentFiles, members, totalMembersCount } = overview;

  return (
    <div className={styles.overviewContainer}>
      <StatsGrid stats={stats} handleTabChange={handleTabChange} />

      <div className={styles.dashboardGrid}>
        <UpcomingTasks upcomingTasks={upcomingTasks} handleTabChange={handleTabChange} />
        <RecentNotes recentNotes={recentNotes} handleTabChange={handleTabChange} />
        <RecentFiles recentFiles={recentFiles} handleTabChange={handleTabChange} />
        <MembersCard 
          members={members} 
          totalMembersCount={totalMembersCount} 
          handleGoToGroupSettings={handleGoToGroupSettings} 
        />
        <QuickActions 
          onOpenModal={onOpenModal} 
          handleTabChange={handleTabChange} 
          handleGoToGroupSettings={handleGoToGroupSettings} 
        />
      </div>
    </div>
  );
}