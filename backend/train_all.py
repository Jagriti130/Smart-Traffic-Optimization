from ml_model import train_ml
from rl_env import train_rl

if __name__ == "__main__":
    print("Training Machine Learning model...")
    train_ml()
    print("\nTraining Reinforcement Learning model...")
    train_rl()
    print("\n🎉 All models are ready!")