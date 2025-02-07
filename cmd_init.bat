@echo on

python -m venv .venv-cmd
echo Initialized Virtual Environment

call .venv-cmd/Scripts/activate
echo Initialized Virtual Environment

pip install -r requirements.txt
echo Installed Requirements

deactivate