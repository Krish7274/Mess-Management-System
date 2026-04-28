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


def send_user_welcome_email(to_email, user_name, temp_password):
    try:
        msg = Message(
            subject="Your Mess Management Account Has Been Created",
            recipients=[to_email],
            body=f"""
Hello {user_name},

Your Mess Management System account has been created successfully.

Temporary Password: {temp_password}

Please login using your email and this temporary password.
After login, you must change your password before using the system.

Thank you.
Mess Management System
"""
        )
        mail.send(msg)
        print(f"✅ Welcome email sent to {to_email}")
    except Exception as e:
        print(f"❌ Welcome email sending failed to {to_email}: {str(e)}")
        raise


def send_meal_plan_email(to_email, user_name, plan_date, selected_meals):
    try:
        meals_text = ", ".join(selected_meals) if selected_meals else "No meals selected"

        msg = Message(
            subject="Meal Confirmation Saved - Mess Management System",
            recipients=[to_email],
            body=f"""
Hello {user_name},

Your meal confirmation has been saved successfully.

Date: {plan_date}
Selected Meals: {meals_text}

Admin will use this confirmation to plan the food quantity.

Thank you.
Mess Management System
"""
        )
        mail.send(msg)
        print(f"✅ Meal confirmation email sent to {to_email}")
    except Exception as e:
        print(f"❌ Meal confirmation email failed to {to_email}: {str(e)}")
        raise


def send_meal_confirmation_email(
    to_email,
    user_name,
    plan_date,
    selected_meals,
    total_amount
):
    try:
        meal_lines = ""

        for meal in selected_meals:
            meal_lines += f"{meal['name']}: ₹{meal['price']}\n"

        if not meal_lines:
            meal_lines = "No meals selected\n"

        msg = Message(
            subject="Mess Management System - Meal Confirmation Saved",
            recipients=[to_email],
            body=f"""
Hello {user_name},

Your meal confirmation has been saved successfully.

Date: {plan_date}

Selected Meals:
{meal_lines}
Total Estimated Amount: ₹{total_amount}


Thank you.
Mess Management System
"""
        )

        mail.send(msg)
        print(f"✅ Meal confirmation email with price sent to {to_email}")

    except Exception as e:
        print(f"❌ Meal confirmation email with price failed to {to_email}: {str(e)}")
        raise