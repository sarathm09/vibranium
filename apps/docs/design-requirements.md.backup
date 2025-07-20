# Vibranium CLI: Comprehensive Design \& Architecture Document

*Modern scenario-driven API-and-UI testing with Vite + Nx + Ink*

This document consolidates every agreed requirement into a single, implementation-ready reference. It covers goals, monorepo layout, step syntax, extensibility, validation, tooling choices, and quality strategy.

## 1. Vision \& Goals

Vibranium CLI aims to deliver a *blazing-fast*, developer-centric test runner that:

1. Executes complex, shareable **scenarios** of API and (future) UI steps.
2. Uses **dot-notation variables** (`$.env`, `$.global`, `$.context`, etc.) for live data sharing.
3. Offers an **interactive terminal UI** (Ink) *and* a fully headless batch mode.
4. Runs inside a **Nx monorepo** with **Vite**-powered build \& dev workflow for sub-apps.
5. Is modular enough to add UI testing, performance plugins, or custom step types later.

## 2. Technology Stack

| Concern | Library / Tool | Rationale |
| :-- | :-- | :-- |
| Core runtime + HTTP | Node 18 +, TypeScript, Got | Mature, promise-friendly |
| Interactive CLI UI | Ink 3.x | React mental-model for TUI [^1][^2] |
| Build / Dev for UI packages | Vite 5.x | Instant HMR, tiny config [^3][^4] |
| Monorepo orchestration | Nx 18+ | Task graph, caching, generators [^5][^6] |
| Validation engine | AJV 8 (JSON), `libxmljs2` (XML) | High-performance schema checks |
| Test-data generation | `test-datasets` | Rich random data bank |
| Package publishing | `vibranium-cli` on npm | Single entry, alias `vm` |
| Repo host | `github.com/sarathm09/vibranium` | Open collaboration |

## 3. Monorepo Layout (Nx workspace)

```
vibranium/
├─ packages/
│  ├─ core/           # Execution engine
│  ├─ cli/            # Ink UI & headless runner
│  ├─ ui/             # Future web GUI (Vite + React)
│  ├─ types/          # Shared TS types
│  ├─ utils/          # Common helpers
│  └─ plugins/        # Optional step-type plugins
├─ apps/
│  ├─ examples/       # Example scenarios & envs
│  └─ docs/           # VitePress documentation site
├─ tools/             # Build, lint, release scripts
├─ nx.json, tsconfig.base.json
└─ package.json
```

Nx handles dependency graphing and cached builds; Vite powers any web-facing sub-app such as the future GUI.

## 4. Scenario Syntax (YAML / JSON)

```yaml
name: checkout_flow
description: "End-to-end checkout (API only)"
lifecycle:
  onStart: logger.info("run " + $.context.executionId)
  onEnd: logger.info("run finished")
dependsOn:
  - api: seed_user        # from same file
    as: user
  - api: seed_product
    as: product
steps:                     # formerly 'endpoints'
  - name: seed_user
    type: api
    method: POST
    url: "{{$.env.API_URL}}/users"
    body:
      email: "{{$.random.getRandomEmail}}"
      password: "{{$.random.getRandomString(12)}}"
    expect:
      - identifier: "$.response.status"
        operator: equals
        expected: 201

  - name: seed_product
    type: api
    method: POST
    url: "{{$.env.API_URL}}/products"
    body:
      title: "{{$.random.marvel.getRandomName}}"
      price: 99.0
    expect:
      - identifier: "$.response.body.price"
        operator: gt
        expected: 0

  - name: place_order
    type: api
    dependsOn:
      - api: seed_user
        as: buyer
      - api: seed_product
        as: item
    method: POST
    url: "{{$.env.API_URL}}/orders"
    headers:
      Authorization: "Bearer {{$.buyer.response.body.token}}"
    body:
      userId: "{{$.buyer.response.body.id}}"
      productId: "{{$.item.response.body.id}}"
    expect:
      - identifier: "$.response.status"
        operator: in
        expected: [200, 201]
      - identifier: "$.response.body"
        operator: schema
        expected: "./schemas/order-created.json"
```


