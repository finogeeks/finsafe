#!/bin/bash
# Jamf Extension Attribute: FinSAFE enrollment status
if [[ -f /etc/finsafe/enrolled.json ]]; then
  echo "<result>enrolled</result>"
elif [[ -f /etc/finsafe/managed-required.json ]]; then
  echo "<result>sentinel-only</result>"
else
  echo "<result>unmanaged</result>"
fi
