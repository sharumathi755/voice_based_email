# app.py
from flask import Flask, render_template, request, jsonify
import imaplib
import smtplib
import email
from email.mime.text import MIMEText
from email.header import decode_header
import random

app = Flask(__name__)

EMAIL = ""
PASSWORD = ""

@app.route("/")
def home():
    return render_template("index.html")

@app.route("/menu")
def menu():
    return render_template("menu.html")

@app.route("/send")
def send_page():
    return render_template("send.html")

@app.route("/inbox")
def inbox_page():
    return render_template("inbox.html")

@app.route("/otp")
def otp_page():
    return render_template("otp.html")

@app.route("/set_credentials", methods=["POST"])
def set_credentials():
    global EMAIL, PASSWORD

    data = request.json
    email_id = data.get("email")
    password = data.get("password")

    try:
        mail = imaplib.IMAP4_SSL("imap.gmail.com")
        mail.login(email_id, password)
        mail.logout()

        EMAIL = email_id
        PASSWORD = password

        return jsonify({"status": "Login successful"})
    except:
        return jsonify({"error": "Login failed"})

@app.route("/logout")
def logout():
    global EMAIL, PASSWORD
    EMAIL = ""
    PASSWORD = ""
    return jsonify({"status": "Logged out"})

def get_folder_name(folder):

    folder_map = {
        "inbox": "INBOX",
        "sent": '"[Gmail]/Sent Mail"',
        "spam": '"[Gmail]/Spam"',
        "drafts": '"[Gmail]/Drafts"',
        "starred": '"[Gmail]/Starred"'
    }

    return folder_map.get(folder.lower())

@app.route("/folder_count/<folder>")
def folder_count(folder):

    try:
        mail = imaplib.IMAP4_SSL("imap.gmail.com")
        mail.login(EMAIL, PASSWORD)

        folder_name = get_folder_name(folder)
        if not folder_name:
            return jsonify({"error": "Invalid folder"})

        mail.select(folder_name)
        status, data = mail.search(None, "ALL")
        count = len(data[0].split()) if data[0] else 0
        mail.logout()

        return jsonify({"count": count})

    except Exception as e:
        return jsonify({"error": str(e)})

@app.route("/read_latest/<folder>")
def read_latest(folder):

    try:
        mail = imaplib.IMAP4_SSL("imap.gmail.com")
        mail.login(EMAIL, PASSWORD)

        folder_name = get_folder_name(folder)
        if not folder_name:
            return jsonify({"error": "Invalid folder"})

        mail.select(folder_name)
        status, data = mail.search(None, "ALL")

        mail_ids = data[0].split()
        if not mail_ids:
            return jsonify({"message": "No mails in this folder"})

        latest_id = mail_ids[-1]
        status, msg_data = mail.fetch(latest_id, "(RFC822)")
        raw_email = msg_data[0][1]
        msg = email.message_from_bytes(raw_email)

        subject, encoding = decode_header(msg.get("Subject"))[0]
        if isinstance(subject, bytes):
            subject = subject.decode(encoding if encoding else "utf-8")

        sender = msg.get("From")

        mail.logout()

        return jsonify({
            "from": sender,
            "subject": subject
        })

    except Exception as e:
        return jsonify({"error": str(e)})

@app.route("/send_mail", methods=["POST"])
def send_mail():

    try:
        data = request.json

        msg = MIMEText(data["body"])
        msg["From"] = EMAIL
        msg["To"] = data["to"]
        msg["Subject"] = data["subject"]

        server = smtplib.SMTP_SSL("smtp.gmail.com", 465)
        server.login(EMAIL, PASSWORD)
        server.send_message(msg)
        server.quit()

        return jsonify({"status": "Mail sent successfully"})

    except Exception as e:
        return jsonify({"error": str(e)})

@app.route("/generate_otp")
def generate_otp():
    otp = "".join(str(random.randint(0, 9)) for _ in range(4))
    return jsonify({"otp": otp})

if __name__ == "__main__":
    app.run(debug=True)