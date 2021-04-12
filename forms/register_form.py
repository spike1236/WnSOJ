from flask_wtf import FlaskForm
from flask_wtf.file import FileAllowed
from wtforms import PasswordField, StringField, SubmitField, FileField, BooleanField
from wtforms.fields.html5 import EmailField
from wtforms.validators import DataRequired, Length


class RegisterForm(FlaskForm):
    username = StringField('Username', validators=[DataRequired(), Length(min=4, max=15)])
    email = EmailField('Email', validators=[DataRequired()])
    password = PasswordField('Password', validators=[DataRequired(), Length(min=8)])
    password_repeat = PasswordField('Repeat password', validators=[DataRequired(), Length(min=8)])
    fullname = StringField('Full Name')
    icon = FileField('Choose icon', validators=[FileAllowed(['png', 'jpg'], 'Image')])
    phone_number = StringField('Phone number')
    is_business = BooleanField('Are you employer?')
    submit = SubmitField('Register')
