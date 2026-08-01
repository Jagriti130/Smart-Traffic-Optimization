import os
from pathlib import Path

import gymnasium as gym
import numpy as np
from gymnasium import spaces
from stable_baselines3 import PPO

BASE_DIR = Path(__file__).resolve().parent.parent
MODEL_DIR = BASE_DIR / "models"
MODEL_PATH = MODEL_DIR / "ppo_traffic.zip"

os.makedirs(MODEL_DIR, exist_ok=True)


class SimpleTrafficEnv(gym.Env):
    def __init__(self):
        super().__init__()
        self.action_space = spaces.Discrete(3)
        self.observation_space = spaces.Box(low=0, high=50, shape=(5,), dtype=np.float32)

    def reset(self, seed=None, options=None):
        super().reset(seed=seed)
        self.queues = np.random.randint(5, 22, size=4).astype(np.float32)
        self.waiting = float(np.mean(self.queues) * 1.6)
        self.steps = 0
        return self._get_obs(), {}

    def _get_obs(self):
        return np.array([*self.queues, self.waiting], dtype=np.float32)

    def step(self, action):
        self.steps += 1

        if action == 0:  # NS Green
            self.queues[0] = max(0, self.queues[0] - 9)
            self.queues[1] = max(0, self.queues[1] - 9)
            self.queues[2] += np.random.randint(1, 5)
            self.queues[3] += np.random.randint(1, 5)
        elif action == 1:  # EW Green
            self.queues[2] = max(0, self.queues[2] - 9)
            self.queues[3] = max(0, self.queues[3] - 9)
            self.queues[0] += np.random.randint(1, 5)
            self.queues[1] += np.random.randint(1, 5)

        self.waiting = float(np.mean(self.queues) * 1.6)
        reward = -self.waiting + 8
        done = self.steps >= 40
        return self._get_obs(), reward, done, False, {}


def train_rl():
    env = SimpleTrafficEnv()
    model = PPO("MlpPolicy", env, verbose=0, n_steps=512, learning_rate=0.0003)
    model.learn(total_timesteps=12000)
    model.save(MODEL_DIR / "ppo_traffic")
    print("✅ RL model trained successfully!")


def get_action(queues, waiting):
    names = ["🟢 Green North-South", "🟢 Green East-West", "⏱️ Extend Green Time"]

    if not MODEL_PATH.exists():
        if waiting > 24:
            return 0, names[0]
        if sum(queues[2:]) > sum(queues[:2]):
            return 1, names[1]
        return 2, names[2]

    model = PPO.load(MODEL_PATH)
    obs = np.array([*queues, waiting], dtype=np.float32)
    action, _ = model.predict(obs, deterministic=True)
    return int(action), names[int(action)]