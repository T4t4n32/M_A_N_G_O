#!/usr/bin/env python3
"""
M.A.N.G.O — Admin CLI

Runs inside the backend Docker container. Use from VPS:
  docker exec -it mango_backend python /app/scripts/admin_cli.py <command> [options]

Commands:
  users list                        List all users with their active tier
  users create --email E --password P [--name N] [--role admin|viewer]
  subs list   [--user-id ID] [--tier TIER] [--active]
  subs grant  --user-id ID --tier TIER [--expires YYYY-MM-DD] [--notes TEXT]
  subs revoke --id SUB_ID
  subs show   --user-id ID

Tiers: dataline_low | dataline_high | institutional
"""

from __future__ import annotations

import argparse
import sys
from datetime import datetime, timezone

# Bootstrap Flask app context
sys.path.insert(0, "/app")
from app import create_app                                      # noqa: E402
from app.extensions import db                                   # noqa: E402
from app.models.user import MangoUser                           # noqa: E402
from app.models.subscription import (                          # noqa: E402
    VALID_TIERS, UserSubscription, default_expires_at, tier_for_user,
)

app = create_app()


# ------------------------------------------------------------------
# Helpers
# ------------------------------------------------------------------

def _print_user(u: MangoUser, *, tier: str | None = None) -> None:
    t = tier or tier_for_user(u)
    status = "active" if u.active else "INACTIVE"
    print(
        f"  [{u.id:>4}] {u.email:<40} role={u.role:<8} tier={t:<16} {status}"
        f"  logins={u.login_count}"
    )


def _print_sub(s: UserSubscription) -> None:
    state = "active" if s.is_active() else ("revoked" if s.revoked_at else "expired")
    exp   = s.expires_at.strftime("%Y-%m-%d") if s.expires_at else "never"
    print(
        f"  [{s.id:>4}] user={s.user_id:<5} tier={s.tier:<16} "
        f"expires={exp:<12} {state}"
    )
    if s.notes:
        print(f"          notes: {s.notes}")


# ------------------------------------------------------------------
# Commands
# ------------------------------------------------------------------

def cmd_users_list(args) -> int:
    users = MangoUser.query.order_by(MangoUser.id).all()
    if not users:
        print("No users registered yet.")
        return 0
    print(f"{'ID':>6}  {'Email':<40} {'Role':<8} {'Tier':<16} {'Status'}")
    print("-" * 90)
    for u in users:
        _print_user(u)
    print(f"\nTotal: {len(users)} users")
    return 0


def cmd_users_create(args) -> int:
    email    = (args.email or "").strip().lower()
    password = args.password or ""
    name     = (args.name or "").strip()
    role     = args.role or "viewer"

    if not email or not password:
        print("ERROR: --email and --password are required")
        return 1
    if len(password) < 8:
        print("ERROR: password must be at least 8 characters")
        return 1
    if role not in ("admin", "viewer"):
        print("ERROR: --role must be 'admin' or 'viewer'")
        return 1

    if MangoUser.query.filter_by(email=email).first():
        print(f"ERROR: {email} is already registered")
        return 1

    is_first = db.session.query(MangoUser.id).first() is None
    user = MangoUser(
        email=email,
        name=name,
        role="admin" if is_first else role,
        active=True,
    )
    user.set_password(password)
    db.session.add(user)
    db.session.commit()

    print(f"Created user id={user.id} email={user.email} role={user.role}")
    if is_first:
        print("(First user — promoted to admin automatically)")
    return 0


def cmd_subs_list(args) -> int:
    q = UserSubscription.query
    if args.user_id:
        q = q.filter_by(user_id=args.user_id)
    if args.tier:
        q = q.filter_by(tier=args.tier)
    subs = q.order_by(UserSubscription.granted_at.desc()).limit(200).all()

    if args.active:
        subs = [s for s in subs if s.is_active()]

    if not subs:
        print("No subscriptions found.")
        return 0

    print(f"{'ID':>6}  {'User':>6}  {'Tier':<16} {'Expires':<12} {'State'}")
    print("-" * 70)
    for s in subs:
        _print_sub(s)
    print(f"\nTotal: {len(subs)}")
    return 0


