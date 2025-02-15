# Events Search App
## Created by Aditya Pathak

### Local Setup Instructions
- Make sure Python is installed in your system.

- For Linux Kernel (using Terminal bash/WSL for Windows):
    1. Open Terminal/WSL bash.
    2. Navigate to root folder of the application.
    3. Execute bash_init.sh script to intialize the Python Virtual Environment and install required modules.
    4. Enter values of REDIS_URL, MAIL_USERNAME, MAIL_PASSWORD, MAIL_DEFAULT_SENDER in .env file in application root.
    5. Execute bash_start_server.sh to start the gunicorn web server.
    6. Open your web browser and navigate to localhost:8000 to view the web app.

### Live Version - [Events Search App](https://events-search-app.onrender.com)