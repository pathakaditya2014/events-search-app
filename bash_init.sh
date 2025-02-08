#!/bin/bash

python3 -m venv .venv-bash && echo "Initialized Virtual Environment"

source .venv-bash/bin/activate && echo "Activated Virtual Environment"

pip install -r requirements.txt && echo "Installed Requirements"

deactivate