def cmd_subs_grant(args) -> int:
    if not args.user_id:
        print("ERROR: --user-id is required")
        return 1
    if args.tier not in VALID_TIERS:
        print(f"ERROR: --tier must be one of: {', '.join(VALID_TIERS)}")
        return 1

    user = db.session.get(MangoUser, args.user_id)
    if not user:
        print(f"ERROR: user id={args.user_id} not found")
        return 1

    expires_at = None
    if args.expires:
        try:
            expires_at = datetime.strptime(args.expires, "%Y-%m-%d").replace(tzinfo=timezone.utc)
        except ValueError:
            print("ERROR: --expires must be YYYY-MM-DD")
            return 1
    else:
        expires_at = default_expires_at(args.tier)

    sub = UserSubscription(
        user_id=user.id,
        tier=args.tier,
        expires_at=expires_at,
        notes=(args.notes or "").strip() or None,
    )
    db.session.add(sub)
    db.session.commit()

    exp = expires_at.strftime("%Y-%m-%d") if expires_at else "never"
    print(f"Granted: user={user.email} tier={args.tier} expires={exp} sub_id={sub.id}")
    return 0


def cmd_subs_revoke(args) -> int:
    if not args.id:
        print("ERROR: --id is required")
        return 1

    sub = db.session.get(UserSubscription, args.id)
    if not sub:
        print(f"ERROR: subscription id={args.id} not found")
        return 1
    if sub.revoked_at:
        print(f"Subscription {args.id} was already revoked at {sub.revoked_at}")
        return 1

    sub.revoked_at = datetime.now(timezone.utc)
    db.session.commit()
    print(f"Revoked subscription id={sub.id} (user_id={sub.user_id} tier={sub.tier})")
    return 0


def cmd_subs_show(args) -> int:
    if not args.user_id:
        print("ERROR: --user-id is required")
        return 1

    user = db.session.get(MangoUser, args.user_id)
    if not user:
        print(f"ERROR: user id={args.user_id} not found")
        return 1

    print(f"User: [{user.id}] {user.email}  role={user.role}  tier={tier_for_user(user)}")
    print()

    subs = UserSubscription.history_for_user(user.id, limit=50)
    if not subs:
        print("No subscription history.")
        return 0

    print("Subscription history:")
    for s in subs:
        _print_sub(s)
    return 0


# ------------------------------------------------------------------
# Parser
# ------------------------------------------------------------------

def build_parser() -> argparse.ArgumentParser:
    p = argparse.ArgumentParser(
        prog="admin_cli",
        description="M.A.N.G.O admin CLI — run inside the backend container",
    )
    sub = p.add_subparsers(dest="group")

    # users
    users_p = sub.add_parser("users", help="User management")
    users_sub = users_p.add_subparsers(dest="action")

    users_sub.add_parser("list", help="List all users")

    create_p = users_sub.add_parser("create", help="Create a user")
    create_p.add_argument("--email",    required=True)
    create_p.add_argument("--password", required=True)
    create_p.add_argument("--name",     default="")
    create_p.add_argument("--role",     default="viewer", choices=["admin", "viewer"])

    # subs
    subs_p = sub.add_parser("subs", help="Subscription / tier management")
    subs_sub = subs_p.add_subparsers(dest="action")

    list_p = subs_sub.add_parser("list", help="List subscriptions")
    list_p.add_argument("--user-id", type=int, dest="user_id")
    list_p.add_argument("--tier")
    list_p.add_argument("--active", action="store_true")

    grant_p = subs_sub.add_parser("grant", help="Grant a subscription")
    grant_p.add_argument("--user-id", type=int, required=True, dest="user_id")
    grant_p.add_argument("--tier",    required=True, choices=list(VALID_TIERS))
    grant_p.add_argument("--expires", help="Expiry date YYYY-MM-DD (default: tier default)")
    grant_p.add_argument("--notes",   default="")

    revoke_p = subs_sub.add_parser("revoke", help="Revoke a subscription")
    revoke_p.add_argument("--id", type=int, required=True)

    show_p = subs_sub.add_parser("show", help="Show user's subscription history")
    show_p.add_argument("--user-id", type=int, required=True, dest="user_id")

    return p


def main() -> int:
    parser = build_parser()
    args   = parser.parse_args()

    if not args.group:
        parser.print_help()
        return 0

    with app.app_context():
        if args.group == "users":
            if not getattr(args, "action", None):
                parser.parse_args(["users", "--help"])
                return 0
            if args.action == "list":
                return cmd_users_list(args)
            if args.action == "create":
                return cmd_users_create(args)

        if args.group == "subs":
            if not getattr(args, "action", None):
                parser.parse_args(["subs", "--help"])
                return 0
            if args.action == "list":
                return cmd_subs_list(args)
            if args.action == "grant":
                return cmd_subs_grant(args)
            if args.action == "revoke":
                return cmd_subs_revoke(args)
            if args.action == "show":
                return cmd_subs_show(args)

    parser.print_help()
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
