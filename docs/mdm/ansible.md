# Ansible — FinSAFE managed mode (Linux)

**中文：** [ansible-zh.md](./ansible-zh.md)

For Linux workstations, VDI, or servers without Jamf/Intune. Mirrors [enterprise runbook](../enterprise-deployment-runbook.md).

---

## Inventory variables

```yaml
# group_vars/finsafe_managed.yml
finsafe_authority_url: "https://gov.example.com/policy-authority"
finsafe_org_domain: "example.com"
finsafe_device_id: "{{ ansible_hostname }}"  # or ansible_machine_id
finsafe_sentinel_jws: "{{ vault_finsafe_sentinel_jws }}"  # from Ansible Vault
finsafe_enroll_token: ""  # set only for enroll play; empty after
```

---

## Role tasks (outline)

```yaml
- name: Ensure finsafe directories
  ansible.builtin.file:
    path: "{{ item }}"
    state: directory
    owner: root
    group: root
    mode: "0755"
  loop:
    - /etc/finsafe
    - /var/lib/finsafe
    - /var/lib/finsafe/cache
    - /var/lib/finsafe/audit

- name: Install finsafe binaries
  ansible.builtin.copy:
    src: "bin/{{ item }}"
    dest: "/usr/local/bin/{{ item }}"
    mode: "0755"
  loop:
    - finsafe
    - finsafe-agent

- name: Deploy managed-required sentinel
  ansible.builtin.copy:
    content: "{{ finsafe_sentinel_jws }}\n"
    dest: /etc/finsafe/managed-required.json
    owner: root
    group: root
    mode: "0644"

- name: Install finsafe-agent systemd unit
  ansible.builtin.template:
    src: finsafe-agent.service.j2
    dest: /etc/systemd/system/finsafe-agent.service
    mode: "0644"
  notify: Restart finsafe-agent

- name: Optional enroll drop-in
  ansible.builtin.template:
    src: finsafe-agent-enroll.conf.j2
    dest: /etc/systemd/system/finsafe-agent.service.d/enroll.conf
    mode: "0644"
  when: finsafe_enroll_token | length > 0
  notify: Restart finsafe-agent

- name: Enable and start finsafe-agent
  ansible.builtin.systemd:
    name: finsafe-agent
    enabled: true
    state: started
    daemon_reload: true
```

**Handler:**

```yaml
- name: Restart finsafe-agent
  ansible.builtin.systemd:
    name: finsafe-agent
    state: restarted
    daemon_reload: true
```

---

## Template: `finsafe-agent.service.j2`

Based on [`packaging/systemd/finsafe-agent.service`](../../packaging/systemd/finsafe-agent.service):

```ini
[Unit]
Description=FinSAFE managed-mode policy agent
After=network-online.target
Wants=network-online.target

[Service]
Type=simple
ExecStart=/usr/local/bin/finsafe-agent
Restart=on-failure
RestartSec=5
RuntimeDirectory=finsafe
RuntimeDirectoryMode=0755
Environment=FINSAFE_AUTHORITY_URL={{ finsafe_authority_url }}

[Install]
WantedBy=multi-user.target
```

---

## Template: `finsafe-agent-enroll.conf.j2`

```ini
[Service]
Environment=FINSAFE_AGENT_BOOTSTRAP_DEVICE_ID={{ finsafe_device_id }}
Environment=FINSAFE_ENROLL_TOKEN={{ finsafe_enroll_token }}
```

Run enroll play once, then remove token from inventory and delete drop-in:

```yaml
- name: Remove enroll drop-in after success
  ansible.builtin.file:
    path: /etc/systemd/system/finsafe-agent.service.d/enroll.conf
    state: absent
  when: finsafe_enroll_token | length == 0
```

---

## Verify play

```yaml
- name: Check enrollment
  ansible.builtin.stat:
    path: /etc/finsafe/enrolled.json
  register: enrolled

- name: Managed smoke test
  ansible.builtin.command:
    cmd: /usr/local/bin/finsafe run -- /usr/bin/true
  changed_when: false
  when: enrolled.stat.exists
```

---

## Example playbook

Full example: [`packaging/mdm/examples/ansible/deploy-finsafe.yml`](../../packaging/mdm/examples/ansible/deploy-finsafe.yml).
