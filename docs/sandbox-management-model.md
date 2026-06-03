# FinSAFE sandbox management model

**中文：** [sandbox-management-model-zh.md](./sandbox-management-model-zh.md)

FinSAFE managed mode is easiest to manage as five concepts:

1. **Sandbox policy** — what one allowed agent or program may access.
2. **Bundle** — a signed, versioned policy set for a device cohort.
3. **Tag / fact** — trusted device metadata used to build cohorts.
4. **Group** — a named device cohort defined by deterministic rules.
5. **Assignment** — applies one bundle to one group with rollout controls.

## Sandbox policy

A sandbox policy defines what one agent or program may access when it runs: filesystem and network posture, resource limits, stdio behavior, audit requirements, and platform-specific enforcement. Administrators should think: "When Hermes runs, what resources may Hermes use?"

Field reference: [POLICY-QUICKREF.md](./POLICY-QUICKREF.md). On **Linux/macOS**, the compiler also merges **built-in deny-read and protected-path defaults** unless a policy opts out (`skip_default_deny_read`, `skip_default_protected_paths`) — bundle republish is not required for those defaults to apply after a binary upgrade. See [managed-mode.md — Policy defaults](./managed-mode.md#policy-defaults-fleet-administrators).

## Bundle

A bundle is not just one Hermes policy. A bundle is the signed policy set a matching device receives. Inside the bundle, FinSAFE selects exactly one sandbox policy for the requested program. If no policy matches, the run is denied. If multiple policies match, the bundle is considered ambiguous and fails closed.

Example bundle contents:

- Hermes standard policy
- Python no-network policy
- Shell diagnostic policy

Bundle authoring answers: "What policies are in this signed policy set?" Use the admin UI **Bundles** page or `finsafe-bundlectl bundle publish` to publish bundle content. Bundle publish does **not** decide which devices receive the bundle—that is the job of **Assignment**.

## Tags and facts

Use `admin:*` labels for security targeting, such as `admin:department=finance` or `admin:agent=hermes`. These labels are assigned by an administrator, MDM, or trusted inventory integration and are the preferred inputs for policy targeting.

Device-reported facts such as `device:os=macos`, `device:hostname`, or `device:agent_version` can help targeting when the authority treats them as verified. Apply tags on the **Devices** page or through your MDM integration.

`observed:*` facts (for example health state, last-seen status, or denial rate derived from telemetry) are for dashboards and investigation, **not** active assignment targeting. Dynamic telemetry must not move a device between security policies unexpectedly.

## Groups

Assignment groups use deterministic rules: all required predicates must match, optional direct exclusions may be added, and OR cases should be split into separate groups.

Example rule (readable summary):

```text
admin:department=finance AND admin:agent=hermes AND device:os=macos AND NOT admin:cohort=blocked
```

Rules stored as JSON use an `all` array where every child expression must match. Supported positive predicates for assignment targeting:

- `admin:*` tags (required form: `admin:name=value`)
- authority-verified `device:*` facts
- `device_id` (most specific targeting input)

Negative predicates may appear only as direct `not` children of the root `all`. Nested boolean expressions and `any` (OR) are not allowed in assignment-targetable groups—split OR cases into separate groups or assignments.

Define groups under **Settings → Device groups** in the admin UI.

## Assignments and rollout

An assignment connects a bundle to a group. Rollout belongs to the assignment, not the bundle. A bundle describes policy content; an assignment describes which devices receive that content and how it is rolled out.

Assignment rollout attributes include:

- **State** — draft, previewed, active, paused, or archived
- **Percent rollout** — optional; blank means 100%
- **Rollout seed** — stable seed combined with device id for deterministic percentage cohorts
- **Start and end time** — optional rollout window

A 10% rollout only matches devices in the stable rollout cohort; other devices fall back to a broader matching assignment or receive `no_assignment`.

**Recommended workflow:**

1. Classify devices with trusted `admin:*` tags.
2. Define assignment-targetable groups with deterministic rules.
3. Author and publish sandbox policies as a signed bundle.
4. Create an assignment linking the bundle to a group.
5. Preview affected devices, then activate the assignment.

Manage assignments on the **Assignments** page in the admin UI, or via `/v1/admin/assignments` and `/v1/admin/assignments/preview`.

When at least one active assignment exists, `/v1/bundles/current` resolves the effective bundle through assignment resolution rather than falling back to the latest published bundle.

## Conflict handling

If a device matches multiple active assignments, the most specific assignment wins. Specificity is determined by this ordered tuple:

1. exact `device_id` predicate count
2. required `admin:*` predicate count
3. required authority-verified `device:*` predicate count
4. other positive predicate count

Negative-only predicates do not increase specificity. If two assignments tie or cannot be compared, FinSAFE blocks activation or fails closed with `assignment_conflict`.

If no active assignment matches a device (including rollout exclusion), the authority returns `no_assignment` on `/v1/bundles/current`.

## Denial classes (target model)

| Class | Meaning |
|-------|---------|
| `no_assignment` | No active assignment matched the device. |
| `assignment_conflict` | Multiple active assignments matched with no deterministic winner. |
| `no_program_policy` | The effective bundle had no sandbox policy for the requested program. |
| `program_policy_conflict` | More than one sandbox policy in the effective bundle matched the requested program. |

Not every enforcement path emits all denial classes yet. Treat this table as the target administrator model.

## Related documents

- [admin-ui.md](./admin-ui.md) — Assignments page, group rules, and admin API
- [authority-deployment.md](./authority-deployment.md) — bundle publish and assignment APIs
- [managed-mode.md](./managed-mode.md) — agent, bundles, and desktop enforcement
