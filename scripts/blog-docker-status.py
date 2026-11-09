#!/usr/bin/env python3
"""Snapshot docker container state for the blog's public /status page.

The blog runs as the unprivileged `www` user, which has no access to the
docker socket. This script is meant to run as root from cron once a minute
and drop a small world-readable JSON file that the Next.js API reads.

Install:
  cp scripts/blog-docker-status.py /usr/local/bin/blog-docker-status
  chmod 755 /usr/local/bin/blog-docker-status
  echo '* * * * * root /usr/bin/python3 /usr/local/bin/blog-docker-status >/dev/null 2>&1' \
      > /etc/cron.d/blog-docker-status
"""

import json
import os
import re
import subprocess
import tempfile
import time

OUT_DIR = "/var/lib/blog-status"
OUT_FILE = os.path.join(OUT_DIR, "docker.json")

UNITS = {
    "B": 1,
    "KB": 1000,
    "KIB": 1024,
    "MB": 1000**2,
    "MIB": 1024**2,
    "GB": 1000**3,
    "GIB": 1024**3,
    "TB": 1000**4,
    "TIB": 1024**4,
}


def sh(args, timeout=20):
    try:
        return subprocess.run(args, capture_output=True, text=True, timeout=timeout).stdout.strip()
    except Exception:
        return ""


def parse_bytes(text):
    m = re.match(r"([\d.]+)\s*([KMGTP]?i?B)", (text or "").strip(), re.I)
    if not m:
        return 0
    try:
        return int(float(m.group(1)) * UNITS.get(m.group(2).upper(), 1))
    except ValueError:
        return 0


def parse_percent(text):
    m = re.search(r"([\d.]+)", text or "")
    try:
        return round(float(m.group(1)), 2) if m else 0.0
    except ValueError:
        return 0.0


def parse_mem_usage(text):
    # docker stats prints e.g. "494.7MiB / 3.642GiB"
    return parse_bytes((text or "").split("/")[0])


def main():
    containers = []
    listing = sh(["docker", "ps", "--format", "{{.Names}}\t{{.Image}}\t{{.Status}}"])
    if listing:
        stats = {}
        stats_out = sh(["docker", "stats", "--no-stream", "--format", "{{.Name}}\t{{.MemUsage}}\t{{.CPUPerc}}"])
        for line in stats_out.splitlines():
            parts = line.split("\t")
            if len(parts) == 3:
                stats[parts[0]] = (parse_mem_usage(parts[1]), parse_percent(parts[2]))

        for line in listing.splitlines():
            parts = line.split("\t")
            if len(parts) < 3:
                continue
            name, image, status = parts[0], parts[1], parts[2]
            memory, cpu = stats.get(name, (0, 0.0))
            containers.append(
                {
                    "name": name,
                    "image": image,
                    "status": status,
                    "memory": memory,
                    "cpu": cpu,
                }
            )

    payload = {"updated": int(time.time()), "containers": containers}

    os.makedirs(OUT_DIR, mode=0o755, exist_ok=True)
    fd, tmp = tempfile.mkstemp(dir=OUT_DIR, prefix=".docker-", suffix=".json")
    try:
        with os.fdopen(fd, "w", encoding="utf-8") as fh:
            json.dump(payload, fh, ensure_ascii=False, separators=(",", ":"))
        os.chmod(tmp, 0o644)
        os.replace(tmp, OUT_FILE)
    finally:
        if os.path.exists(tmp):
            os.unlink(tmp)


if __name__ == "__main__":
    main()
