from flask_wtf import FlaskForm
from wtforms.validators import DataRequired, Length
from wtforms import SubmitField, TextAreaField, StringField


class AddJobForm(FlaskForm):
    title = StringField('Title', validators=[DataRequired(), Length(max=30)])
    short_info = TextAreaField('Short Info', validators=[DataRequired(), Length(max=200)])
    whole_info = TextAreaField('Whole Info', validators=[DataRequired(), Length(max=500)])
    submit = SubmitField('Add job')
