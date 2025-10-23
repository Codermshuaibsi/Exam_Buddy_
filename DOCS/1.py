from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, Image
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.cidfonts import UnicodeCIDFont

# Register Unicode font for icons and text compatibility
pdfmetrics.registerFont(UnicodeCIDFont('HeiseiKakuGo-W5'))

# File path
file_path = "D:/API's/Exam Buddy/DOCS/ExamBuddy_Full_API_Documentation.pdf"

# Create document
doc = SimpleDocTemplate(file_path, pagesize=A4, title="ExamBuddy API Documentation")
styles = getSampleStyleSheet()
styles.add(ParagraphStyle(name='Heading1Custom', fontSize=16, leading=20, spaceAfter=12, textColor=colors.HexColor('#2E86C1'), fontName='HeiseiKakuGo-W5'))
styles.add(ParagraphStyle(name='SubHeading', fontSize=13, leading=16, spaceAfter=10, textColor=colors.HexColor('#1A5276'), fontName='HeiseiKakuGo-W5'))
styles.add(ParagraphStyle(name='NormalCustom', fontSize=10, leading=14, fontName='HeiseiKakuGo-W5'))

content = []

# Header Section
content.append(Paragraph("🧠 <b>ExamBuddy – Complete API Documentation</b>", styles['Heading1Custom']))
content.append(Paragraph("Developed by <b>Mohd Shuaib</b> – BCA 3rd Year Student", styles['NormalCustom']))
content.append(Spacer(1, 10))
content.append(Paragraph("📘 <b>About the Project:</b>", styles['SubHeading']))
content.append(Paragraph("ExamBuddy is a smart academic resource platform built to help students easily access previous year papers, answer keys, and YouTube tutorials in a structured course-wise and semester-wise hierarchy. "
                         "This backend provides secure APIs for authentication, content management, and paper uploads using Node.js, Express, MongoDB, Cloudinary, and JWT authentication.", styles['NormalCustom']))
content.append(Spacer(1, 10))

# Base URL
content.append(Paragraph("🔗 <b>Base URL</b>: https://api.exambuddy.vercel.app/api", styles['NormalCustom']))
content.append(Spacer(1, 10))

# Tech Stack Table
content.append(Paragraph("⚙️ <b>Tech Stack</b>", styles['SubHeading']))
tech_data = [
    ["Node.js + Express.js", "Backend Framework"],
    ["MongoDB + Mongoose", "Database"],
    ["Cloudinary", "File Uploads (images, PDFs)"],
    ["Brevo (SendInBlue)", "Email Sending (OTP verification)"],
    ["JWT", "Authentication Token"],
    ["Multer", "File Upload Middleware"]
]
tech_table = Table(tech_data, colWidths=[180, 300])
tech_table.setStyle(TableStyle([
    ('BACKGROUND', (0, 0), (-1, 0), colors.lightgrey),
    ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
    ('FONTNAME', (0, 0), (-1, -1), 'HeiseiKakuGo-W5'),
    ('FONTSIZE', (0, 0), (-1, -1), 9),
    ('VALIGN', (0, 0), (-1, -1), 'MIDDLE')
]))
content.append(tech_table)
content.append(Spacer(1, 10))

# Authentication Flow
content.append(Paragraph("🔐 <b>Authentication Flow</b>", styles['SubHeading']))
content.append(Paragraph("All protected routes (except register, login, OTP, and password reset) require a JWT token in headers:", styles['NormalCustom']))
content.append(Paragraph("<b>Authorization:</b> Bearer &lt;your_token&gt;", styles['NormalCustom']))
content.append(Spacer(1, 10))

# Example API Section (Register User)
content.append(Paragraph("🧾 <b>Authentication APIs</b>", styles['Heading1Custom']))
content.append(Paragraph("1️⃣ <b>Register User</b>", styles['SubHeading']))
register_table = Table([
    ["Field", "Type", "Required", "Description"],
    ["name", "String", "✅", "Full name"],
    ["email", "String", "✅", "User email"],
    ["password", "String", "✅", "Password"],
    ["course", "String", "✅", "Course name or ID"],
    ["phone", "String", "✅", "Phone number"],
    ["profile", "File", "❌", "Optional profile image (jpg/png)"]
], colWidths=[80, 70, 60, 250])
register_table.setStyle(TableStyle([
    ('BACKGROUND', (0, 0), (-1, 0), colors.lightblue),
    ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
    ('FONTNAME', (0, 0), (-1, -1), 'HeiseiKakuGo-W5'),
    ('FONTSIZE', (0, 0), (-1, -1), 9)
]))
content.append(register_table)
content.append(Spacer(1, 10))
content.append(Paragraph("<b>Response:</b>", styles['NormalCustom']))
content.append(Paragraph('{"message": "OTP sent to email"}', styles['NormalCustom']))

# Footer note
content.append(Spacer(1, 20))
content.append(Paragraph("🧑‍💻 <b>Frontend Notes:</b> Always send JWT tokens in headers for protected routes. File uploads must use multipart/form-data. "
                         "Maintain chain relation of Course → Semester → Subject → Paper using MongoDB IDs.", styles['NormalCustom']))

# Build PDF
doc.build(content)

file_path
