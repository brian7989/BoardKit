import { Board, BoardProvider, describeRejection, type Rejection } from 'boardkit-react';
import { Box, Stack, Text } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { PageDots } from './board/PageDots';
import { boards } from './board/config';
import { AddWidgetMenu } from './header/AddWidgetMenu';
import { Header } from './header/Header';
import { TileHeader } from './tile/TileHeader';

function showRejection(rejection: Rejection) {
  notifications.show({ color: 'red', message: describeRejection(rejection) });
}

const emptyState = (
  <Stack align="center" gap="sm">
    <Text c="dimmed" size="sm">
      No widgets on this page yet.
    </Text>
    <AddWidgetMenu />
  </Stack>
);

export function App() {
  return (
    <Stack h="100dvh" gap="md" p="lg">
      <BoardProvider config={boards} storageKey="boardkit-playground" onReject={showRejection} tileHeader={TileHeader}>
        <Header />
        <Box className="tile-area">
          <Board emptyState={emptyState} />
          <PageDots />
        </Box>
      </BoardProvider>
    </Stack>
  );
}
