from flask_wtf import FlaskForm
from wtforms.validators import DataRequired
from wtforms import SubmitField, TextAreaField, StringField


class AddJobForm(FlaskForm):
    title = StringField('Title', validators=[DataRequired()])
    short_info = TextAreaField('Short Info', validators=[DataRequired()])
    whole_info = TextAreaField('Whole Info', validators=[DataRequired()])
    submit = SubmitField('Add job')
