import os
from flask import Flask, send_from_directory
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from extensions import mail
from dotenv import load_dotenv

from config import Config
from models import db, User
from routes import api


def create_app():
    load_dotenv()

    app = Flask(__name__)
    app.config.from_object(Config)

    upload_folder = os.path.join(os.getcwd(), "uploads")
    os.makedirs(upload_folder, exist_ok=True)

    app.config["UPLOAD_FOLDER"] = upload_folder
    app.config["MAX_CONTENT_LENGTH"] = 5 * 1024 * 1024

    CORS(
        app,
        resources={
            r"/api/*": {
                "origins": [
                    "http://localhost:5173",
                    "http://127.0.0.1:5173",
                ],
                "methods": ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
                "allow_headers": ["Content-Type", "Authorization"],
                "supports_credentials": True,
            }
        },
    )

    db.init_app(app)
    JWTManager(app)
    mail.init_app(app)

    app.register_blueprint(api, url_prefix="/api")

    @app.get("/")
    def home():
        return {"ok": True, "service": "mess-backend"}

    @app.get("/uploads/<path:filename>")
    def uploaded_file(filename):
        return send_from_directory(app.config["UPLOAD_FOLDER"], filename)

    with app.app_context():
        db.create_all()
        fix_inventory_columns()
        seed_admin()

    return app


def fix_inventory_columns():
    try:
        engine_name = db.engine.url.get_backend_name()

        if engine_name == "sqlite":
            result = db.session.execute(db.text("PRAGMA table_info(inventory)"))
            existing_columns = [row[1] for row in result.fetchall()]

            if "price_per_unit" not in existing_columns:
                db.session.execute(
                    db.text("ALTER TABLE inventory ADD COLUMN price_per_unit FLOAT DEFAULT 0")
                )

            if "updated_at" not in existing_columns:
                db.session.execute(
                    db.text("ALTER TABLE inventory ADD COLUMN updated_at DATETIME")
                )

            db.session.commit()

        else:
            result = db.session.execute(db.text("SHOW COLUMNS FROM inventory"))
            existing_columns = [row[0] for row in result.fetchall()]

            if "price_per_unit" not in existing_columns:
                db.session.execute(
                    db.text("ALTER TABLE inventory ADD COLUMN price_per_unit FLOAT DEFAULT 0")
                )

            if "updated_at" not in existing_columns:
                db.session.execute(
                    db.text("ALTER TABLE inventory ADD COLUMN updated_at DATETIME NULL")
                )

            db.session.commit()

        print("✅ Inventory columns checked successfully")

    except Exception as e:
        db.session.rollback()
        print("❌ Inventory column fix failed:", e)


def seed_admin():
    if not User.query.filter_by(email="admin@mess.com").first():
        admin = User(
            name="Admin",
            email="admin@mess.com",
            role="Admin",
            contact="9999999999",
            room_no="A-101",
        )
        admin.set_password("Admin@123")
        db.session.add(admin)
        db.session.commit()


app = create_app()

if __name__ == "__main__":
    app.run(host="127.0.0.1", port=5000, debug=True)