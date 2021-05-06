import datetime

from flask import Flask, jsonify, request, __version__ as flaskVersion
from flask_httpauth import HTTPTokenAuth

from environment import getDockerSecret
from judge import evaluate

app = Flask(__name__)
auth = HTTPTokenAuth(scheme="Bearer")
startDatetime = datetime.datetime.now()


@auth.verify_token
def verify_token(token):
    return token == getDockerSecret("judge_token")


@app.route("/status", methods=["GET", "POST"])
@auth.login_required
def status():
    data = {"flask_version": flaskVersion, "start_datetime": startDatetime.isoformat()}
    return jsonify(data), 200


@app.route("/judge", methods=["POST"])
@auth.login_required
def judge():
    data = request.get_json()
    if (not data) or ("answer" not in data) or ("guess" not in data):
        return "Incomplete input", 400

    data["result"] = evaluate(data["answer"], data["guess"])
    print(data, flush=True)
    return jsonify(data), 200
