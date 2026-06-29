import time

from django.core.management.base import BaseCommand, CommandError

from problemset.tasks import (
    IsolateBoxLockError,
    acquire_isolate_box_lock,
    current_worker_id,
    default_isolate_box_id,
    process_next_judge_job,
    release_isolate_box_lock,
)


class Command(BaseCommand):
    help = "Run a distributed judge worker that claims JudgeJob rows from the DB."

    def add_arguments(self, parser):
        parser.add_argument(
            "--worker-id",
            default="",
            help="Stable worker id for job leases. Defaults to hostname:pid.",
        )
        parser.add_argument(
            "--once",
            action="store_true",
            help="Process at most one available job and exit.",
        )
        parser.add_argument(
            "--idle-sleep",
            type=float,
            default=1.0,
            help="Seconds to sleep when no job is available.",
        )
        parser.add_argument(
            "--box-id",
            type=int,
            default=None,
            help="Fixed isolate box id owned by this worker process.",
        )

    def handle(self, *args, **options):
        worker_id = options["worker_id"] or current_worker_id()
        once = options["once"]
        idle_sleep = options["idle_sleep"]
        box_id = options["box_id"]
        if box_id is None:
            box_id = default_isolate_box_id()

        try:
            lock_path = acquire_isolate_box_lock(box_id, worker_id)
        except IsolateBoxLockError as exc:
            raise CommandError(str(exc)) from exc

        self.stdout.write(f"Starting judge worker {worker_id} with box {box_id}")

        try:
            while True:
                result = process_next_judge_job(
                    worker_id=worker_id,
                    isolate_box_id=box_id,
                )
                if result.get("processed"):
                    self.stdout.write(f"Processed job: {result}")
                elif once:
                    self.stdout.write(f"No job processed: {result}")
                    return
                else:
                    time.sleep(idle_sleep)

                if once:
                    return
        finally:
            release_isolate_box_lock(lock_path)
