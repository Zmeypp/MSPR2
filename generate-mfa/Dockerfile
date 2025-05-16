FROM python:3.11-slim

WORKDIR /function

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY handler.py .

ENV fprocess="python3 handler.py"
ENV mode="http"

CMD ["python3", "handler.py"]
