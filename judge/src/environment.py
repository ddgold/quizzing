import os
import sys


def debugModeOn():
    return "--debug" in sys.argv


def verboseModeOn():
    return "--verbose" in sys.argv


# ---------------------
# Environment Variables
# ---------------------
def __checkEnvironmentVariables():
    for variableName in ["JUDGE_PORT", "SECRETS_DIR"]:
        if not os.environ.get(variableName):
            print(f"Required environment variable '{variableName}' not provided.")
            exit()

        if verboseModeOn():
            print(f"Environment variable: {variableName}={os.environ.get(variableName)}")


def getEnvironmentVariable(variableName):
    return os.environ.get(variableName)


# --------------
# Docker Secrets
# --------------
secrets = {}


def __checkDockerSecrets():
    directory = getEnvironmentVariable("SECRETS_DIR")
    for secretName in ["judge_token"]:
        try:
            with open(os.path.join(directory, secretName), "r") as f:
                token = f.read()
                if not token:
                    print(f"Required secret '{secretName}' not provided.")
                    exit()
                secrets[secretName] = token
        except Exception as e:
            print(f"Error reading secret '{secretName}': {e}")
            exit()

        if verboseModeOn():
            print(f"Docker secret: {secretName}={secrets[secretName]}")


def getDockerSecret(secretName):
    return secrets[secretName]


def checkEnvironmentConfig():
    __checkEnvironmentVariables()
    __checkDockerSecrets()
