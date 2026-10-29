"""Repair duplicated rows in `users.email` so the unique index can be built (S16b).

The API refuses to start while `users.email` holds duplicated addresses (S16a),
because MongoDB cannot create the unique index. This script is the documented
repair path, and it is conservative by default:

* without flags it only reports the duplicates (dry run, no writes at all);
* with `--apply` it keeps the oldest account per email and deletes the rest.

It never deletes anything when there are no duplicates, and running it twice in
a row is safe, so it can be re-run until the report says there is nothing left
to fix.

Usage, from the `backend/` directory (the same place uvicorn is started):

    python -m scripts.dedupe_emails          # report only
    python -m scripts.dedupe_emails --apply  # delete the duplicated accounts

Only the Mongo settings are read (`MONGO_URI` / `MONGO_DB`, or `backend/.env`),
so the repair does not require `JWT_SECRET`.
"""

import argparse
import asyncio
import sys
from dataclasses import dataclass
from pathlib import Path
from typing import Any, Callable, Optional, Sequence

if __package__ in (None, ""):  # supports `python scripts/dedupe_emails.py`
    sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from motor.motor_asyncio import AsyncIOMotorClient  # noqa: E402
from pydantic_settings import BaseSettings, SettingsConfigDict  # noqa: E402

from app.core.migrations import (  # noqa: E402
    EmailDedupePlan,
    delete_duplicate_accounts,
    load_duplicate_email_plan,
)

# Same defaults as `app.core.config.Settings`, redeclared on purpose: importing
# that module would make `JWT_SECRET` mandatory for a database repair.
DEFAULT_MONGO_URI = "mongodb://localhost:27017"
DEFAULT_MONGO_DB = "webpoke"


class _RepairSettings(BaseSettings):
    """The Mongo subset of the application settings.

    `extra="ignore"` is explicit: the shared `backend/.env` also holds keys this
    script does not declare (`JWT_SECRET`, token lifetimes, ...) and reading them
    must not turn a repair into a validation error.
    """

    mongo_uri: str = DEFAULT_MONGO_URI
    mongo_db: str = DEFAULT_MONGO_DB

    model_config = SettingsConfigDict(
        env_file=".env", env_file_encoding="utf-8", extra="ignore"
    )


@dataclass(frozen=True)
class DedupeOutcome:
    """What the run found and what it did."""

    duplicate_email_count: int
    affected_account_count: int
    deleted_count: int
    applied: bool


def _account_label(document: dict) -> str:
    return str(document.get("_id", "<missing _id>"))


def _describe_plan(plan: EmailDedupePlan, echo: Callable[[str], Any]) -> None:
    for group in plan.groups:
        deletable = ", ".join(_account_label(document) for document in group.delete)
        echo(
            f"  {group.email}: keep {_account_label(group.keep)}, "
            f"delete {len(group.delete)} account(s) [{deletable}]"
        )


async def dedupe(
    collection,
    apply: bool = False,
    echo: Callable[[str], Any] = print,
) -> DedupeOutcome:
    """Report duplicated emails and, only with `apply=True`, delete the extras.

    `collection` is any object shaped like a Motor collection (`find`,
    `delete_one`), which is what makes this runnable against a fake in tests.
    """
    plan = await load_duplicate_email_plan(collection)

    if not plan.has_duplicates:
        echo("No duplicated email addresses found. The unique index on users.email can be created.")
        return DedupeOutcome(
            duplicate_email_count=0,
            affected_account_count=0,
            deleted_count=0,
            applied=False,
        )

    echo(
        f"Found {plan.duplicate_email_count} duplicated email address(es) "
        f"across {plan.affected_account_count} account(s)."
    )
    _describe_plan(plan, echo)

    if not apply:
        echo(
            f"Dry run: {len(plan.accounts_to_delete)} account(s) would be deleted. "
            "Re-run with --apply to delete them."
        )
        return DedupeOutcome(
            duplicate_email_count=plan.duplicate_email_count,
            affected_account_count=plan.affected_account_count,
            deleted_count=0,
            applied=False,
        )

    deleted = await delete_duplicate_accounts(collection, plan)
    echo(f"Deleted {deleted} account(s), keeping the oldest account per email.")
    echo("Re-run this script to confirm that no duplicated email addresses remain.")
    return DedupeOutcome(
        duplicate_email_count=plan.duplicate_email_count,
        affected_account_count=plan.affected_account_count,
        deleted_count=deleted,
        applied=True,
    )


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        prog="python -m scripts.dedupe_emails",
        description=(
            "Report duplicated users.email addresses and, with --apply, keep the "
            "oldest account per email and delete the rest."
        ),
    )
    parser.add_argument(
        "--apply",
        action="store_true",
        help="delete the duplicated accounts instead of only reporting them",
    )
    return parser


def main(argv: Optional[Sequence[str]] = None) -> int:
    args = build_parser().parse_args(argv)
    settings = _RepairSettings()

    print(f"Scanning duplicated emails in the {settings.mongo_db!r} database (users collection).")

    client = AsyncIOMotorClient(settings.mongo_uri)
    try:
        asyncio.run(dedupe(client[settings.mongo_db].users, apply=args.apply))
    finally:
        client.close()

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
