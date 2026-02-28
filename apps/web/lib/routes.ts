const basePath =
  process.env.NEXT_PUBLIC_WORKOUTS_BASE_PATH?.replace(/\/+$/, '') ?? '';

const PREFIX_IN_HUB = ['/explore', '/progress', '/recordings', '/exercise', '/workout'];

export function workoutsPath(path: string): string {
  const normalized = path.startsWith('/') ? path : `/${path}`;
  if (!basePath) {
    return normalized;
  }

  if (normalized === basePath || normalized.startsWith(`${basePath}/`)) {
    return normalized;
  }

  if (normalized === '/workouts' || normalized.startsWith('/workouts/')) {
    return normalized;
  }

  for (const prefix of PREFIX_IN_HUB) {
    if (normalized === prefix || normalized.startsWith(`${prefix}/`)) {
      return `${basePath}${normalized}`;
    }
  }

  return normalized;
}
