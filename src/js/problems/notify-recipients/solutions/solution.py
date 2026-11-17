def notify_recipients(users: list[list[int]], requests: list[str]) -> list[int]:
    # O(M + R + K log K) time, O(M + K) space - index groups once.
    known = set()
    members = {}
    for row in users:
        uid = row[0]
        known.add(uid)
        for g in row[1:]:
            members.setdefault(g, []).append(uid)
    out = set()
    expanded = set()
    for r in requests:
        kind, raw = r.split(":")
        rid = int(raw)
        if kind == "user":
            if rid in known:
                out.add(rid)
        elif rid not in expanded:
            # Walk each group at most once: repeated group requests add nothing new.
            expanded.add(rid)
            out.update(members.get(rid, ()))
    return sorted(out)
