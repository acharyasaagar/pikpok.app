#!/bin/sh -ex
docker run -d -p 8080:8080 --name expense-tracker --env-file .env --add-host host.docker.internal:host-gateway expense-tracker:latest 