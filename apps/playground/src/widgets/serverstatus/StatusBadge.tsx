import { Badge } from '@mantine/core';
import type { ServiceStatus } from './manifest';

const COLOR: Record<ServiceStatus, string> = { operational: 'teal', degraded: 'yellow', down: 'red' };

export function StatusBadge({ status }: { readonly status: ServiceStatus }) {
  return (
    <Badge color={COLOR[status]} variant="light" size="xs">
      {status}
    </Badge>
  );
}
