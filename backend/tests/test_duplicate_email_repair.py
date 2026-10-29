"""Duplicated `users.email` rows versus the unique index (S16 of odd/tasks/poke-web-hardening.md).

The unique index cannot be created while duplicated addresses exist, and the API
must not start quietly in that state: startup fails with a message that states
how many duplicates there are and the exact command that repairs them (S16a).
`backend/scripts/dedupe_emails.py` performs that repair, dry-run by default and
idempotent (S16b).

Every test drives a fake collection that records `create_index` and `delete_one`
calls, so no MongoDB server is required.
"""

from datetime import datetime, timedelta, timezone

import pytest
from pymongo import ASCENDING, DESCENDING
from pymongo.errors import DuplicateKeyError

from app.core.migrations import (
    DEDUPE_EMAILS_FIX_COMMAND,
    DuplicateEmailIndexError,
    plan_email_dedupe,
)
from app.main import create_indexes
from scripts.dedupe_emails import build_parser, dedupe

DUPLICATE_KEY_MESSAGE = (
    "E11000 duplicate key error collection: webpoke_test.users index: email_1 "
    'dup key: { email: "ash@example.com" }'
)

NOW = datetime(2026, 1, 1, tzinfo=timezone.utc)


def days_ago(days):
    return NOW - timedelta(days=days)


def user_document(identifier, email, created_at=None):
    """One users row as MongoDB would return it (projected or complete)."""
    document = {"_id": identifier}
    if email is not None:
        document["email"] = email
    if created_at is not None:
        document["created_at"] = created_at
    return document


class _AsyncCursor:
    """Minimal async-iterable cursor, enough to stand in for a Motor cursor."""

    def __init__(self, documents):
        self._documents = [dict(document) for document in documents]

    def __aiter__(self):
        return _CursorIterator(self._documents)


class _CursorIterator:
    def __init__(self, documents):
        self._documents = documents
        self._index = 0

    def __aiter__(self):
        return self

    async def __anext__(self):
        if self._index >= len(self._documents):
            raise StopAsyncIteration
        document = self._documents[self._index]
        self._index += 1
        return document


class FakeDeleteResult:
    def __init__(self, deleted_count):
        self.deleted_count = deleted_count


class FakeCollection:
    """In-memory collection that records index and delete calls."""

    def __init__(self, documents=(), create_index_error=None):
        self.documents = [dict(document) for document in documents]
        self.create_index_error = create_index_error
        self.indexes = []
        self.deletes = []

    async def create_index(self, keys, **options):
        self.indexes.append((list(keys), options))
        if self.create_index_error is not None:
            raise self.create_index_error
        return f"users_{len(self.indexes)}"

    def find(self, filter=None, projection=None):
        return _AsyncCursor(self.documents)

    async def delete_one(self, filter):
        target = filter["_id"]
        for position, document in enumerate(self.documents):
            if document.get("_id") == target:
                del self.documents[position]
                self.deletes.append(target)
                return FakeDeleteResult(1)
        self.deletes.append(target)
        return FakeDeleteResult(0)

    def index_keys(self):
        return [keys for keys, _ in self.indexes]


class FakeDatabase:
    """Database handle whose collections are the fakes above."""

    def __init__(self, users):
        self.users = users
        self.orders = FakeCollection()
        self.activities = FakeCollection()


def duplicated_users():  # noqa: D401 - helper
    """Two duplicated addresses across five accounts, plus one unique account."""
    return [
        user_document("account-ash-old", "ash@example.com", days_ago(30)),
        user_document("account-ash-new", "ash@example.com", days_ago(2)),
        user_document("account-misty-old", "misty@example.com", days_ago(20)),
        user_document("account-misty-mid", "misty@example.com", days_ago(10)),
        user_document("account-misty-new", "misty@example.com", days_ago(1)),
        user_document("account-brock", "brock@example.com", days_ago(15)),
    ]


# --- Pure planning: which account survives, which ones go -------------------


def test_plan_keeps_the_oldest_account_and_deletes_the_rest():
    """S16b: per duplicated email the oldest account is the survivor."""
    plan = plan_email_dedupe(
        [
            user_document("account-new", "ash@example.com", days_ago(1)),
            user_document("account-old", "ash@example.com", days_ago(30)),
            user_document("account-mid", "ash@example.com", days_ago(10)),
            user_document("account-brock", "brock@example.com", days_ago(20)),
        ]
    )

    assert plan.has_duplicates is True
    assert plan.duplicate_email_count == 1
    assert plan.affected_account_count == 3
    assert [document["_id"] for document in plan.accounts_to_keep] == ["account-old"]
    assert [document["_id"] for document in plan.accounts_to_delete] == [
        "account-mid",
        "account-new",
    ]


def test_plan_is_empty_when_every_email_is_unique():
    """S16b: with no duplicates there is nothing to keep and nothing to delete."""
    plan = plan_email_dedupe(
        [
            user_document("account-1", "ash@example.com", days_ago(1)),
            user_document("account-2", "misty@example.com", days_ago(2)),
        ]
    )

    assert plan.has_duplicates is False
    assert plan.duplicate_email_count == 0
    assert plan.accounts_to_keep == ()
    assert plan.accounts_to_delete == ()


def test_plan_falls_back_to_the_lowest_id_without_created_at_and_skips_rows_without_email():
    """S16b: missing `created_at` ties break on `_id`; rows without email never collide."""
    plan = plan_email_dedupe(
        [
            user_document("account-2", "ash@example.com"),
            user_document("account-1", "ash@example.com"),
            user_document("account-3", None),
            user_document("account-4", ""),
        ]
    )

    assert plan.duplicate_email_count == 1
    assert [document["_id"] for document in plan.accounts_to_keep] == ["account-1"]
    assert [document["_id"] for document in plan.accounts_to_delete] == ["account-2"]


