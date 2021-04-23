from flask_wtf import FlaskForm
from wtforms import PasswordField, SubmitField
from wtforms.validators import DataRequired, Length


class ChangePasswordForm(FlaskForm):
    old_password = PasswordField('Old password', validators=[DataRequired()])
    password = PasswordField('New password', validators=[DataRequired(), Length(min=8)])
    password_repeat = PasswordField('Repeat new password', validators=[DataRequired(), Length(min=8)])
    submit = SubmitField('Change password')
