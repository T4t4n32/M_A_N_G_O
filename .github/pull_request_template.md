## Summary

<!-- What does this PR do? Why? Link the related issue if applicable. -->

Fixes #

## Type of change

- [ ] Bug fix
- [ ] New feature
- [ ] Refactor / cleanup
- [ ] Documentation
- [ ] Deployment / infrastructure

## Component affected

- [ ] Backend API
- [ ] Frontend
- [ ] Panel Emma
- [ ] Edge application (Jetson)
- [ ] Firmware (ESP32)
- [ ] Deployment (Docker / nginx)
- [ ] Documentation

## Test plan

<!-- How was this tested? What should a reviewer verify? -->

- [ ] Backend: `docker logs mango_backend` shows no errors
- [ ] Frontend: build passes (`npm run build`)
- [ ] Deployment: `make up` succeeds, `make health` returns `{"status":"ok"}`

## Checklist

- [ ] No secrets, credentials, or `.env` files included
- [ ] Documentation updated if behavior changed
- [ ] Works on the VPS deployment (`make up` from `deploy/vps/`)