### Key blocks

| Field | Purpose |
| :-- | :-- |
| `name/description` | Metadata |
| `lifecycle` | Hooks: `onStart`, `onEnd`, `beforeApi`, `afterApi`, `afterDependencies` |
| `dependsOn` | Array of objects: `{ api, as, from? }` |
| `steps` | Ordered array of typed steps |
| `type` | `api` (today), `ui`/others via plugins |
| `expect` | List of assertions (identifier+operator+expected) |

## 5. Dot-Notation Variable Map

| Namespace | Source | Example |
| :-- | :-- | :-- |
| `$.env` | Active env JSON | `{{$.env.API_URL}}` |
| `$.global` | `scenariorest.config.json` globals | `{{$.global.timeout}}` |
| `$.context` | Execution metadata (runId, env…) | `{{$.context.startedAt}}` |
| `$.request` | Request object of current step | `{{$.request.url}}` |
| `$.response` | Parsed response of current step | `{{$.response.body.id}}` |
| `$.api` | Definition of current step | `{{$.api.name}}` |
| `$.random` | Test-data generators | `{{$.random.lorem.generateLorem(50)}}` |
| `$.<alias>` | Output of dependency (by `as`) | `{{$.user.response.body.id}}` |

## 6. Validation System (`expect`)

### Operators

| Operator | Check |
| :-- | :-- |
| `equals` | strict equality |
| `contains` | substring/element membership |
| `regex` | JS RegExp test |
| `type` | `string`, `number`, `boolean`, `array`, `object` |
| `exists` | non-undefined |
| `in` | value in set |
| `gt` / `lt` | numeric comparison |
| `length` | length equals expected |
| `schema` | JSON Schema / XSD file |

*Header keys with spaces* use bracket JSONPath:
`identifier: "$.response.headers['X-Custom Header']"`

## 7. Content-Type Handling

| Content-Type | Parse engine | Identifier support |
| :-- | :-- | :-- |
| `application/json`, `text/json` | `JSON.parse` | JSONPath |
| `application/xml`, `text/xml`, `text/html` | `libxmljs2` | XPath   / CSS (opt) |
| `text/plain`, `text/*` | raw string | `$` for whole body |
| `multipart/form-data` (request) | FormData | N/A |
| Binary / stream responses | Buffer/Stream | Operators: `exists` `length` |

## 8. CLI UX \& Commands

| Mode | Command example |
| :-- | :-- |
| Interactive Ink UI | `vibranium` or `vm` |
| Run single scenario | `vm run scenarios/checkout.yaml --env staging` |
| Batch folder + report | `vm batch scenarios --env prod --report html` |

Ink UI panels:

1. **Sidebar** – folder → scenario → step tree.
2. **Details** – editable YAML/JSON, live variable preview.
3. **Status bar** – environment indicator, shortcuts (`Ctrl + E` switch env).

## 9. Build \& Dev Workflow

### Nx targets

| Target | Package | Executor |
| :-- | :-- | :-- |
| `build` | *every* | `@nx/js:tsc` (core), `vite:build` (ui) |
| `dev` | cli | `@nrwl/node:execute` with **ts-node** HMR |
| `lint`, `test` | all | ESLint, Jest |
| `e2e` | cli | Ink snapshot tests |

### Vite usage

* The future web UI (`packages/ui`) and docs site (`apps/docs`) are Vite projects for millisecond reloads.
* Vite’s plugin API enables shared TS path aliases from Nx.


## 10. Extensibility \& Plugin Interface

```ts
export interface VibraniumPlugin {
  name: string;
  stepTypes: string[];          // e.g. ['ui']
  execute(step: Step, ctx: ExecCtx): Promise<StepResult>;
  validate?(step: Step): Issue[];
  onInit?(): void;
  onDestroy?(): void;
}
```

*Core* registers `api` plugin; additional packages (`plugins/ui-testing`) can inject Playwright-backed `ui` type.

