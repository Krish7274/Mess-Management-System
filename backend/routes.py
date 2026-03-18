import random
from datetime import datetime, timedelta

from flask import Blueprint, request, jsonify
from flask_jwt_extended import (
    create_access_token, jwt_required, get_jwt, get_jwt_identity
)

from models import (
    db,
    User,
    Bill,
    Notification,
    EmailOTP,
    Menu,
    Attendance,
    Inventory,
    Complaint,
)
from utils.email_service import send_bill_email, send_otp_email

api = Blueprint("api", __name__)


# -----------------------------
# ROLE CHECK
# -----------------------------
def require_roles(*roles):
    def wrapper():
        claims = get_jwt()
        return claims.get("role") in roles
    return wrapper


# -----------------------------
# SEND OTP
# -----------------------------
@api.post("/auth/send-otp")
def send_otp():
    try:
        data = request.get_json() or {}
        email = (data.get("email") or "").lower().strip()

        if not email:
            return jsonify({"error": "Email required"}), 400

        if User.query.filter_by(email=email).first():
            return jsonify({"error": "Email already exists"}), 409

        otp = str(random.randint(100000, 999999))
        expires = datetime.utcnow() + timedelta(minutes=10)

        EmailOTP.query.filter_by(email=email).delete()

        new_otp = EmailOTP(
            email=email,
            otp=otp,
            expires_at=expires
        )
        db.session.add(new_otp)
        db.session.commit()

        send_otp_email(email, otp)

        return jsonify({"message": "OTP sent successfully"}), 200

    except Exception as e:
        db.session.rollback()
        print("OTP ERROR:", e)
        return jsonify({"error": "Failed to send OTP"}), 500


# -----------------------------
# REGISTER WITH OTP
# -----------------------------
@api.post("/auth/register")
def register():
    try:
        data = request.get_json() or {}

        name = (data.get("name") or "").strip()
        email = (data.get("email") or "").lower().strip()
        password = data.get("password")
        contact = data.get("contact")
        room_no = data.get("room_no")
        otp = (data.get("otp") or "").strip()

        if not name or not email or not password or not otp:
            return jsonify({"error": "All fields + OTP required"}), 400

        if User.query.filter_by(email=email).first():
            return jsonify({"error": "Email already exists"}), 409

        otp_row = EmailOTP.query.filter_by(email=email, otp=otp).first()

        if not otp_row:
            return jsonify({"error": "Invalid OTP"}), 400

        if datetime.utcnow() > otp_row.expires_at:
            return jsonify({"error": "OTP expired"}), 400

        user = User(
            name=name,
            email=email,
            contact=contact,
            room_no=room_no,
            role="User"
        )
        user.set_password(password)

        db.session.add(user)
        db.session.delete(otp_row)
        db.session.commit()

        return jsonify({"message": "Registered successfully"}), 201

    except Exception as e:
        db.session.rollback()
        print("REGISTER ERROR:", e)
        return jsonify({"error": "Registration failed"}), 500


# -----------------------------
# LOGIN
# -----------------------------
@api.post("/auth/login")
def login():
    try:
        data = request.get_json() or {}
        email = (data.get("email") or "").lower().strip()
        password = data.get("password") or ""

        if not email or not password:
            return jsonify({"error": "email and password required"}), 400

        u = User.query.filter_by(email=email).first()
        if not u or not u.check_password(password):
            return jsonify({"error": "Invalid email or password"}), 401

        token = create_access_token(
            identity=str(u.id),
            additional_claims={
                "role": u.role,
                "name": u.name,
                "email": u.email
            }
        )

        return jsonify({
            "access_token": token,
            "user": {
                "id": u.id,
                "name": u.name,
                "email": u.email,
                "role": u.role
            }
        }), 200

    except Exception as e:
        print("LOGIN ERROR:", str(e))
        return jsonify({"error": "Login failed"}), 500


# -----------------------------
# GET CURRENT USER
# -----------------------------
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


# -----------------------------
# GET ALL USERS (ADMIN / STAFF)
# -----------------------------
@api.get("/users")
@jwt_required()
def list_users():
    role = get_jwt().get("role")

    if role not in ["Admin", "Staff"]:
        return jsonify({"error": "Forbidden"}), 403

    users = User.query.order_by(User.id.desc()).all()

    return jsonify([
        {
            "id": u.id,
            "name": u.name,
            "email": u.email,
            "role": u.role,
            "contact": u.contact,
            "room_no": u.room_no
        }
        for u in users
    ])


