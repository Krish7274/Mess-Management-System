from flask import Flask
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from dotenv import load_dotenv

from config import Config
from models import db, User
from routes import api  # ✅ your routes.py blueprint


def create_app():
    load_dotenv()

    app = Flask(__name__)
    app.config.from_object(Config)

    # ✅ Enable CORS for frontend
    CORS(app, resources={r"/*": {"origins": "*"}})

    # ✅ Init DB + JWT
    db.init_app(app)
    JWTManager(app)

    # ✅ Register blueprint ONLY ONCE
    app.register_blueprint(api, url_prefix="/api")

    # ✅ Create tables + seed admin
    with app.app_context():
        db.create_all()
        seed_admin()

    @app.get("/")
    def home():
        return {"ok": True, "service": "mess-backend"}

    return app


def seed_admin():
    """Create default admin if not exists"""
    if not User.query.filter_by(email="admin@mess.com").first():
        admin = User(
            name="Admin",
            email="admin@mess.com",
            role="Admin",
            contact="9999999999",
            room_no="A-101"
        )
        admin.set_password("Admin@123")
        db.session.add(admin)
        db.session.commit()


app = create_app()

if __name__ == "__main__":
    app.run(host="127.0.0.1", port=5000, debug=True)