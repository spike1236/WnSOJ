from flask import jsonify
from flask_restful import abort, Resource
from data import db_session
from data.submissions import Submission


def abort_if_submission_not_found(submission_id):
    session = db_session.create_session()
    if not session.query(Submission).get(submission_id):
        abort(404, message=f"Submission {submission_id} not found")


class SubmissionResource(Resource):
    def get(self, submission_id):
        abort_if_submission_not_found(submission_id)
        session = db_session.create_session()
        submission = session.query(Submission).filter(Submission.id == submission_id).first()
        return jsonify({'submission': submission.to_dict(only=('verdict', 'time', 'memory', 'language', 'send_time',
                                                               'user.username'))})


class SubmissionsListResource(Resource):
    def get(self):
        session = db_session.create_session()
        submissions = session.query(Submission).all()
        return jsonify({'submission': [item.to_dict(only=('verdict', 'time', 'memory', 'language',
                                                          'send_time', 'user.username')) for item in submissions]})
