When completing a coding task in this project, run at minimum:
- npm run lint
- npm run test
- npm run build
If changes affect workers or sync flows, also run the relevant sync or worker command as appropriate. For security-sensitive changes, verify middleware coverage, route auth, and production headers in next.config.ts / middleware.ts.