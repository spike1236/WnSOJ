from flask import jsonify
from flask_restful import abort, Resource
from data import db_session
from data.problems import Problem


def abort_if_problem_not_found(problem_id):
    session = db_session.create_session()
    if not session.query(Problem).get(problem_id):
        abort(404, message=f"Problem {problem_id} not found")


class ProblemResource(Resource):
    def get(self, problem_id):
        abort_if_problem_not_found(problem_id)
        session = db_session.create_session()
        problem = session.query(Problem).filter(Problem.id == problem_id).first()
        return jsonify({'problem': problem.to_dict(only=('title', 'categories.short_name', 'time_limit', 'memory_limit'))})


class ProblemsListResource(Resource):
    def get(self):
        session = db_session.create_session()
        problems = session.query(Problem).all()
        return jsonify({'problems': [item.to_dict(only=('title', 'categories.short_name', 'time_limit', 'memory_limit'))
                                     for item in problems]})
