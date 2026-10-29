"""Repair helpers for data that predates a database constraint (S16).

`users.email` is unique (S9) and the index is created at startup. When the
collection already holds duplicated addresses MongoDB refuses to build the
index, so the API cannot start (S16a). The decision taken is to fail fast with
an actionable diagnostic instead of degrading silently or skipping the index,
and to ship an idempotent repair script (S16b).

Both sides share the code below, so the rule "keep the oldest account per
email, delete the rest" has exactly one implementation:

* startup calls `create_unique_user_email_index`, which raises
  `DuplicateEmailIndexError` with the duplicate count and the repair command;
* `backend/scripts/dedupe_emails.py` calls `load_duplicate_email_plan` and
  `delete_duplicate_accounts`.

The planning functions are pure (they take plain rows), and the database
functions only use `find`, `create_index` and `delete_one`, so everything here
can be exercised with a fake collection and no MongoDB server.

Import direction is one way only: `app.main` imports this module, never the
reverse.
"""

import logging
from dataclasses import dataclass
from datetime import datetime, timezone
from typing import Any, Dict, Iterable, List, Optional, Tuple

from pymongo import ASCENDING
from pymongo.errors import DuplicateKeyError

logger = logging.getLogger(__name__)

#: Field description used in the startup diagnostic.
USERS_EMAIL_INDEX_DESCRIPTION = "users.email"

#: Exact command that repairs the data, quoted verbatim in the startup error.
DEDUPE_EMAILS_FIX_COMMAND = "python -m scripts.dedupe_emails --apply"

#: Upper bound on the addresses listed in the diagnostic, so a large collection
#: cannot flood the logs while the application is failing to start.
MAX_REPORTED_SAMPLE_EMAILS = 5

#: Only the fields needed to decide which account survives.
USER_IDENTITY_PROJECTION = {"email": 1, "created_at": 1}


@dataclass(frozen=True)
class DuplicateEmailGroup:
    """One duplicated email address: the account to keep and the ones to drop."""

    email: str
    keep: Dict[str, Any]
    delete: Tuple[Dict[str, Any], ...]


@dataclass(frozen=True)
class EmailDedupePlan:
    """Outcome of grouping user rows by email address.

    An empty plan means the data is already clean: nothing to keep, nothing to
    delete, and therefore nothing to write.
    """

    groups: Tuple[DuplicateEmailGroup, ...]

    @property
    def has_duplicates(self) -> bool:
        return bool(self.groups)

    @property
    def duplicate_email_count(self) -> int:
        """Number of email addresses shared by more than one account."""
        return len(self.groups)

    @property
    def affected_account_count(self) -> int:
        """Number of accounts involved in a duplicated email address."""
        return sum(len(group.delete) + 1 for group in self.groups)

    @property
    def accounts_to_keep(self) -> Tuple[Dict[str, Any], ...]:
        return tuple(group.keep for group in self.groups)

    @property
    def accounts_to_delete(self) -> Tuple[Dict[str, Any], ...]:
        return tuple(document for group in self.groups for document in group.delete)

    @property
    def sample_emails(self) -> Tuple[str, ...]:
        return tuple(group.email for group in self.groups[:MAX_REPORTED_SAMPLE_EMAILS])


def _created_at_epoch(document: Dict[str, Any]) -> Optional[float]:
    """Return `created_at` as a comparable epoch value, or None when unusable."""
    value = document.get("created_at")
    if isinstance(value, datetime):
        moment = value if value.tzinfo is not None else value.replace(tzinfo=timezone.utc)
        return moment.timestamp()
    if isinstance(value, (int, float)) and not isinstance(value, bool):
        return float(value)
    return None


def _oldest_first_key(document: Dict[str, Any]) -> Tuple[int, float, str]:
    """Sort key that puts the oldest account first.

    `created_at` decides. Rows without a usable `created_at` sort after the ones
    that have it, and `_id` breaks every remaining tie: MongoDB ObjectIds grow
    with insertion time, so the lowest `_id` is the oldest insert.
    """
    epoch = _created_at_epoch(document)
    identifier = str(document.get("_id", ""))
    if epoch is None:
        return (1, 0.0, identifier)
    return (0, epoch, identifier)


