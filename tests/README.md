# Private end-to-end tests

The optional `e2e` submodule is maintained in the private
`yang991178/fluent-reader-tests` repository. Normal installs, builds, and release
workflows do not need it. Recursive clones require access to that repository.

From the application repository root:

```sh
git submodule update --init tests/e2e
npm install
npm run build
npm --prefix tests/e2e ci
npm --prefix tests/e2e test
```

See `tests/e2e/README.md` for the harness architecture and diagnostics. Commit
and push test changes in the private repository before publishing an updated
submodule pointer here. Never add test sources or reports directly to this
public repository.
