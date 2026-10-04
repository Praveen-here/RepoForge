'use client';

import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import Spinner from '@/components/ui/Spinner';
import { api } from '@/lib/api';
import ActivityHeatmap from './ActivityHeatmap';
import BadgesCard from './BadgesCard';
import EditProfileDialog from './EditProfileDialog';
import ProfileSidebar from './ProfileSidebar';
import RecentSolved from './RecentSolved';
import ScoreCard from './ScoreCard';
import SolvedCard from './SolvedCard';
import styles from './Profile.module.css';

/** A user's profile, laid out like LeetCode's: sidebar on the left, stat cards on the right. */
export default function ProfilePage({ username }) {
  const router = useRouter();
  const { refresh } = useAuth();
  const [profile, setProfile] = useState(null);
  const [error, setError] = useState(null);
  const [editing, setEditing] = useState(false);

  const load = useCallback(() => {
    api
      .getProfile(username)
      .then(setProfile)
      .catch((err) => setError(err.status === 404 ? 'This user does not exist.' : err.message));
  }, [username]);

  useEffect(() => {
    load();
  }, [load]);

  const handleSaved = async (user) => {
    setEditing(false);
    await refresh();
    if (user.username !== username) router.replace(`/u/${user.username}`);
    else load();
  };

  if (error) return <p className={styles.message}>{error}</p>;
  if (!profile) {
    return (
      <div className={styles.message}>
        <Spinner size={22} color="var(--text-muted)" />
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <ProfileSidebar profile={profile} onEdit={() => setEditing(true)} />

      <div className={styles.main}>
        <ScoreCard stats={profile.stats} history={profile.scoreHistory} />
        <div className={styles.twoColumns}>
          <SolvedCard stats={profile.stats} />
          <BadgesCard badges={profile.badges} />
        </div>
        <ActivityHeatmap calendar={profile.calendar} />
        <RecentSolved items={profile.recentAccepted} />
      </div>

      {editing && <EditProfileDialog user={profile.user} onClose={() => setEditing(false)} onSaved={handleSaved} />}
    </div>
  );
}
