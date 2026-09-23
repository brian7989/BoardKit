import { useCallback, useState } from 'react';
import { AnnouncementKey } from 'boardkit-core';

const AnnouncementMessages: Readonly<Record<AnnouncementKey, string>> = {
  [AnnouncementKey.PickedUp]: 'Picked up.',
  [AnnouncementKey.Moved]: 'Moved.',
  [AnnouncementKey.Dropped]: 'Dropped.',
  [AnnouncementKey.Cancelled]: 'Cancelled.',
  [AnnouncementKey.Rejected]: 'Cannot drop here.',
};

export interface UseAnnouncerResult {
  readonly message: string;
  readonly announce: (key: AnnouncementKey) => void;
}

export function useAnnouncer(): UseAnnouncerResult {
  const [message, setMessage] = useState('');
  const announce = useCallback((key: AnnouncementKey) => setMessage(AnnouncementMessages[key]), []);
  return { message, announce };
}
