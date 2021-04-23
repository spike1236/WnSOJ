from flask_wtf import FlaskForm
from wtforms.validators import DataRequired
from wtforms import SubmitField
from flask_wtf.file import FileField, FileAllowed


class ChangeIconForm(FlaskForm):
    icon = FileField("", validators=[FileAllowed(['jpg', 'png'], 'Only image file types for icon allowed!')])
    submit = SubmitField('Change icon')