# -----------------------------
# UPDATE USER ROLE (ADMIN ONLY)
# -----------------------------
@api.put("/users/<int:user_id>/role")
@jwt_required()
def update_user_role(user_id):
    role = get_jwt().get("role")

    if role != "Admin":
        return jsonify({"error": "Forbidden"}), 403

    data = request.get_json() or {}
    new_role = data.get("role")

    if new_role not in ["Admin", "User", "Staff"]:
        return jsonify({"error": "role must be Admin, User, or Staff"}), 400

    user = User.query.get_or_404(user_id)
    user.role = new_role
    db.session.commit()

    return jsonify({
        "message": f"{user.name} role updated to {new_role}",
        "user": {
            "id": user.id,
            "name": user.name,
            "email": user.email,
            "role": user.role
        }
    }), 200


# -----------------------------
# MENU
# -----------------------------
@api.get("/menu")
@jwt_required()
def get_menu():
    items = Menu.query.order_by(Menu.id.desc()).all()

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

    try:
        data = request.get_json() or {}

        date = (data.get("date") or "").strip()
        meal_type = (data.get("meal_type") or "").strip()
        items = (data.get("items") or "").strip()

        if not date or not meal_type or not items:
            return jsonify({"error": "date, meal_type, items required"}), 400

        if meal_type not in ["Breakfast", "Lunch", "Dinner"]:
            return jsonify({"error": "meal_type must be Breakfast/Lunch/Dinner"}), 400

        menu = Menu(
            date=date,
            meal_type=meal_type,
            items=items
        )
        db.session.add(menu)
        db.session.commit()

        return jsonify({"message": "Menu added successfully"}), 201

    except Exception as e:
        db.session.rollback()
        print("MENU ERROR:", e)
        return jsonify({"error": "Failed to add menu"}), 500


# -----------------------------
# ATTENDANCE
# -----------------------------
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

    items = q.order_by(Attendance.id.desc()).all()

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
    try:
        data = request.get_json() or {}

        role = get_jwt().get("role")
        logged_in_uid = int(get_jwt_identity())

        date = (data.get("date") or "").strip()
        meal_type = (data.get("meal_type") or "").strip()
        status = (data.get("status") or "").strip()

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
            return jsonify({"message": "Attendance updated successfully"}), 200

        new_attendance = Attendance(
            user_id=target_user_id,
            date=date,
            meal_type=meal_type,
            status=status
        )
        db.session.add(new_attendance)
        db.session.commit()

        return jsonify({"message": "Attendance saved successfully"}), 201

    except Exception as e:
        db.session.rollback()
        print("ATTENDANCE ERROR:", e)
        return jsonify({"error": "Failed to save attendance"}), 500


# -----------------------------
# INVENTORY
# -----------------------------
@api.get("/inventory")
@jwt_required()
def get_inventory():
    items = Inventory.query.order_by(Inventory.id.desc()).all()

    return jsonify([
        {
            "id": i.id,
            "category": i.category,
            "name": i.name,
            "qty": i.qty,
            "low_limit": i.low_limit
        }
        for i in items
    ])


@api.post("/inventory")
@jwt_required()
def add_inventory():
    if not require_roles("Admin", "Staff")():
        return jsonify({"error": "Forbidden"}), 403

    try:
        data = request.get_json() or {}

        category = (data.get("category") or "").strip()
        name = (data.get("name") or "").strip()
        qty = data.get("qty")
        low_limit = data.get("low_limit")

        if not category or not name:
            return jsonify({"error": "category and name required"}), 400

        try:
            qty = float(qty if qty is not None else 0)
            low_limit = float(low_limit if low_limit is not None else 5)
        except Exception:
            return jsonify({"error": "qty and low_limit must be numbers"}), 400

        item = Inventory(
            category=category,
            name=name,
            qty=qty,
            low_limit=low_limit
        )
        db.session.add(item)
        db.session.commit()

        return jsonify({"message": "Inventory added successfully"}), 201

    except Exception as e:
        db.session.rollback()
        print("INVENTORY ERROR:", e)
        return jsonify({"error": "Failed to add inventory"}), 500


# -----------------------------
# COMPLAINTS
# -----------------------------
@api.get("/complaints")
@jwt_required()
def get_complaints():
    role = get_jwt().get("role")
    uid = int(get_jwt_identity())

    q = Complaint.query

    if role not in ["Admin", "Staff"]:
        q = q.filter_by(user_id=uid)

    items = q.order_by(Complaint.id.desc()).all()

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
def add_complaint():
    try:
        uid = int(get_jwt_identity())
        data = request.get_json() or {}

        complaint_type = (data.get("type") or "").strip()
        message = (data.get("message") or "").strip()

        if not complaint_type or not message:
            return jsonify({"error": "type and message required"}), 400

        complaint = Complaint(
            user_id=uid,
            type=complaint_type,
            message=message
        )
        db.session.add(complaint)
        db.session.commit()

        return jsonify({"message": "Complaint submitted successfully"}), 201

    except Exception as e:
        db.session.rollback()
        print("COMPLAINT ERROR:", e)
        return jsonify({"error": "Failed to submit complaint"}), 500


