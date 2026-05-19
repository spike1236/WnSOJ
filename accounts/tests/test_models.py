from django.test import TestCase

from accounts.tests.helpers import create_user


class UserIconURLTests(TestCase):
    def test_negative_icon_id_uses_default_icon_urls(self):
        user = create_user("default-icon", icon_id=-123)

        self.assertEqual(user.icon64_url, "/media/users_icons/icon64/default.png")
        self.assertEqual(user.icon170_url, "/media/users_icons/icon170/default.png")

    def test_positive_icon_id_uses_user_icon_urls(self):
        user = create_user("custom-icon", icon_id=123)

        self.assertEqual(user.icon64_url, "/media/users_icons/icon64/123.png")
        self.assertEqual(user.icon170_url, "/media/users_icons/icon170/123.png")