## 11. Quality \& Testing Strategy

| Layer | Tooling |
| :-- | :-- |
| Unit | Jest + ts-jest (core logic) |
| Validator tests | JSON-Schema cases, AJV test vectors |
| CLI snapshots | `ink-testing-library` to assert rendering |
| E2E scenarios | Self-hosting API mock (MSW) + `vibranium batch` |
| Lint/format | ESLint (Nx preset), Prettier |
| Type safety | `tsc --noEmit`, NX affected graph gating |
| CI pipeline | GitHub Actions matrix (Node 18/20, Linux/Win/Mac) |

## 12. Sample Environment \& Secrets

`environments/staging.json`

```json
{
  "environment": "staging",
  "variables": {
    "API_URL": "https://staging.api.example.com",
    "TIMEOUT": 10000
  },
  "secrets": {
    "USERNAME": "$.env.STG_USER",
    "PASSWORD": "$.env.STG_PASS"
  }
}
```

`secrets.env` (git-ignored)

```
STG_USER=staging_user
STG_PASS=s3cr3t!
```


## 13. Example UI-Ready Scenario Skeleton (Future)

```yaml
steps:
  - name: visit_home
    type: ui
    action: goto
    url: "https://shop.test"
  - name: click_login
    type: ui
    action: click
    selector: "#login-btn"
    wait:
      type: visible
      timeout: 5000
  - name: login_api               # mixing step types!
    type: api
    method: POST
    url: "{{$.env.API_URL}}/auth"
    body: ...
```

Because each step declares its `type`, the core orchestrator delegates to the correct plugin.

## 14. Roadmap

| Phase | Milestone |
| :-- | :-- |
| 1 | Core API runner, dot-notation variables, Ink UI |
| 2 | Validation system (`expect`), schema support |
| 3 | VitePress docs, example repo, CI pipeline |
| 4 | Plugin interface, UI-testing alpha plugin |
| 5 | Advanced reporting \& performance plugin |

## 15. Conclusion

With Nx’s monorepo power, Vite’s lightning-fast builds, and Ink’s rich TUI, **Vibranium CLI** positions itself as a modern, extensible testing platform. The unified step syntax, powerful variable system, and generic validation blocks make it trivial to script everything from simple smoke tests to intricate cross-system flows, while the architecture is ready for UI automation, performance add-ons, and community plugins.

Development teams can adopt Vibranium incrementally—writing YAML scenarios today and expanding capabilities tomorrow—using one consistent toolchain that stays *fast*, *typed*, and *future-proof*.

<div style="text-align: center">⁂</div>

[^1]: https://github.com/vadimdemedes/ink

[^2]: https://blog.logrocket.com/using-ink-ui-react-build-interactive-custom-clis/

[^3]: https://v3.vitejs.dev/guide/

[^4]: https://vite.dev

[^5]: https://dev.to/hasancse/setting-up-an-nx-monorepo-a-step-by-step-guide-9k4

[^6]: https://nx.dev

[^7]: https://radixweb.com/introduction-of-vite-js

[^8]: https://earthly.dev/blog/nx-monorepos-guide/

[^9]: https://en.wikipedia.org/wiki/Vite_(software)

[^10]: https://cekrem.github.io/posts/do-more-stuff-cli-tool-part-1/

[^11]: https://dev.to/teyim/vite-js-the-lightweight-and-lightning-fast-build-tool-for-your-next-web-project-541i

[^12]: https://www.youtube.com/watch?v=R-96P5rBhUE

[^13]: https://www.freecodecamp.org/news/react-js-ink-cli-tutorial/

[^14]: https://www.youtube.com/watch?v=pY10RVeAnbc

[^15]: https://github.com/vadimdemedes/ink-ui

[^16]: https://github.com/vitejs/vite

[^17]: https://github.com/nrwl/nx

[^18]: https://news.ycombinator.com/item?id=35863837

[^19]: https://www.youtube.com/watch?v=mIn2y9jvnwA

[^20]: https://spin.atomicobject.com/terminal-wordle-react-ink/

