from flask_wtf import FlaskForm
from flask_wtf.file import FileAllowed
from wtforms.validators import DataRequired
from wtforms import SubmitField, FileField, FloatField, IntegerField, StringField


class AddProblemForm(FlaskForm):
    title = StringField('Title', validators=[DataRequired()])
    category = StringField('Category', validators=[DataRequired()])
    statement = FileField('Statement', validators=[DataRequired(),
                                                   FileAllowed(['html'], 'Statement should be with .html extension!')])
    editorial = FileField('Editorial', validators=[DataRequired(),
                                                   FileAllowed(['html'], 'Editorial should be with .html extension!')])
    time_limit = FloatField('Time limit', validators=[DataRequired()])
    memory_limit = IntegerField('Memory limit', validators=[DataRequired()])
    test_data = FileField('Test data and solution .cpp', validators=[DataRequired(),
                                                                     FileAllowed(['zip'], 'Test data should be with '
                                                                                          '.zip extension!')])
    submit = SubmitField('Add problem')
