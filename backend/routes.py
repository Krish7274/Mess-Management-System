from flask import Blueprint, request, jsonify
from flask_jwt_extended import (
    create_access_token, jwt_required, get_jwt, get_jwt_identity
)
from models import db, User, Menu, Attendance, Bill, Payment, Inventory, Complaint, Notification

api = Blueprint("api", __name__)


def require_roles(*roles):
    def wrapper_fn():
        role = get_jwt().get("role")
        return role in roles
    return wrapper_fn


# ---------- AUTH ----------
@api.post("/auth/register")
def register():
    data = request.get_json() or {}

    name = (data.get("name") or "").strip()
    email = (data.get("email") or "").lower().strip()
    password = data.get("password") or ""
    role = data.get("role") or "User"

    if not name or not email or not password:
        return jsonify({"error": "name, email, password required"}), 400

    if User.query.filter_by(email=email).first():
        return jsonify({"error": "Email already exists"}), 409

    # self-register should normally become User
    if role not in ["Admin", "User", "Staff"]:
        role = "User"

    u = User(
        name=name,
        email=email,
        role=role,
        contact=data.get("contact"),
        room_no=data.get("room_no")
    )
    u.set_password(password)
    db.session.add(u)
    db.session.commit()

    return jsonify({"message": "Registered successfully"}), 201


@api.post("/auth/login")
def login():
    data = request.get_json() or {}
    email = (data.get("email") or "").lower().strip()
    password = data.get("password") or ""

    u = User.query.filter_by(email=email).first()
    if not u or not u.check_password(password):
        return jsonify({"error": "Invalid email or password"}), 401

    token = create_access_token(
        identity=str(u.id),
        additional_claims={"role": u.role, "name": u.name, "email": u.email}
    )

    return jsonify({
        "access_token": token,
        "user": {
            "id": u.id,
            "name": u.name,
            "email": u.email,
            "role": u.role
        }
    })


@api.post("/auth/reset-password")
def reset_password():
    data = request.get_json() or {}
    email = (data.get("email") or "").lower().strip()
    new_password = data.get("new_password") or ""

    if not email or not new_password:
        return jsonify({"error": "email and new_password required"}), 400

    u = User.query.filter_by(email=email).first()
    if not u:
        return jsonify({"error": "User not found"}), 404

    u.set_password(new_password)
    db.session.commit()
    return jsonify({"message": "Password updated"})


# ---------- USER ----------
@api.get("/users/me")
@jwt_required()
def me():
    uid = int(get_jwt_identity())
    u = User.query.get_or_404(uid)

    return jsonify({
        "id": u.id,
        "name": u.name,
        "email": u.email,
        "role": u.role,
        "contact": u.contact,
        "room_no": u.room_no
    })


@api.put("/users/me")
@jwt_required()
def update_me():
    uid = int(get_jwt_identity())
    u = User.query.get_or_404(uid)

    data = request.get_json() or {}
    u.name = data.get("name", u.name)
    u.contact = data.get("contact", u.contact)
    u.room_no = data.get("room_no", u.room_no)

    db.session.commit()
    return jsonify({"message": "Profile updated"})


@api.get("/users")
@jwt_required()
def list_users():
    if not require_roles("Admin", "Staff")():
        return jsonify({"error": "Forbidden"}), 403

    users = User.query.order_by(User.id.desc()).all()
    return jsonify([
        {
            "id": u.id,
            "name": u.name,
            "email": u.email,
            "role": u.role
        }
        for u in users
    ])


# ---------- MENU ----------
@api.get("/menu")
@jwt_required()
def get_menu():
    items = Menu.query.order_by(Menu.id.desc()).limit(50).all()
    return jsonify([
        {
            "id": m.id,
            "date": m.date,
            "meal_type": m.meal_type,
            "items": m.items
        }
        for m in items
    ])