@api.put("/complaints/<int:cid>/status")
@jwt_required()
def update_complaint_status(cid):
    if not require_roles("Admin", "Staff")():
        return jsonify({"error": "Forbidden"}), 403

    try:
        data = request.get_json() or {}
        status = (data.get("status") or "").strip()

        if status not in ["Open", "Resolved"]:
            return jsonify({"error": "status must be Open/Resolved"}), 400

        complaint = Complaint.query.get_or_404(cid)
        complaint.status = status
        db.session.commit()

        return jsonify({"message": "Complaint status updated successfully"}), 200

    except Exception as e:
        db.session.rollback()
        print("COMPLAINT STATUS ERROR:", e)
        return jsonify({"error": "Failed to update complaint status"}), 500


# -----------------------------
# NOTIFICATIONS
# -----------------------------
@api.get("/notifications")
@jwt_required()
def get_notifications():
    role = get_jwt().get("role")
    uid = int(get_jwt_identity())

    items = Notification.query.order_by(Notification.id.desc()).all()

    result = []
    for n in items:
        if n.user_id is not None:
            if n.user_id == uid:
                result.append({
                    "id": n.id,
                    "title": n.title,
                    "message": n.message,
                    "user_id": n.user_id,
                    "role_target": n.role_target,
                    "created_at": n.created_at.isoformat()
                })
        else:
            if n.role_target is None or n.role_target == role:
                result.append({
                    "id": n.id,
                    "title": n.title,
                    "message": n.message,
                    "user_id": n.user_id,
                    "role_target": n.role_target,
                    "created_at": n.created_at.isoformat()
                })

    return jsonify(result)


@api.post("/notifications")
@jwt_required()
def add_notification():
    if not require_roles("Admin", "Staff")():
        return jsonify({"error": "Forbidden"}), 403

    try:
        data = request.get_json() or {}

        title = (data.get("title") or "").strip()
        message = (data.get("message") or "").strip()
        role_target = data.get("role_target")
        user_id = data.get("user_id")

        if not title or not message:
            return jsonify({"error": "title and message required"}), 400

        if role_target not in [None, "Admin", "User", "Staff"]:
            return jsonify({"error": "role_target invalid"}), 400

        notification = Notification(
            user_id=user_id,
            title=title,
            message=message,
            role_target=role_target
        )
        db.session.add(notification)
        db.session.commit()

        return jsonify({"message": "Notification created successfully"}), 201

    except Exception as e:
        db.session.rollback()
        print("NOTIFICATION ERROR:", e)
        return jsonify({"error": "Failed to create notification"}), 500


# -----------------------------
# CREATE BILL (ADMIN)
# -----------------------------
@api.post("/billing/create")
@jwt_required()
def create_bill():
    if not require_roles("Admin")():
        return jsonify({"error": "Forbidden"}), 403

    try:
        data = request.get_json() or {}

        user_id = data.get("user_id")
        amount = data.get("amount")
        period = data.get("period")
        bill_type = data.get("bill_type")

        if not user_id or not amount or not period:
            return jsonify({"error": "Missing fields"}), 400

        existing = Bill.query.filter_by(user_id=user_id, month=period).first()
        if existing:
            return jsonify({"error": "Bill already exists"}), 400

        bill = Bill(
            user_id=user_id,
            month=period,
            amount=amount,
            status="Unpaid"
        )
        db.session.add(bill)

        user = User.query.get(user_id)
        if not user:
            return jsonify({"error": "User not found"}), 404

        message = f"Your {bill_type} bill for {period} of ₹{amount} is generated."
        notif = Notification(
            user_id=user.id,
            title="Bill Generated",
            message=message
        )
        db.session.add(notif)

        db.session.commit()

        if user.email:
            send_bill_email(
                user.email,
                user.name,
                bill_type,
                period,
                amount
            )

        return jsonify({"message": "Bill created & email sent"}), 201

    except Exception as e:
        db.session.rollback()
        print("BILL ERROR:", e)
        return jsonify({"error": "Bill creation failed"}), 500


# -----------------------------
# GET MY BILLS
# -----------------------------
@api.get("/billing/my")
@jwt_required()
def my_bills():
    user_id = int(get_jwt_identity())

    bills = Bill.query.filter_by(user_id=user_id).all()

    result = []
    for b in bills:
        result.append({
            "id": b.id,
            "period": b.month,
            "amount": b.amount,
            "status": b.status
        })

    return jsonify(result)


# -----------------------------
# ALL USERS BILL (ADMIN)
# -----------------------------
@api.get("/billing/all")
@jwt_required()
def all_bills():
    if not require_roles("Admin")():
        return jsonify({"error": "Forbidden"}), 403

    bills = Bill.query.all()
    result = []

    for b in bills:
        user = User.query.get(b.user_id)
        if not user:
            continue

        result.append({
            "user": user.name,
            "email": user.email,
            "period": b.month,
            "amount": b.amount,
            "status": b.status
        })

    return jsonify(result)