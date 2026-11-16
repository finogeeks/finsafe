"""Apply this plugin's network YAML, materialize effective config, and refresh.

Requires Python and PyYAML: python -m pip install PyYAML
Keep this script, network-policy.example.yaml and the plugin EXE together.
Errors are deliberately left visible; fix the cause and run again.
"""
import argparse
import os
from pathlib import Path
import shutil
import subprocess

import yaml


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--finsafe", type=Path, default=Path(
        os.environ.get("ProgramFiles", r"C:\Program Files")) / "FinSAFE/finsafe.exe")
    parser.add_argument("--config-dir", type=Path, default=Path(
        os.environ.get("ProgramData", r"C:\ProgramData")) / "FinSAFE/config")
    args = parser.parse_args()
    finsafe = args.finsafe.resolve(strict=True)
    package = Path(__file__).resolve().parent
    template = yaml.safe_load((package / "network-policy.example.yaml").read_text(encoding="utf-8-sig"))
    network = template["network"]
    for plugin in network["llm_content"]["plugins"][:1]:
        if plugin["detector"] == "external":
            plugin["executable"] = str((package / plugin["executable"]).resolve(strict=True))
    candidate = args.config_dir.resolve() / "candidate.yaml"
    effective = candidate.with_name("effective.yaml")
    document = yaml.safe_load(candidate.read_text(encoding="utf-8-sig"))
    document["policy"]["network"] = network
    for path in (candidate, effective):
        shutil.copy2(path, str(path) + ".bak")
    candidate.write_text(yaml.safe_dump(document, allow_unicode=True, sort_keys=False), encoding="utf-8")
    subprocess.run([str(finsafe), "config", "materialize", "--candidate", str(candidate),
                    "--output", str(effective), "--on-conflict", "replace"], check=True)
    subprocess.run([str(finsafe), "app", "tls-inspector", "--refresh",
                    "--yaml", str(effective)], check=True)
    print("Applied plugin configuration and requested inspector refresh.")


if __name__ == "__main__":
    main()
