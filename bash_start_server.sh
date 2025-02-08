#!/bin/bash

source .venv-bash/bin/activate
gunicorn -w 4 -b 127.0.0.1:8000 app:app