import os
from flask import Flask, send_from_directory
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from dotenv import load_dotenv

from config import Config
from models import db, User
from routes import api

def create_app():
    load_dotenv()
    app = Flask(__name__)
    app.config.from_object(Config)

    # upload folder
    upload_folder = os.path.join(os.getcwd(), "uploads")
    os.makedirs(upload_folder, exist_ok=True)
    app.config["UPLOAD_FOLDER"] = upload_folder
    app.config["MAX_CONTENT_LENGTH"] = 5 * 1024 * 1024  # 5 MB

    CORS(app, resources={r"/*": {"origins": "*"}})

    db.init_app(app)
    JWTManager(app)

    app.register_blueprint(api, url_prefix="/api")

    @app.get("/")
    def home():
      return {"ok": True, "service": "mess-backend"}

    @app.get("/uploads/<path:filename>")
    def uploaded_file(filename):
        return send_from_directory(app.config["UPLOAD_FOLDER"], filename)

    with app.app_context():
        db.create_all()
        seed_admin()

    return app

def seed_admin():
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