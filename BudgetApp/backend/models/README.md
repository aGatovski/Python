# SQLAlchemy Models — `mapped_column` Field Reference

All models in this directory use SQLAlchemy 2.0's `Mapped` + `mapped_column` style.
This document describes every parameter that can be passed to `mapped_column()`.

---

## Column Identity & Indexing

| Parameter | Type | Description |
|---|---|---|
| `primary_key=True` | `bool` | Marks this column as the primary key. Automatically creates a unique index. |
| `index=True` | `bool` | Creates a database index on this column for faster lookups in `WHERE` and `JOIN` queries. |
| `unique=True` | `bool` | Enforces that all values in this column are unique across rows. Also creates an index. |

---

## Nullability

| Parameter | Type | Description |
|---|---|---|
| `nullable=False` | `bool` | Column cannot be `NULL` — a value is required on insert. Inferred automatically from `Mapped[str]` (non-optional). |
| `nullable=True` | `bool` | Column can be `NULL`. Inferred automatically from `Mapped[Optional[str]]`. |

> **Note:** When using `Mapped`, you usually don't need to set `nullable` explicitly.
> `Mapped[str]` → `nullable=False`, `Mapped[Optional[str]]` → `nullable=True`.

---

## Default Values

| Parameter | Type | Description |
|---|---|---|
| `default=<value>` | any | Python-side default. SQLAlchemy sets this value in Python before sending the `INSERT` to the database. Used for static values like `True`, `False`, `0.0`, or `"monthly"`. |
| `default=<callable>` | callable | Same as above but calls the function at insert time (e.g. `default=datetime.utcnow`). The function is called fresh for each new row. |
| `server_default=func.now()` | SQL expression | Database-side default. The DB server sets the value using `NOW()` (equivalent to `DEFAULT CURRENT_TIMESTAMP` in SQL). Used on `created_at` so the DB handles it even for inserts made outside SQLAlchemy. |

---

## Auto-Update

| Parameter | Type | Description |
|---|---|---|
| `onupdate=func.now()` | SQL expression | Automatically sets this column to the current timestamp whenever the row is updated via SQLAlchemy. Used on `updated_at` columns. Does **not** trigger on raw SQL `UPDATE` statements. |

---

## Foreign Keys

| Parameter | Type | Description |
|---|---|---|
| `ForeignKey("table.column")` | `ForeignKey` | Links this column to a column in another table. Passed as the first positional argument inside `mapped_column()`. |
| `ondelete="CASCADE"` | `str` | When the referenced row is deleted, automatically delete this row too. |
| `ondelete="SET NULL"` | `str` | When the referenced row is deleted, set this column to `NULL` instead of deleting the row. Requires `nullable=True`. |

---

## Column Type (optional)

| Parameter | Type | Description |
|---|---|---|
| `String` | SQLAlchemy type | Explicit `VARCHAR` type. Required if you need a length limit e.g. `String(255)`. Without it, SQLAlchemy infers the type from `Mapped[str]` as an unbounded `VARCHAR`. |
| `String(n)` | SQLAlchemy type | `VARCHAR(n)` — sets a maximum character length. Needed for MySQL/MariaDB on indexed/unique string columns. |

> For `int`, `float`, `bool`, `date`, `datetime` columns you do **not** need to pass a type —
> SQLAlchemy infers `INTEGER`, `FLOAT`, `BOOLEAN`, `DATE`, `DATETIME` automatically from the `Mapped[T]` annotation.

---

## Quick Reference — Patterns Used in This Project

```python
# Primary key
id: Mapped[int] = mapped_column(primary_key=True, index=True)

# Required foreign key with cascade delete
user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)

# Optional foreign key (SET NULL on delete)
recurring_rule_id: Mapped[Optional[int]] = mapped_column(
    ForeignKey("recurring_rules.id", ondelete="SET NULL"), nullable=True
)

# Required string column
category: Mapped[str] = mapped_column(String)

# Optional string column
description: Mapped[Optional[str]] = mapped_column(String, nullable=True)

# Boolean with Python-side default
is_active: Mapped[bool] = mapped_column(default=True)

# String with Python-side default
period: Mapped[str] = mapped_column(String, default="monthly")

# Timestamp set by the database on insert
created_at: Mapped[datetime] = mapped_column(server_default=func.now())

# Timestamp auto-updated by SQLAlchemy on every update
updated_at: Mapped[Optional[datetime]] = mapped_column(nullable=True, onupdate=func.now())