@api.post("/menu")
@jwt_required()
def add_menu():
    if not require_roles("Admin", "Staff")():
        return jsonify({"error": "Forbidden"}), 403

    data = request.get_json() or {}
    if not data.get("date") or not data.get("meal_type") or not data.get("items"):
        return jsonify({"error": "date, meal_type, items required"}), 400

    m = Menu(
        date=data["date"],
        meal_type=data["meal_type"],
        items=data["items"]
    )
    db.session.add(m)
    db.session.commit()
    return jsonify({"message": "Menu added"}), 201


# ---------- ATTENDANCE ----------
@api.get("/attendance")
@jwt_required()
def attendance_list():
    role = get_jwt().get("role")
    uid = int(get_jwt_identity())

    date = request.args.get("date")
    meal_type = request.args.get("meal_type")

    q = Attendance.query

    if role not in ["Admin", "Staff"]:
        q = q.filter_by(user_id=uid)

    if date:
        q = q.filter_by(date=date)
    if meal_type:
        q = q.filter_by(meal_type=meal_type)

    items = q.order_by(Attendance.id.desc()).limit(300).all()

    return jsonify([
        {
            "id": a.id,
            "user_id": a.user_id,
            "date": a.date,
            "meal_type": a.meal_type,
            "status": a.status
        }
        for a in items
    ])


@api.post("/attendance")
@jwt_required()
def mark_attendance():
    data = request.get_json() or {}

    role = get_jwt().get("role")
    logged_in_uid = int(get_jwt_identity())

    date = data.get("date")
    meal_type = data.get("meal_type")
    status = data.get("status")

    if not date or not meal_type or not status:
        return jsonify({"error": "date, meal_type, status required"}), 400

    if meal_type not in ["Breakfast", "Lunch", "Dinner"]:
        return jsonify({"error": "meal_type must be Breakfast/Lunch/Dinner"}), 400

    if status not in ["Taken", "Skipped"]:
        return jsonify({"error": "status must be Taken/Skipped"}), 400

    target_user_id = logged_in_uid

    if role in ["Admin", "Staff"] and data.get("user_id") is not None:
        try:
            target_user_id = int(data.get("user_id"))
        except Exception:
            return jsonify({"error": "user_id must be a number"}), 400

    existing = Attendance.query.filter_by(
        user_id=target_user_id,
        date=date,
        meal_type=meal_type
    ).first()

    if existing:
        existing.status = status
        db.session.commit()
        return jsonify({"message": "Attendance updated"}), 200

    a = Attendance(
        user_id=target_user_id,
        date=date,
        meal_type=meal_type,
        status=status
    )
    db.session.add(a)
    db.session.commit()
    return jsonify({"message": "Attendance saved"}), 201


# ---------- BILLING ----------
@api.get("/billing/my")
@jwt_required()
def my_bills():
    uid = int(get_jwt_identity())
    bills = Bill.query.filter_by(user_id=uid).order_by(Bill.id.desc()).all()

    return jsonify([
        {
            "id": b.id,
            "month": b.month,
            "amount": b.amount,
            "status": b.status
        }
        for b in bills
    ])


@api.post("/billing/create")
@jwt_required()
def create_bill():
    if not require_roles("Admin")():
        return jsonify({"error": "Forbidden"}), 403

    data = request.get_json() or {}
    b = Bill(
        user_id=int(data["user_id"]),
        month=data["month"],
        amount=float(data["amount"]),
        status="Unpaid"
    )
    db.session.add(b)
    db.session.commit()
    return jsonify({"message": "Bill created"}), 201


@api.post("/billing/pay")
@jwt_required()
def pay():
    data = request.get_json() or {}
    bill_id = int(data.get("bill_id", 0))
    mode = data.get("mode")

    if mode not in ["Cash", "UPI", "NetBanking"]:
        return jsonify({"error": "mode must be Cash/UPI/NetBanking"}), 400

    b = Bill.query.get_or_404(bill_id)
    b.status = "Paid"
    p = Payment(bill_id=b.id, mode=mode)
    db.session.add(p)
    db.session.commit()
    return jsonify({"message": "Paid"}), 200