def plan_email_dedupe(documents: Iterable[Dict[str, Any]]) -> EmailDedupePlan:
    """Group user rows by email and decide what to keep and what to delete.

    Pure and deterministic: same rows in, same plan out, no database access and
    no writes. Per duplicated address the oldest account is kept and every other
    account is listed for deletion. Rows without an email can never collide on
    the unique index, so they are ignored.
    """
    grouped: Dict[str, List[Dict[str, Any]]] = {}
    for document in documents:
        email = document.get("email")
        if not isinstance(email, str) or not email:
            continue
        grouped.setdefault(email, []).append(document)

    groups: List[DuplicateEmailGroup] = []
    for email in sorted(grouped):
        rows = grouped[email]
        if len(rows) < 2:
            continue
        ordered = sorted(rows, key=_oldest_first_key)
        groups.append(
            DuplicateEmailGroup(email=email, keep=ordered[0], delete=tuple(ordered[1:]))
        )

    return EmailDedupePlan(groups=tuple(groups))


class DuplicateEmailIndexError(RuntimeError):
    """Startup blocker: `users.email` holds duplicates, so the index cannot exist.

    Raised instead of letting a bare `DuplicateKeyError` reach the logs: the
    message states how many duplicates exist and the exact command that repairs
    them. The original `DuplicateKeyError` stays attached as `__cause__`.
    """


def _counted(count: int, singular: str, plural: str) -> str:
    return f"{count} {singular if count == 1 else plural}"


def format_duplicate_email_error(plan: Optional[EmailDedupePlan] = None) -> str:
    """Build the actionable startup message (S16a).

    `plan=None` means the duplicate count could not be read, which still has to
    produce a message with the repair command instead of a bare traceback.
    """
    if plan is not None:
        verb = "is" if plan.duplicate_email_count == 1 else "are"
        addresses = _counted(
            plan.duplicate_email_count,
            "duplicated email address",
            "duplicated email addresses",
        )
        accounts = _counted(plan.affected_account_count, "account", "accounts")
        summary = (
            f"Cannot create the unique index on {USERS_EMAIL_INDEX_DESCRIPTION}: "
            f"{addresses} {verb} shared by {accounts}."
        )
    else:
        summary = (
            f"Cannot create the unique index on {USERS_EMAIL_INDEX_DESCRIPTION}: "
            "the collection still holds duplicated email addresses "
            "and their count could not be read."
        )

    lines = [
        summary,
        "The API will not start until these duplicated emails are resolved.",
        "Fix them by running this from the backend/ directory:",
        "",
        f"    {DEDUPE_EMAILS_FIX_COMMAND}",
        "",
        "Without --apply the script only reports the duplicates. "
        "It keeps the oldest account per email and deletes the rest.",
    ]

    if plan is not None:
        listed = ", ".join(plan.sample_emails)
        remaining = plan.duplicate_email_count - len(plan.sample_emails)
        if remaining:
            listed = f"{listed} (and {remaining} more)"
        lines.append(f"Duplicated emails: {listed}")

    return "\n".join(lines)


async def load_user_identity_rows(collection) -> List[Dict[str, Any]]:
    """Read the email/created_at fields of every user row.

    This full scan only runs after the unique index has already failed, so it
    never costs anything on a healthy startup.
    """
    cursor = collection.find({}, USER_IDENTITY_PROJECTION)
    return [document async for document in cursor]


async def load_duplicate_email_plan(collection) -> EmailDedupePlan:
    """Scan `collection` and return the keep/delete plan for duplicated emails."""
    return plan_email_dedupe(await load_user_identity_rows(collection))


async def delete_duplicate_accounts(collection, plan: EmailDedupePlan) -> int:
    """Delete every account the plan marks for deletion, one `_id` at a time.

    Deleting by `_id` (never by email) keeps the operation safe to repeat: a
    second run finds no duplicates and issues no writes.
    """
    deleted = 0
    for document in plan.accounts_to_delete:
        result = await collection.delete_one({"_id": document["_id"]})
        deleted += result.deleted_count
    return deleted


async def create_unique_user_email_index(collection) -> None:
    """Create the unique index on `users.email`, failing fast on duplicates (S16a).

    Everything except `DuplicateKeyError` propagates untouched. On a duplicate
    key the collection is scanned for the offending addresses and the startup
    error becomes `DuplicateEmailIndexError` with the count and the repair
    command. If that scan finds nothing (or cannot run) the original
    `DuplicateKeyError` is not masked.
    """
    try:
        await collection.create_index([("email", ASCENDING)], unique=True)
    except DuplicateKeyError as duplicate:
        plan: Optional[EmailDedupePlan] = None
        try:
            plan = await load_duplicate_email_plan(collection)
        except Exception:  # the diagnostic must never hide the startup blocker
            logger.exception("Could not count the duplicated emails in users")

        if plan is not None and not plan.has_duplicates:
            # The duplicate key error has some other cause: keep it intact
            # instead of claiming the emails are duplicated.
            raise

        raise DuplicateEmailIndexError(format_duplicate_email_error(plan)) from duplicate
