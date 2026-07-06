import datetime


def now_iso():
    return datetime.datetime.now(datetime.timezone.utc).isoformat(timespec="seconds")
