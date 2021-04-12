from flask_wtf import FlaskForm
from wtforms import SubmitField


class SubmitForm(FlaskForm):
    submit = SubmitField('Submit')
