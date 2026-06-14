# AdPilot OS web app — zero-dependency image.
# Build context = the tools/ directory (so the adpilot package ships alongside webapp).
#   cd CPWORK/universal-ads-os/tools
#   docker build -f webapp/Dockerfile -t adpilot-web .
#   docker run -p 8000:8000 adpilot-web   # -> http://localhost:8000
FROM python:3.12-slim
WORKDIR /app
COPY . /app
ENV HOST=0.0.0.0 PORT=8000
EXPOSE 8000
# No pip install — the engine + app use only the Python standard library.
CMD ["python", "-m", "webapp.server"]
