from flask_wtf import FlaskForm
from flask_wtf.file import FileAllowed
from wtforms import PasswordField, StringField, SubmitField, FileField, BooleanField, EmailField
from wtforms.validators import DataRequired


class RegisterForm(FlaskForm):
    username = StringField('Username', validators=[DataRequired()])
    email = EmailField('Email', validators=[DataRequired()])
    password = PasswordField('Password', validators=[DataRequired()])
    password_repeat = PasswordField('Repeat password', validators=[DataRequired()])
    fullname = StringField('Full Name')
    icon = FileField('Choose icon', validators=[FileAllowed(['jpg', 'png'], 'Only image file types for icon allowed!')])
    phone_number = StringField('Phone number')
    is_business = BooleanField('Are you employer?')
    submit = SubmitField('Register')
