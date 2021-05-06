FROM python:3.9.4-alpine
WORKDIR /app
COPY ./requirements.txt ./
RUN pip install --upgrade pip
RUN pip install -r requirements.txt
COPY ./src ./src
EXPOSE 9000
CMD ["python", "./src/main.py"]