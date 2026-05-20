#!/bin/bash
# Intune Linux custom script — install systemd unit and start finsafe-agent.
# Requires finsafe + finsafe-agent already in /usr/local/bin/.
set -euo pipefail
AUTH_URL="${1:-https://gov.example.com/policy-authority}"

cat > /etc/systemd/system/finsafe-agent.service <<'UNIT'
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

[Install]
WantedBy=multi-user.target
UNIT

mkdir -p /etc/finsafe /var/lib/finsafe /etc/systemd/system/finsafe-agent.service.d
cat > /etc/systemd/system/finsafe-agent.service.d/authority.conf <<EOF
[Service]
Environment=FINSAFE_AUTHORITY_URL=${AUTH_URL}
EOF

systemctl daemon-reload
systemctl enable --now finsafe-agent.service
systemctl is-active finsafe-agent.service
