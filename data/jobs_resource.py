from flask import jsonify
from flask_restful import abort, Resource
from data import db_session
from data.jobs import Job


def abort_if_job_not_found(job_id):
    session = db_session.create_session()
    if not session.query(Job).get(job_id):
        abort(404, message=f"Job {job_id} not found")


class JobResource(Resource):
    def get(self, job_id):
        abort_if_job_not_found(job_id)
        session = db_session.create_session()
        job = session.query(Job).filter(Job.id == job_id).first()
        return jsonify({'job': job.to_dict(only=('title', 'user.username'))})


class JobsListResource(Resource):
    def get(self):
        session = db_session.create_session()
        jobs = session.query(Job).all()
        return jsonify({'jobs': [item.to_dict(only=('title', 'user.username')) for item in jobs]})
