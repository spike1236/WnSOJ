from data import db_session
from data.problems import Problem

db_session.global_init('db/main.sqlite')
session = db_session.create_session()
problem = Problem(
    title='A+B',
    time_limit=1.5,
    memory_limit=256,
    category='Math',
    user_id=1
)
session.add(problem)
session.commit()
