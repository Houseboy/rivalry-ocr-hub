// Local declaration to satisfy TypeScript when `react/jsx-runtime` types are missing.
// This is a small shim so the compiler won't error about missing module paths.

declare module 'react/jsx-runtime' {
  import * as React from 'react';
  export = React;
}

declare module 'react/jsx-dev-runtime' {
  import * as React from 'react';
  export = React;
}
