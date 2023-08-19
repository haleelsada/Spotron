from flask import Flask, request, jsonify, render_template, redirect, url_for
import spotter

app = Flask(__name__)


@app.route('/')
def landing_page():
    return 'landing'


if __name__ == '__main__':
    app.run(debug=True)