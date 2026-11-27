# Common questions

## AI safety

### 1. What is the difference between AI safety, AI security and Agent safety?

Usage varies by context. Here, AI safety concerns harm to people and the environment, including incorrect decisions, harmful outputs and misuse. AI security concerns attacks on models, data and applications, and their defenses. Agent safety focuses on authorized execution, limiting harm and oversight once a system can use tools and act. These concerns overlap: prompt injection is an attack that can also cause unsafe actions.

A sandbox primarily provides execution isolation and permission enforcement. It cannot alone solve factual errors, fairness or model alignment. See [NIST's generative AI risk overview](https://nvlpubs.nist.gov/nistpubs/ai/NIST.AI.600-1.pdf) and [OWASP's Agent risk categories](https://genai.owasp.org/top-10-for-agentic-applications-2026/).

### 2. Does a smarter, more capable model necessarily mean a safer model?

No. A stronger model may understand tasks more accurately, but it may also be better at using tools, writing programs and completing long sequences of actions. Under the same permissions, those abilities can improve productivity or increase the consequences of mistakes and misuse. Capability scores and safety need separate assessment.

Establish what the model can do, which resources it can access and what happens if protections fail. Reassess after upgrades rather than treating an earlier evaluation as a guarantee for a new version. See [OpenAI's discussion of capability risks and safeguards](https://openai.com/index/updating-our-preparedness-framework/).

### 3. Why is runtime protection needed if the model has undergone safety training?

Safety training influences which actions a model chooses; runtime protection constrains which resources those actions can reach. Training cannot anticipate every external document, tool implementation or deployment configuration. Access restrictions should still apply when a model misjudges a request or produces faulty code.

For example, instructing an Agent not to modify a private directory and denying its execution process permission to modify that directory are different controls. Combine training, tool authorization, file and network isolation, and outcome verification rather than treating one layer as a complete guarantee. See [Anthropic's OS-level sandbox design](https://www.anthropic.com/research/claude-code-sandboxing).

### 4. How do prompt injection, jailbreaking and ordinary task misunderstanding differ?

Prompt injection introduces instructions that steer a model away from the application's intended behavior. They can arrive directly or through webpages, email and tool results. Jailbreaking specifically targets the model's safety restrictions; the concepts can overlap. Ordinary misunderstanding may involve no attacker: an Agent asked to remove temporary files might mistakenly delete material that should remain.

Distinguishing causes helps improve defenses, but harm does not depend on an attacker being present. In all three cases, examine tools, permissions and actual outcomes. See [OWASP's explanation of injection and jailbreaking](https://genai.owasp.org/llm2026/llm012026-prompt-injection/).

### 5. Can prompt injection be completely prevented? If not, how should its consequences be limited?

Do not promise detection and prevention for every input. Training and detection can reduce risk, but systems should also account for successful manipulation: minimize readable data, tool permissions and network destinations, isolate untrusted execution, and independently check high-impact actions.

For example, an Agent reading public webpages does not also need cloud administrator keys. Examine APIs and business tools outside the sandbox too: sandboxing does not automatically prevent an authorized account from performing the wrong operation on an allowed service. See [OpenAI's layered defenses](https://openai.com/safety/prompt-injections/) and [OWASP's mitigation guidance](https://cheatsheetseries.owasp.org/cheatsheets/LLM_Prompt_Injection_Prevention_Cheat_Sheet.html).

### 6. Who should judge AI safety: model providers, application developers, users or independent evaluators?

Responsibilities need to be shared. Providers evaluate model capabilities and known risks; application developers verify tools, authorization and data flows; deployers establish intended use and acceptable risk; users express task intent and review important outcomes. Independent assessments add evidence, but their conclusions remain limited by test scope.

Evaluation should continue throughout the lifecycle, recording versions, environments, methods and residual risks. Where possible, separate development from verification. Passing one evaluation does not establish safety for every business workflow or automatically constitute certification. See [NIST AI RMF's roles and evaluation responsibilities](https://nvlpubs.nist.gov/nistpubs/ai/NIST.AI.100-1.pdf).

## Agent safety

### 7. Why do the security risks change when a conversational model gains tools?

Answers begin to have external effects. Bad advice previously needed a person to act on it; with files, a terminal, email or business APIs, a model can modify data, send messages, run programs and spend money directly. A legitimate tool can cause harm through a wrong target, argument or sequence without exceeding its permissions.

Evaluate both model decisions and tool capabilities. Grant reading, writing, deletion and sending separately according to the task. These limits also matter for an Agent that simply misunderstands a request. See [OWASP on tool misuse](https://genai.owasp.org/agentic-applications-2026/asi02-tool-misuse-and-exploitation/).

### 8. Does authorizing a task authorize every operation that might help complete it?

No. The task describes a goal; permissions should define accessible resources and allowed operations. “Summarize invoices” does not automatically authorize deletion, access to other customers' records or sending email. The Agent finding an operation useful does not supply authorization.

Translate requirements into controls such as read-only access to a directory, limited query targets and an execution window. Additional access should go through an authorized person or policy process. This follows [least privilege](https://csrc.nist.gov/glossary/term/least_privilege): permissions necessary for assigned duties should not expand into everything the user can do.

### 9. Should an Agent inherit all user permissions or have a separate, restricted execution identity?

A distinct, restricted identity with task- or session-scoped permissions is generally preferable. Otherwise, a process that only needs to organize files may also gain unrelated file access, login tokens or administrative powers, increasing the potential damage.

Control local and remote identities separately: restricting a local process does not narrow an API key it holds. Limit credentials at the service by resource, operation and lifetime, and record who acts for whom. See [OWASP on identity and privilege abuse](https://genai.owasp.org/agentic-applications-2026/asi03-identity-and-privilege-abuse/).

### 10. Can malicious instructions in web pages, email or repositories make an Agent work for an attacker?

Yes. External content should be task data, but attackers can embed instructions that redirect the Agent, expose information or trigger tools. This indirect prompt injection does not require access to the user's account: influencing content the Agent will read can create an entry point.

Preserve content provenance and trust levels, restrict powerful tools in workflows reading untrusted material, and enforce resource and outbound-access limits. Filtering, model training and approvals can complement those controls, but do not establish that every injection will be detected. See [OpenAI's prompt-injection explanation](https://openai.com/safety/prompt-injections/).

### 11. Does asking for confirmation on every operation protect users? Which boundaries cannot be removed by one approval?

Confirmation helps when the user can understand the target, scope and consequences. A command name or an Agent-generated justification may not provide enough information, while repetitive prompts encourage habitual approval.

Bind approval to a specific operation with a verifiable preview. Restrictions such as an organization's prohibition on exporting particular data or accessing protected credentials should remain subject to their authorization and management rules. A routine “continue” must not be interpreted as authority to remove them. See [OWASP on human–Agent trust exploitation](https://genai.owasp.org/agentic-applications-2026/asi09-human-agent-trust-exploitation/).

### 12. Do restrictions remain effective when an Agent switches tools, writes scripts or launches subprocesses?

That depends on where controls are enforced and what they cover. A path check in one file tool may not cover terminal access. Operating-system controls can constrain protected processes and subprocesses, provided they actually run within that boundary.

Remote MCP servers, browser services and externally executed tools need their own access controls. Map real execution paths and test the same resources through file tools, scripts and subprocesses, rather than checking one invocation. See [Anthropic's description of command, script and subprocess isolation](https://www.anthropic.com/research/claude-code-sandboxing).

### 13. Can MCP servers, plugins, Skills and dependencies become attack entry points?

Yes, with different trust implications. Tool descriptions and Skill text can influence decisions; plugin or dependency code may execute directly; remote services may receive submitted data. Successful installation, a familiar name or protocol compliance does not establish trustworthy provenance or behavior.

Verify origin, version and update channels, assess code permissions and data destinations, and test behavior with limited access. Version pinning and signatures support provenance, but do not independently prove a component harmless. See [OWASP on agentic supply-chain vulnerabilities](https://genai.owasp.org/agentic-applications-2026/asi04-agentic-supply-chain-vulnerabilities/).

### 14. Can permissions expand as Agents delegate work to one another?

Yes, particularly when they share powerful tokens or a privileged Agent executes another Agent's requests without checking authorization. An internal request should not bypass controls. Each delegation still needs a defined task scope, current actor and target resources.

Bound downstream permissions and record the initiator, executor and authorization scope. Delegation records in identity standards can help represent this chain, but recording identities does not itself enforce correct access decisions. See [IETF OAuth token exchange and delegation semantics](https://www.rfc-editor.org/rfc/rfc8693.html).

### 15. Can a failing Agent be stopped promptly, its effects investigated and losses recovered?

Those are three separate capabilities to prepare and test. Stopping requires ending further execution, revoking relevant credentials and handling dispatched jobs. Investigation requires records of identities, authorization, tool calls and outcomes. Recovery depends on backups, version history or compensating operations supported by business systems.

Killing a local process may not cancel submitted remote jobs. It cannot retrieve disclosed data, undo a transfer or automatically restore files. Rehearse response before deployment and identify irreversible effects. See [NIST incident-response and recovery recommendations](https://csrc.nist.gov/pubs/sp/800/61/r3/final).

## Sandbox

### 16. What does a sandbox protect: the host, data, other applications, or its own execution environment?

It depends on the threat model and implementation. Common goals include limiting an untrusted program's effect on host resources, data and other processes; some environments also separate tasks or tenants. Windows AppContainer distinguishes device, file, network, process and window access, with actual grants determining what is available. A sandbox label does not establish complete coverage. See [Microsoft's isolation documentation](https://learn.microsoft.com/en-us/windows/win32/secauthz/appcontainer-isolation).

List the protected assets, execution scope, shared resources and exceptions. A sandbox cannot automatically judge business correctness, and does not necessarily protect its programs from the host administrator.

### 17. How do sandboxes, containers, virtual machines, command approval and tool permissions differ?

They operate at different layers and can be combined. A sandbox describes an environment or mechanism that restricts program activity, rather than one fixed underlying technology.

| Approach | Main control | Important condition |
| --- | --- | --- |
| Sandbox | Resources and operations available during execution | Boundaries depend on implementation, policy and covered paths |
| Container | Process, filesystem and network views | Typical Linux containers share a kernel; privileges, mounts and host interfaces matter |
| Virtual machine | An environment with its own guest operating system | Shared directories, devices and management interfaces still provide access paths |
| Command approval | Whether a particular command may start | Approval does not constrain every subsequent action |
| Tool permissions | Available tools and allowed arguments | Underlying execution and remote-service permissions still need limits |

See [Docker's architecture introduction](https://docs.docker.com/learn/content/what-is-a-container/) for containers versus VMs. Compare actual configurations and threat models, rather than labels alone.

### 18. Does the sandbox restrict one tool or the Agent's entire execution chain? What lies outside it?

Both designs exist; trace each execution path. Isolating shell commands does not establish equivalent restrictions for file tools, browsers, remote MCP servers or cloud APIs. Check whether child processes inherit constraints in the actual implementation.

For example, Anthropic's Managed Agents documentation distinguishes sandboxed command/file tools, server-side web tools and application-owned custom tools. Map the path from model to tool, process or service, and resource, identifying each controller. Local process restrictions cannot replace remote identity and permission checks. See this [execution-boundary example](https://platform.claude.com/docs/en/managed-agents/secure-deployment-risks).

### 19. What do read-only files, network allowlists and PII detection each address? Why are they not interchangeable?

Read-only access prevents modification, not reading. A network allowlist restricts destinations, not the safety of content sent there. PII detection identifies supported sensitive categories in covered content, rather than inspecting every file, format and outbound channel.

An Agent could read a read-only file and send its contents to an allowed model. Controlling that transfer also requires checking inspection coverage and finding policies: a warning can allow sending, blocking denies the request, and redaction needs valid rewriting. Verify what can be read, where connections can go, and what was actually sent. See [network and PII scope](../protection/network-pii.md).

### 20. Can sandboxed programs read or use the user's keys, login state and cloud credentials?

If credentials reach a program through readable files, environment variables, tool results or login data, running in a sandbox does not make them safe. Check both whether credentials can be read and whether the program can use them to call services.

One design keeps credentials outside execution and injects them into selected requests through a proxy. This reduces plaintext exposure, but the program may still perform authorized operations. Limit accounts, resources and actions at the issuing service, with a way to revoke access. Hiding a key does not prevent misuse of its authority. See [credential isolation and permissions](https://platform.claude.com/docs/en/managed-agents/secure-deployment#keep-credentials-in-vaults).

### 21. Without escaping the sandbox, could an Agent still delete the wrong files, leak data or misuse business permissions?

Yes. Escape means breaking an isolation boundary; harmful actions within existing permissions need no escape. Examples include deleting a writable workspace, sending readable data to an allowed service, or deleting orders through an overprivileged business tool.

Limit tool functionality, data scope and remote-account permissions, with specific controls for high-impact actions. OWASP identifies excessive functionality, permissions and autonomy as causes of excessive agency. A process remaining inside its sandbox is therefore insufficient evidence of business safety. See [OWASP's risk description](https://genai.owasp.org/llmrisk/llm062025-excessive-agency/).

### 22. Who can change security rules? Can an Agent bypass them by requesting access, switching tools or editing configuration?

Authorized users or administrators should control rules. An Agent can explain a failure and request a specific resource, but requesting is not authorization. Distinguish approval of one action, an exception allowing execution outside the sandbox, and a persistent policy change: they create different boundaries.

Check whether protected processes can modify policy or control interfaces, whether every execution path enforces restrictions, and whether unavailable protection fails closed or falls back to ordinary execution. Anthropic's enterprise guide, for example, distinguishes default exceptions from administrator-enforced sandboxing. Built-in sandboxes cannot all be characterized alike. See the [enterprise policy example](https://claude.com/resources/articles/enterprise-guide-to-securing-coding-agents).

### 23. Is stricter isolation always safer? How can security, task usability and performance be evaluated together?

Restricting a resource generally reduces the associated exposure, but overall security also depends on shared interfaces, credentials, implementation flaws and operations. Blocking more actions does not establish a better solution, nor should an isolation approach be assumed faster or slower.

An evaluation can hold the Agent, model, tasks, host and configuration constant, measuring forbidden effects, legitimate task completion, startup time, task duration and resource use separately. Record failures and exceptions; repeat after upgrades. This is a proposed method, not a performance result. NIST also cautions against generalizing from narrow assessments. See [NIST's evaluation guidance](https://nvlpubs.nist.gov/nistpubs/ai/NIST.AI.600-1.pdf).

### 24. How can sandbox effectiveness be demonstrated: is a denial message enough, or must final effects be checked?

Check actual effects and confirm that a valid operation was attempted. A program never running, missing dependencies, an incorrect path or a model's refusal cannot independently prove isolation. Include allowed and forbidden operations, examining real files, devices, processes or receiving endpoints.

Preserve versions, policy, launch route, approval history, tool results and independent observations. Record initial denial, post-approval results and final harm separately. An absent effect does not establish which system interface blocked it. Public records should also identify untested areas and assessment limits. See the [evaluation methods and evidence requirements](whitepaper.md).

## FinShield

### 25. My Agent already has a sandbox. Why add FinShield, and what gap does it fill?

An additional layer is justified when native protection does not cover your resource boundaries, integration or management requirements. FinShield connects existing Agents to controlled execution environments that enforce user-defined resource boundaries, with runtime records in supporting configurations. Our position is that difficulty completing a task should not automatically justify broader access.

A concrete example appears in the [evaluation archive](whitepaper.md): in its November 25, 2026 Windows snapshot, native Codex CLI scored 8/8 in data scenarios and 0/13 in system scenarios, while the FinShield comparison configuration scored 13/13 in system scenarios. Effective file protection therefore coexisted with other gaps in those tested versions and configurations. This does not establish the same gaps in current or all native sandboxes.

Native sandboxes also use system-level enforcement; they cannot be reduced to prompts or approval dialogs. See [Anthropic's design](https://www.anthropic.com/research/claude-code-sandboxing). Establish the actual gap using [compatibility](../agents/compatibility.md), the [protection guide](../protection/README.md), and allowed and forbidden operations in the same workload.

### 26. Operating systems already have AppContainer and Seatbelt. What product value does FinShield add?

Operating systems supply isolation primitives. A product must also connect the Agent, determine necessary access, manage authorized launch, and verify protection after updates. FinShield organizes these steps into plugin, desktop and CLI workflows, reducing adaptation and maintenance work. Delivery scope is documented separately for each integration.

AppContainer already supports file, process and window isolation; see [Microsoft's documentation](https://learn.microsoft.com/en-us/windows/win32/secauthz/appcontainer-isolation). FinShield reuses these mechanisms rather than claiming to have invented them. See the [security architecture index](../architecture/README.md) and [Inspector guide](../architecture/inspector.md) for current mechanisms and recording scope, and the [installation guide](../getting-started/install.md) for supported workflows.

### 27. Why constrain an Agent on the existing computer instead of moving the task into a VM or remote environment?

Some tasks need existing local files, tools and applications. FinShield lets users retain supported tools while constraining protected execution processes, without first migrating the entire environment. Integrations retaining a desktop interface must still distinguish the ordinary UI from the protected execution Host.

If the workload can move, or requires isolation such as a separate guest kernel, evaluate suitable VM or remote options. Local process isolation is not equivalent to a VM; remote execution does not automatically secure shared files, credentials or business permissions. Choose against your requirements and [supported integration scope](../agents/compatibility.md). Our evaluations do not establish a performance advantage over these alternatives.

### 28. Does FinShield replace, complement or combine with the native sandbox? Which layer enforces which rules?

It depends on the integration. The Agent may manage tool calls and approvals; FinShield constrains connected execution processes and controlled paths; remote services enforce account permissions. Layers combine only where an operation actually passes through their controls. Multiple layers do not mean every layer covers every tool.

Do not assume evaluations leave the native sandbox unchanged and simply add FinShield. The [evaluation archive](whitepaper.md) explains configuration and approval differences between groups. For deployment, identify who launches processes, authorizes files and networking, and controls external tools. Verify using the relevant [Agent guide](../agents/README.md); one layer's protection status cannot establish end-to-end coverage.

### 29. Where are the differences: protection scope, Agent integration, platforms, policy management or verifiable results?

All are useful comparison dimensions, but claims must follow actual delivery and evidence. Feature names alone do not establish superiority.

| Dimension | What to check | Evidence |
| --- | --- | --- |
| Protection scope | Files, device privacy, desktop and system operations; network-content inspection has separate conditions | [Protection guide](../protection/README.md) |
| Agent integration | Specific plugin, desktop and CLI forms, with released, test or example status | [Compatibility matrix](../agents/compatibility.md) |
| Platforms and configuration | Platform mechanisms, effective settings and supported editing interfaces; capabilities differ | [Configuration](../protection/configuration.md) and [security architecture](../architecture/README.md) |
| Outcomes | Versions, configuration, approvals and final resource state in comparison tests | [Evaluation archive](whitepaper.md) |

In the evaluation archive's November 25, 2026 snapshot, four Windows Agents each have 38 scored scenarios, and each FinShield comparison configuration achieved 38/38. This is a public evaluation maintained by the development team, not third-party certification. It does not establish universal protection, PII accuracy, normal-task completion rates or performance advantages. The earlier reference article's scenario count is not combined with this snapshot.

### 30. When is FinShield worth using, and when is an existing solution enough?

Evaluate FinShield when a supported Agent needs existing local data and tools while access to other files, devices or system operations must be constrained. Teams using several Agents, or separately checking execution permissions and supported runtime records, can assess whether it reduces integration and management work.

If your environment already meets your access and deployment requirements, there is no need to add complexity solely to introduce another sandbox. Evaluate allowed work, forbidden operations, required records and operating costs together, rather than counting denials. Start with [compatibility](../agents/compatibility.md) and [permission verification](../getting-started/install.md#verify-permission-scope).

### 31. What does FinShield not solve, and which capabilities are not enabled by default?

An execution boundary does not guarantee correct model answers, eliminate prompt injection, judge every business action, or provide file backups and undo. Writable locations can still be changed or deleted. Ordinary desktop processes, unconnected paths and remote-service actions require separate assessment.

The public DSH / OpenCode Windows plugins default to `network.mode: host`, without thereby enabling website restrictions, HTTPS inspection or PII redaction. Their file baseline is `read_write`, not a blanket denial outside the workspace; neither has a general `.env` filename denial. A PII finding does not necessarily mean blocking or redaction. See [defaults](../protection/defaults.md) and [network / PII scope](../protection/network-pii.md).

### 32. If Agent vendors keep improving native sandboxes, what is FinShield's long-term value?

Long-term value must be demonstrated: applying user resource requirements across supported Agents, reducing integration and maintenance work, and providing verifiable protection outcomes and runtime records. Independent protection is designed around the permissions users choose to grant. That is a product direction, not proof that independent products are inherently safer.

Adaptation and evidence must evolve with Agents, operating systems and attacks. If a native solution fully meets a user's needs, it can be sufficient. FinShield's value depends on filling real gaps, not an assumption that alternatives will always fall short. See current [compatibility](../agents/compatibility.md), [evaluation evidence](whitepaper.md) and the [product introduction](../overview/README.md).
