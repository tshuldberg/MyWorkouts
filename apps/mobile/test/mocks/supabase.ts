import { vi } from 'vitest';

type SupabaseResult<T = unknown> = {
  data: T;
  error: { message: string } | null;
  count?: number | null;
};

type TerminalKind = 'then' | 'single' | 'maybeSingle';

interface QueryQueues {
  then: SupabaseResult[];
  single: SupabaseResult[];
  maybeSingle: SupabaseResult[];
}

interface AuthUser {
  id: string;
  email?: string;
  user_metadata?: Record<string, unknown>;
}

interface QueryCall {
  table: string;
  method: string;
  args: unknown[];
}

export interface SupabaseMockController {
  client: any;
  auth: {
    getUser: ReturnType<typeof vi.fn>;
    getSession: ReturnType<typeof vi.fn>;
    signInWithPassword: ReturnType<typeof vi.fn>;
    signInWithOAuth: ReturnType<typeof vi.fn>;
    signUp: ReturnType<typeof vi.fn>;
    signOut: ReturnType<typeof vi.fn>;
    resetPasswordForEmail: ReturnType<typeof vi.fn>;
    exchangeCodeForSession: ReturnType<typeof vi.fn>;
  };
  storage: {
    upload: ReturnType<typeof vi.fn>;
    getPublicUrl: ReturnType<typeof vi.fn>;
    createSignedUrl: ReturnType<typeof vi.fn>;
    remove: ReturnType<typeof vi.fn>;
    list: ReturnType<typeof vi.fn>;
  };
  calls: {
    fromTables: string[];
    queryOps: QueryCall[];
  };
  queue: (table: string, kind: TerminalKind, result: SupabaseResult) => void;
  setAuthUser: (user: AuthUser | null) => void;
  reset: () => void;
}

const EMPTY_ARRAY_RESULT: SupabaseResult<unknown[]> = {
  data: [],
  error: null,
  count: null,
};

const EMPTY_SINGLE_RESULT: SupabaseResult<null> = {
  data: null,
  error: null,
};

function createQueues(): Record<string, QueryQueues> {
  return {};
}

function getTableQueues(
  queues: Record<string, QueryQueues>,
  table: string,
): QueryQueues {
  if (!queues[table]) {
    queues[table] = {
      then: [],
      single: [],
      maybeSingle: [],
    };
  }
  return queues[table];
}

export function createSupabaseMock(initialUser: AuthUser | null = null): SupabaseMockController {
  let currentUser: AuthUser | null = initialUser;
  const queues = createQueues();
  const calls: SupabaseMockController['calls'] = {
    fromTables: [],
    queryOps: [],
  };

  const dequeue = (table: string, kind: TerminalKind, fallback: SupabaseResult): SupabaseResult => {
    const tableQueues = getTableQueues(queues, table);
    const next = tableQueues[kind].shift();
    return next ?? fallback;
  };

  const record = (table: string, method: string, args: unknown[]) => {
    calls.queryOps.push({ table, method, args });
  };

  const createQueryBuilder = (table: string) => {
    const builder: Record<string, any> = {};

    const chainMethods = [
      'select',
      'insert',
      'update',
      'upsert',
      'delete',
      'eq',
      'neq',
      'gt',
      'gte',
      'lt',
      'lte',
      'like',
      'ilike',
      'in',
      'order',
      'limit',
      'range',
    ] as const;

    for (const method of chainMethods) {
      builder[method] = (...args: unknown[]) => {
        record(table, method, args);
        return builder;
      };
    }

    builder.single = async () => {
      record(table, 'single', []);
      return dequeue(table, 'single', dequeue(table, 'then', EMPTY_SINGLE_RESULT));
    };

    builder.maybeSingle = async () => {
      record(table, 'maybeSingle', []);
      return dequeue(
        table,
        'maybeSingle',
        dequeue(table, 'single', dequeue(table, 'then', EMPTY_SINGLE_RESULT)),
      );
    };

    builder.then = (
      onFulfilled?: (value: SupabaseResult) => unknown,
      onRejected?: (reason: unknown) => unknown,
    ) => {
      record(table, 'then', []);
      const value = dequeue(table, 'then', EMPTY_ARRAY_RESULT);
      return Promise.resolve(value).then(onFulfilled, onRejected);
    };

    return builder;
  };

  const auth = {
    getUser: vi.fn(async () => ({ data: { user: currentUser }, error: null })),
    getSession: vi.fn(async () => ({ data: { session: null }, error: null })),
    signInWithPassword: vi.fn(async () => ({ data: null, error: null })),
    signInWithOAuth: vi.fn(async () => ({ data: null, error: null })),
    signUp: vi.fn(async () => ({ data: null, error: null })),
    signOut: vi.fn(async () => ({ error: null })),
    resetPasswordForEmail: vi.fn(async () => ({ data: null, error: null })),
    exchangeCodeForSession: vi.fn(async () => ({ data: null, error: null })),
  };

  const storage = {
    upload: vi.fn(async () => ({ data: null, error: null })),
    getPublicUrl: vi.fn((path: string) => ({ data: { publicUrl: `https://example.test/${path}` } })),
    createSignedUrl: vi.fn(async (path: string) => ({ data: { signedUrl: `https://signed.example.test/${path}` }, error: null })),
    remove: vi.fn(async () => ({ data: null, error: null })),
    list: vi.fn(async () => ({ data: [], error: null })),
  };

  const client = {
    auth,
    from: vi.fn((table: string) => {
      calls.fromTables.push(table);
      return createQueryBuilder(table);
    }),
    storage: {
      from: vi.fn(() => ({
        upload: storage.upload,
        getPublicUrl: storage.getPublicUrl,
        createSignedUrl: storage.createSignedUrl,
        remove: storage.remove,
        list: storage.list,
      })),
    },
    channel: vi.fn(() => ({
      on: vi.fn(() => ({ subscribe: vi.fn() })),
      subscribe: vi.fn(),
      unsubscribe: vi.fn(),
    })),
  };

  return {
    client,
    auth,
    storage,
    calls,
    queue(table, kind, result) {
      getTableQueues(queues, table)[kind].push(result);
    },
    setAuthUser(user) {
      currentUser = user;
    },
    reset() {
      for (const key of Object.keys(queues)) {
        delete queues[key];
      }
      calls.fromTables = [];
      calls.queryOps = [];
      currentUser = initialUser;

      auth.getUser.mockClear();
      auth.getSession.mockClear();
      auth.signInWithPassword.mockClear();
      auth.signInWithOAuth.mockClear();
      auth.signUp.mockClear();
      auth.signOut.mockClear();
      auth.resetPasswordForEmail.mockClear();
      auth.exchangeCodeForSession.mockClear();

      storage.upload.mockClear();
      storage.getPublicUrl.mockClear();
      storage.createSignedUrl.mockClear();
      storage.remove.mockClear();
      storage.list.mockClear();

      client.from.mockClear();
      client.storage.from.mockClear();
      client.channel.mockClear();
    },
  };
}

let activeSupabaseMock = createSupabaseMock();

export function getActiveSupabaseMock() {
  return activeSupabaseMock;
}

export function setActiveSupabaseMock(mock: SupabaseMockController) {
  activeSupabaseMock = mock;
}

export function resetActiveSupabaseMock() {
  activeSupabaseMock = createSupabaseMock();
  return activeSupabaseMock;
}