# ---------- INVENTORY ----------
@api.get("/inventory")
@jwt_required()
def inv_list():
    items = Inventory.query.order_by(Inventory.id.desc()).all()

    return jsonify([
        {
            "id": i.id,
            "category": i.category,
            "name": i.name,
            "qty": i.qty,
            "low_limit": i.low_limit,
            "low": i.qty <= i.low_limit
        }
        for i in items
    ])


@api.post("/inventory")
@jwt_required()
def inv_add():
    if not require_roles("Admin", "Staff")():
        return jsonify({"error": "Forbidden"}), 403

    data = request.get_json() or {}
    i = Inventory(
        category=data.get("category", "Groceries"),
        name=data.get("name", ""),
        qty=float(data.get("qty", 0)),
        low_limit=float(data.get("low_limit", 5))
    )

    if not i.name:
        return jsonify({"error": "name required"}), 400

    db.session.add(i)
    db.session.commit()
    return jsonify({"message": "Inventory added"}), 201


# ---------- COMPLAINTS ----------
@api.get("/complaints")
@jwt_required()
def complaints_list():
    uid = int(get_jwt_identity())
    role = get_jwt().get("role")

    q = Complaint.query
    if role not in ["Admin", "Staff"]:
        q = q.filter_by(user_id=uid)

    items = q.order_by(Complaint.id.desc()).limit(80).all()

    return jsonify([
        {
            "id": c.id,
            "user_id": c.user_id,
            "type": c.type,
            "message": c.message,
            "status": c.status,
            "created_at": c.created_at.isoformat()
        }
        for c in items
    ])


@api.post("/complaints")
@jwt_required()
def complaint_add():
    uid = int(get_jwt_identity())
    data = request.get_json() or {}

    ctype = data.get("type")
    msg = (data.get("message") or "").strip()

    if not ctype or not msg:
        return jsonify({"error": "type and message required"}), 400

    c = Complaint(user_id=uid, type=ctype, message=msg)
    db.session.add(c)
    db.session.commit()
    return jsonify({"message": "Complaint submitted"}), 201


@api.put("/complaints/<int:cid>/status")
@jwt_required()
def complaint_status(cid):
    if not require_roles("Admin", "Staff")():
        return jsonify({"error": "Forbidden"}), 403

    data = request.get_json() or {}
    st = data.get("status")

    if st not in ["Open", "Resolved"]:
        return jsonify({"error": "status must be Open/Resolved"}), 400

    c = Complaint.query.get_or_404(cid)
    c.status = st
    db.session.commit()
    return jsonify({"message": "Status updated"})


# ---------- NOTIFICATIONS ----------
@api.get("/notifications")
@jwt_required()
def notif_list():
    role = get_jwt().get("role")
    items = Notification.query.order_by(Notification.id.desc()).limit(50).all()

    res = []
    for n in items:
        if n.role_target is None or n.role_target == role:
            res.append({
                "id": n.id,
                "title": n.title,
                "message": n.message,
                "role_target": n.role_target,
                "created_at": n.created_at.isoformat()
            })

    return jsonify(res)


@api.post("/notifications")
@jwt_required()
def notif_add():
    if not require_roles("Admin", "Staff")():
        return jsonify({"error": "Forbidden"}), 403

    data = request.get_json() or {}
    title = (data.get("title") or "").strip()
    message = (data.get("message") or "").strip()
    role_target = data.get("role_target")

    if not title or not message:
        return jsonify({"error": "title and message required"}), 400

    if role_target not in [None, "Admin", "User", "Staff"]:
        return jsonify({"error": "role_target invalid"}), 400

    n = Notification(title=title, message=message, role_target=role_target)
    db.session.add(n)
    db.session.commit()
    return jsonify({"message": "Notification created"}), 201