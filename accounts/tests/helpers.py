from django.contrib.auth import get_user_model


def create_user(username="user", **overrides):
    defaults = {
        "username": username,
        "email": f"{username}@example.com",
        "password": "password",
        "account_type": 1,
        "icon_id": -12345,
    }
    defaults.update(overrides)
    password = defaults.pop("password")
    return get_user_model().objects.create_user(password=password, **defaults)
