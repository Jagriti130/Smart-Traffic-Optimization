import sys
from pathlib import Path
import unittest

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from rl_env import get_action


class RLRouteTests(unittest.TestCase):
    def test_get_action_returns_valid_signal(self):
        action_id, action_name = get_action([10, 8, 12, 6], 18)

        self.assertIn(action_id, [0, 1, 2])
        self.assertTrue(action_name)


if __name__ == "__main__":
    unittest.main()
