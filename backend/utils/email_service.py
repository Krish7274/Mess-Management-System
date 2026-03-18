from flask_mail import Message
from extensions import mail


def send_bill_email(to_email, user_name, bill_type, period, amount):
    try:
        msg = Message(
            subject="Mess Bill Generated",
            recipients=[to_email],
            body=f"""
Hello {user_name},

Your {bill_type} bill has been generated.

Period: {period}
Amount: ₹{amount}

Please login and pay your bill.

Thank you.
Mess Management System
"""
        )
        mail.send(msg)
        print(f"✅ Bill email sent to {to_email}")
    except Exception as e:
        print(f"❌ Bill email sending failed to {to_email}: {str(e)}")
        raise


def send_otp_email(to_email, otp_code):
    try:
        msg = Message(
            subject="Your Registration OTP - Mess Management System",
            recipients=[to_email],
            body=f"""
Hello,

Your OTP for registration is: {otp_code}

This OTP is valid for 10 minutes.

If you did not request this, please ignore this email.

Thank you.
Mess Management System
"""
        )
        mail.send(msg)
        print(f"✅ OTP email sent to {to_email}")
    except Exception as e:
        print(f"❌ OTP email sending failed to {to_email}: {str(e)}")
        raise