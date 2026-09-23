import { activityRingsWidget } from './activityrings/manifest';
import { airQualityWidget } from './airquality/manifest';
import { calendarWidget } from './calendar/manifest';
import { countdownWidget } from './countdown/manifest';
import { cryptoWidget } from './crypto/manifest';
import { habitTrackerWidget } from './habittracker/manifest';
import { leaderboardWidget } from './leaderboard/manifest';
import { notesWidget } from './notes/manifest';
import { nowPlayingWidget } from './nowplaying/manifest';
import { photoWidget } from './photo/manifest';
import { serverStatusWidget } from './serverstatus/manifest';
import { stocksWidget } from './stocks/manifest';
import { tasksWidget } from './tasks/manifest';
import { weatherWidget } from './weather/manifest';
import { worldClockWidget } from './worldclock/manifest';

export const widgets = [
  weatherWidget,
  stocksWidget,
  calendarWidget,
  worldClockWidget,
  tasksWidget,
  nowPlayingWidget,
  activityRingsWidget,
  serverStatusWidget,
  leaderboardWidget,
  notesWidget,
  cryptoWidget,
  habitTrackerWidget,
  countdownWidget,
  photoWidget,
  airQualityWidget,
];