# --- S16a: startup fails fast with an actionable diagnostic -----------------


async def test_startup_fails_with_the_duplicate_count_and_the_repair_command():
    """S16a: DuplicateKeyError becomes a message with the count and the command."""
    users = FakeCollection(
        duplicated_users(), create_index_error=DuplicateKeyError(DUPLICATE_KEY_MESSAGE)
    )

    with pytest.raises(DuplicateEmailIndexError) as error:
        await create_indexes(FakeDatabase(users))

    message = str(error.value)
    assert "users.email" in message
    assert "2 duplicated email addresses are shared by 5 accounts" in message
    assert DEDUPE_EMAILS_FIX_COMMAND in message
    assert message != DUPLICATE_KEY_MESSAGE
    assert isinstance(error.value.__cause__, DuplicateKeyError)
    assert users.deletes == []


async def test_startup_diagnostic_uses_the_singular_form_for_one_duplicate():
    """S16a: the count reads correctly when a single address is duplicated."""
    users = FakeCollection(
        [
            user_document("account-old", "ash@example.com", days_ago(30)),
            user_document("account-new", "ash@example.com", days_ago(1)),
        ],
        create_index_error=DuplicateKeyError(DUPLICATE_KEY_MESSAGE),
    )

    with pytest.raises(DuplicateEmailIndexError) as error:
        await create_indexes(FakeDatabase(users))

    message = str(error.value)
    assert "1 duplicated email address is shared by 2 accounts" in message
    assert "Duplicated emails: ash@example.com" in message


async def test_startup_still_creates_the_orders_and_activities_indexes():
    """S16a: the three existing indexes are created before the email index fails."""
    users = FakeCollection(
        duplicated_users(), create_index_error=DuplicateKeyError(DUPLICATE_KEY_MESSAGE)
    )
    database = FakeDatabase(users)

    with pytest.raises(DuplicateEmailIndexError):
        await create_indexes(database)

    assert [("user_id", ASCENDING)] in database.orders.index_keys()
    assert [("user_id", ASCENDING), ("created_at", DESCENDING)] in database.orders.index_keys()
    assert [
        ("user_id", ASCENDING),
        ("timestamp", DESCENDING),
    ] in database.activities.index_keys()
    assert database.users.index_keys() == [[("email", ASCENDING)]]


async def test_startup_does_not_mask_a_duplicate_key_error_without_duplicated_emails():
    """S16a: the failure is never swallowed; an unrelated duplicate key stays visible."""
    users = FakeCollection(
        [user_document("account-1", "ash@example.com", days_ago(2))],
        create_index_error=DuplicateKeyError(DUPLICATE_KEY_MESSAGE),
    )

    with pytest.raises(DuplicateKeyError):
        await create_indexes(FakeDatabase(users))


# --- S16b: the repair script ------------------------------------------------


def test_script_exposes_an_apply_flag():
    """S16b: --apply is opt-in and off by default."""
    parser = build_parser()

    assert parser.parse_args([]).apply is False
    assert parser.parse_args(["--apply"]).apply is True


async def test_script_is_a_dry_run_by_default():
    """S16b: without --apply the script reports and writes nothing."""
    users = FakeCollection(duplicated_users())
    printed = []

    outcome = await dedupe(users, echo=printed.append)

    assert outcome.applied is False
    assert outcome.deleted_count == 0
    assert outcome.duplicate_email_count == 2
    assert outcome.affected_account_count == 5
    assert users.deletes == []
    assert len(users.documents) == 6
    assert any("Found 2 duplicated email address(es) across 5 account(s)." == line for line in printed)
    assert any("Dry run: 3 account(s) would be deleted." in line for line in printed)
    assert any("--apply" in line for line in printed)


async def test_script_apply_keeps_the_oldest_account_and_deletes_the_rest():
    """S16b: --apply keeps the oldest account per email and deletes every other one."""
    users = FakeCollection(duplicated_users())

    outcome = await dedupe(users, apply=True, echo=lambda line: None)

    assert outcome.applied is True
    assert outcome.deleted_count == 3
    assert users.deletes == ["account-ash-new", "account-misty-mid", "account-misty-new"]
    assert sorted(document["_id"] for document in users.documents) == [
        "account-ash-old",
        "account-brock",
        "account-misty-old",
    ]


async def test_script_apply_twice_is_safe():
    """S16b: a second run finds nothing left and issues no writes."""
    users = FakeCollection(duplicated_users())

    first = await dedupe(users, apply=True, echo=lambda line: None)
    second = await dedupe(users, apply=True, echo=lambda line: None)

    assert first.deleted_count == 3
    assert second.applied is False
    assert second.deleted_count == 0
    assert second.duplicate_email_count == 0
    assert users.deletes == ["account-ash-new", "account-misty-mid", "account-misty-new"]


async def test_script_never_deletes_when_there_are_no_duplicates():
    """S16b: --apply on clean data deletes nothing at all."""
    users = FakeCollection(
        [
            user_document("account-1", "ash@example.com", days_ago(3)),
            user_document("account-2", "misty@example.com", days_ago(2)),
        ]
    )
    printed = []

    outcome = await dedupe(users, apply=True, echo=printed.append)

    assert outcome.applied is False
    assert outcome.deleted_count == 0
    assert users.deletes == []
    assert len(users.documents) == 2
    assert any("No duplicated email addresses found." in line for line in printed)
