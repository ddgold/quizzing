from waitress import serve

from environment import checkEnvironmentConfig, getEnvironmentVariable, debugModeOn
from server import app


if __name__ == "__main__":
    checkEnvironmentConfig()

    port = getEnvironmentVariable("JUDGE_PORT")
    if debugModeOn():
        app.run(host="0.0.0.0", port=port, debug=True)
    else:
        print(f"Judge running at http://localhost:{port}", flush=True)
        serve(app, host="0.0.0.0", port=port)
