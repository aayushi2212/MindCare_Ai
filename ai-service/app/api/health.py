"""
PURPOSE
-------
Exposes a /health endpoint for Docker and load balancer health checks.

RESPONSIBILITIES
-------
- Return service status and model readiness

NEVER
-------
- Perform heavy operations

EXPORTS
-------
router — APIRouter with GET /health

DEPENDS ON
-------
none
"""
